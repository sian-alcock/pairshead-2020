import csv
import os
import requests
import logging

logger = logging.getLogger(__name__)

from .helpers import decode_utf8
from django.http import Http404
from pprint import pprint
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.pagination import PageNumberPagination

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser, ParseError

from ..serializers import WriteRaceTimesSerializer, RaceTimesSerializer, PopulatedRaceTimesSerializer

from ..models import RaceTime, Crew, Race

# from ..pagination import RaceTimePaginationWithAggregates


class RaceTimeListView(generics.ListCreateAPIView):
    serializer_class = PopulatedRaceTimesSerializer
    queryset = RaceTime.objects.all()
    # pagination_class = RaceTimePaginationWithAggregates
    # PageNumberPagination.page_size_query_param = 'page_size' or 10
    # filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    # ordering_fields = ['sequence']
    # search_fields = ['sequence', 'bib_number', 'tap', 'crew__id', 'crew__name', 'crew__competitor_names',]
    # filterset_fields = ['tap', 'crew__id',]

    # def get_queryset(self):
    #     times = RaceTime.objects.all()
    #     tap = self.request.query_params.get('tap')
    #     queryset = times.filter(tap__exact=tap).order_by('sequence')

    #     times_without_crew = self.request.query_params.get('noCrew')
    #     if times_without_crew == 'true':
    #         queryset = times.filter(tap__exact=tap, crew__isnull=True).order_by('sequence')
    #         return queryset

    #     return queryset


class RaceTimeDetailView(APIView):

    def get_race_time(self, pk):
        try:
            race_time = RaceTime.objects.get(pk=pk)
        except RaceTime.DoesNotExist:
            raise Http404
        return race_time

    def get(self, _request, pk):
        race_time = self.get_race_time(pk)
        serializer = PopulatedRaceTimesSerializer(race_time)
        return Response(serializer.data)

    def put(self, request, pk):
        race_time = self.get_race_time(pk)
        race_time = RaceTime.objects.get(pk=pk)
        serializer = RaceTimesSerializer(race_time, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=422)

    def delete(self, _request, pk):
        race_time = self.get_race_time(pk)
        race_time = RaceTime.objects.get(pk=pk)
        race_time.delete()
        return Response(status=204)


# Import CSV via frontend

class ImportRaceTimes(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request, delete_times=True):
        id = request.GET.get('id')
        if not id:
            return Response({'error': 'ID parameter is required'}, status=400)
        
        try:
            race_id = Race.objects.get(id=id).race_id
        except Race.DoesNotExist:
            return Response({'error': 'Race not found'}, status=404)

        if delete_times:
            race_times_to_delete = RaceTime.objects.filter(race_id=id)
            race_times_to_delete.delete()

        reader = csv.reader(decode_utf8(request.FILES['file']))
        next(reader) # skips the first row
        for row in reader:

            if row:
                data = {
                    'sequence': row[0],
                    'tap': row[3] or 'Finish',
                    'time_tap': row[4],
                    'crew':row[8] or None,
                    'race': id
                }
                serializer = WriteRaceTimesSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        race_times = RaceTime.objects.all()

        serializer = WriteRaceTimesSerializer(race_times, many=True)

        Crew.update_all_computed_properties()

        return Response(serializer.data)


class ImportTimesWebscorer(APIView):

    def get(self, _request, id=None, delete_times=True):

        apiid = os.getenv("WEBSCORERAPI")
        race_id = Race.objects.get(id=id).race_id

        if delete_times:
            race_times_to_delete = RaceTime.objects.filter(race_id=id)
            race_times_to_delete.delete()

        url = 'https://www.webscorer.com/json/fasttaps' 
        payload = {'raceid':race_id, 'apiid':apiid}
        headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        }
        r = requests.get(url, params=payload, headers=headers)

        if r.status_code == 200:
            for tap in r.json()['FastTaps']:

                data = {
                    'sequence': float(tap['Seq #']),
                    'tap': tap['Tap'],
                    'time_tap': tap['Time tap'],
                    'crew': tap['Team name 2'],
                    'race': id
                }

                serializer = WriteRaceTimesSerializer(data=data)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()

            race_times = RaceTime.objects.all()

            serializer = RaceTimesSerializer(race_times, many=True)

            Crew.update_all_computed_properties()

            return Response(serializer.data)
        
        return Response(status=400)