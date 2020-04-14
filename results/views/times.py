import csv
import os
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from django.conf import settings

from rest_framework import filters, generics
from django_filters.rest_framework import DjangoFilterBackend


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


# class RaceTimeListView(APIView): # extend the APIView

#     def get(self, request):
#         race_times = RaceTime.objects.all() # get all the crews

#         paginator = LimitOffsetPagination()
#         result_page = paginator.paginate_queryset(race_times, request)
#         serializer = PopulatedRaceTimesSerializer(result_page, many=True, context={'request':request})

#         return Response(serializer.data) # send the JSON to the client

#     def post(self, request):
#         serializer = PopulatedRaceTimesSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=201)

#         return Response(serializer.errors, status=422)


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


class CrewRaceTimesImport(APIView):
    # Start by deleting all existing times

    def get(self, _request):
        RaceTime.objects.all().delete()
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "../csv/race_times.csv"
        abs_file_path = os.path.join(script_dir, rel_path)

        with open(abs_file_path, newline='') as f:
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

            return Response(serializer.data)
    
    def calculate_computed_properties(self):

        for crew in Crew.objects.all():
            print(crew.start_time)
            print(crew.finish_time)
            print(crew.invalid_time)
            print(crew.published_time)
            print(crew.raw_time)
            print(crew.race_time)
            print(crew.overall_rank)
            print(crew.gender_rank)
            print(crew.category_position_time)
            print(crew.category_rank)
            print(crew.start_sequence)
            print(crew.finish_sequence)
            print(crew.competitor_names)
            crew.save()
        
