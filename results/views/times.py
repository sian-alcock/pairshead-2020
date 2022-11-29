import csv
import os
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


# Attempt to read in the RaceTimes CSV from the front end

# class RegisterData(APIView):
#     parser_classes = (FormParser, MultiPartParser)

#     def post(self, request):
#         RaceTime.objects.all().delete()
#         for file in request.FILES.values():
#             print(file)
#             # with open(file) as csvfile:
#             reader = csv.reader(file)
#             next(reader) # skips the first row

#             print(reader)
#             # reader = csv.reader(file)
#             objects = []
#             for row in reader:
#                 objects.append(RaceTime(
#                     sequence=row[0],
#                     tap=row[3] or 'Finish',
#                     time_tap=row[4],
#                     crew=row[8] or None
#                 ))
#             # RaceTime.objects.bulk_create(objects)
#             print(objects)
#         return Response({"success": "Good job, buddy"})

# class RegisterData(APIView):
#     parser_classes = (FormParser, MultiPartParser)

#     def post(self, request):
#         RaceTime.objects.all().delete()
#         for file in request.FILES.values():
#             reader = csv.reader(file)
#         print(reader)
            # next(reader) # skips the first row
            # objects = []
            # for row in reader:
            #     if row:
            #         data = {
            #             'sequence': row[0],
            #             'tap': row[3] or 'Finish',
            #             'time_tap': row[4],
            #             'crew':row[8] or None
            #         }

            # RaceTime.objects.bulk_create(objects)
        # print(uploaded_file_name)
        # print(uploaded_file_content)

        # return Response({"success": "Good job, buddy"})

class RegisterData(APIView):
    parser_classes = (MultiPartParser, FormParser)
    renderer_classes = [JSONRenderer]

    def put(self, request, format=None):
        if 'file' not in request.data:
            raise ParseError("Empty content")
        f = request.data['file']
        filename = f.name
        if filename.endswith('.csv'):
            file = default_storage.save(filename, f)
            r = csv_file_parser(file)
            status = 204
        else:
            status = 406
            r = "File format error"
        return Response(r, status=status)

def csv_file_parser(file):
    result_dict = {}
    with open(file) as csvfile:
        reader = csv.DictReader(csvfile)
        next(reader)
        line_count = 1
        for rows in reader:
            for key, value in rows.items():
                if not value:
                    raise ParseError('Missing value in file. Check the {} line'.format(line_count))
            result_dict[line_count] = rows
            line_count += 1

    
    return result_dict

