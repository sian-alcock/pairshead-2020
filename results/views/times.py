import csv
import os
import tempfile
from django.http import Http404
from pprint import pprint
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

from ..models import RaceTime, Crew

from ..pagination import RaceTimePaginationWithAggregates


class RaceTimeListView(generics.ListCreateAPIView):
    serializer_class = PopulatedRaceTimesSerializer
    pagination_class = RaceTimePaginationWithAggregates
    PageNumberPagination.page_size_query_param = 'page_size' or 10
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    ordering_fields = ['sequence']
    search_fields = ['sequence', 'bib_number', 'tap', 'crew__id', 'crew__name', 'crew__competitor_names',]
    filterset_fields = ['tap', 'crew__id',]

    def get_queryset(self):
        times = RaceTime.objects.all()
        tap = self.request.query_params.get('tap')
        queryset = times.filter(tap__exact=tap).order_by('sequence')

        times_without_crew = self.request.query_params.get('noCrew')
        if times_without_crew == 'true':
            queryset = times.filter(tap__exact=tap, crew__isnull=True).order_by('sequence')
            return queryset

        times_with_crew_invalid = self.request.query_params.get('crewInvalidTimes')
        if times_with_crew_invalid == 'true':
            queryset = times.filter(tap__exact=tap, crew__invalid_time=True).order_by('sequence')
            return queryset

        return queryset


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


# Attempt to read in the RaceTimes CSV from the front end

class RegisterData(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        RaceTime.objects.all().delete()
        # Convert the InMemoryUploadedFile to a NamedTemporaryFile
        for csv_upload in request.FILES.values():
            file_temp = tempfile.NamedTemporaryFile()
            file_temp.write(csv_upload.read())
            print(file_temp.name) # This is the path.

            with open(file_temp.name, newline='') as f:
                reader = csv.reader(f)
                next(reader) # skips the first row

                for row in reader:

                    if row:
                        data = {
                            'sequence': row[0],
                            'tap': row[3] or 'Finish',
                            'time_tap': row[4],
                            'crew':row[8] or None
                        }
                        serializer = WriteRaceTimesSerializer(data=data)
                        if serializer.is_valid():
                            serializer.save()

                race_times = RaceTime.objects.all()

                serializer = RaceTimesSerializer(race_times, many=True)

                self.calculate_computed_properties()

                file_temp.close()

                return Response(serializer.data)

        return Response({"Success!": "CSV imported OK"})

    def calculate_computed_properties(self):

            for crew in Crew.objects.all():
                crew.raw_time = crew.calc_raw_time()
                crew.race_time = crew.calc_race_time()
                crew.published_time = crew.calc_published_time()
                crew.start_time = crew.calc_start_time()
                crew.finish_time = crew.calc_finish_time()
                crew.invalid_time = crew.calc_invalid_time()
                crew.overall_rank = crew.calc_overall_rank()
                crew.gender_rank = crew.calc_gender_rank()
                crew.category_position_time = crew.calc_category_position_time()
                crew.category_rank = crew.calc_category_rank()
                crew.start_sequence = crew.calc_start_sequence()
                crew.finish_sequence = crew.calc_finish_sequence()
                crew.masters_adjustment = crew.calc_masters_adjustment()
                crew.requires_recalculation = False
                crew.save()

