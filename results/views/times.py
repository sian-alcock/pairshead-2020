import csv
import os
import requests
import logging

logger = logging.getLogger(__name__)

from .helpers import decode_utf8
from django.http import Http404
from django.db import transaction
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

from ..pagination import RaceTimePaginationWithAggregates


class RaceTimeListView(generics.ListCreateAPIView):
    serializer_class = PopulatedRaceTimesSerializer
    pagination_class = RaceTimePaginationWithAggregates
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['crew__competitor_names', 'crew__name', 'crew__bib_number', 'sequence']
    ordering_fields = ['sequence', 'time_tap', 'crew__bib_number', 'crew__competitor_names', 'crew__name', ]
    ordering = ['sequence']  # default ordering
    
    def get_queryset(self):
        queryset = RaceTime.objects.all().select_related('race', 'crew')
        race_id = self.request.query_params.get('race_id', None)
        tap = self.request.query_params.get('tap', None)
        unassigned_only = self.request.query_params.get('unassigned_only', None)
        
        if race_id is not None:
            queryset = queryset.filter(race_id=race_id)
        if tap is not None:
            queryset = queryset.filter(tap=tap)
        if unassigned_only and unassigned_only.lower() == 'true':
            queryset = queryset.filter(crew__isnull=True)
            
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
        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass
        return Response(serializer.errors, status=422)

    
    def patch(self, request, pk):
        race_time = self.get_race_time(pk)
        
        # Handle crew assignment with conflict resolution
        if 'crew' in request.data:
            new_crew_id = request.data.get('crew')
            
            with transaction.atomic():
                try:
                    if new_crew_id is not None:
                        # Assigning to a crew - check for conflicts
                        new_crew = Crew.objects.get(id=new_crew_id)
                        
                        # Find any existing race time for this crew/race/tap combination
                        conflicting_race_time = RaceTime.objects.select_for_update().filter(
                            crew=new_crew,
                            race=race_time.race,
                            tap=race_time.tap
                        ).exclude(id=race_time.id).first()
                        
                        if conflicting_race_time:
                            # Clear the existing assignment first
                            conflicting_race_time.crew = None
                            conflicting_race_time.save()
                            print(f"Auto-cleared conflicting race time {conflicting_race_time.id} from crew {new_crew.id}")
                        
                        # Now assign this race time to the crew
                        race_time.crew = new_crew
                        race_time.save()
                        
                    else:
                        # Unassigning (crew=null)
                        race_time.crew = None
                        race_time.save()
                    
                    # Update computed properties after the assignment
                    try:
                        Crew.update_all_computed_properties()
                    except Exception:
                        pass
                    
                    # Return the updated race time data
                    serializer = RaceTimesSerializer(race_time)
                    return Response(serializer.data, status=200)
                    
                except Crew.DoesNotExist:
                    return Response(
                        {'error': f'Crew {new_crew_id} does not exist'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    return Response(
                        {'error': f'Error updating race time: {str(e)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        else:
            # Handle other field updates (non-crew fields) with the original logic
            serializer = RaceTimesSerializer(race_time, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                try:
                    Crew.update_all_computed_properties()
                except Exception:
                    pass
                return Response(serializer.data, status=200)
            return Response(serializer.errors, status=422)


    def delete(self, _request, pk):
        race_time = self.get_race_time(pk)
        race_time = RaceTime.objects.get(pk=pk)
        race_time.delete()
        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass
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

        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass

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

            try:
                Crew.update_all_computed_properties()
            except Exception:
                pass

            return Response(serializer.data)
        
        return Response(status=400)