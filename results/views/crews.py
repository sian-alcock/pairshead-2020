from __future__ import absolute_import
import csv
import os
import requests
# if this is where you store your django-rest-framework settings
# from django.conf import settings
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters, generics
from django_filters.rest_framework import DjangoFilterBackend


from ..serializers import CrewSerializer, PopulatedCrewSerializer, WriteCrewSerializer, CrewExportSerializer

from ..models import Crew, RaceTime

from .times import CrewRaceTimesImport

from ..pagination import CrewPaginationWithAggregates

class CrewListView(generics.ListCreateAPIView):
    queryset = Crew.objects.filter(status__in=('Scratched', 'Accepted'))
    serializer_class = PopulatedCrewSerializer
    pagination_class = CrewPaginationWithAggregates
    PageNumberPagination.page_size_query_param = 'page_size' or 10
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    ordering_fields = '__all__'
    search_fields = ['name', 'id', 'club__name', 'event_band', 'bib_number', 'competitor_names', ]
    filterset_fields = ['status', 'event_band', 'start_time', 'finish_time', 'invalid_time', ]

    def get_queryset(self):

        queryset = Crew.objects.filter(status__in=('Scratched', 'Accepted'))
        order = self.request.query_params.get('order', None)
        if order is not None:
            queryset = queryset.order_by(order)
        return queryset

    def get_num_scratched_crews(self):
        return len(self.queryset.filter(status__exact='Scratched'))

class CrewUpdateRankings(APIView):
    
    def get(self, _request):
        crews = Crew.objects.filter(status__in=('Accepted', 'Scratched',)) # get all the crews
        serializer = CrewSerializer(crews, many=True)
        self.update_rankings(crews)
        return Response(serializer.data) # send the JSON to the client

    def update_rankings(self, crews):
        # Recalculate rankings for all crews
        for crew in crews:
            print(crew.overall_rank)
            print(crew.gender_rank)
            print(crew.category_rank)
            crew.requires_recalculation = False
            crew.save()

    

class CrewDetailView(APIView): # extend the APIView

    def get_crew(self, pk):
        try:
            crew = Crew.objects.get(pk=pk)
        except Crew.DoesNotExist:
            raise Http404
        return crew

    def get(self, _request, pk):
        crew = self.get_crew(pk)
        serializer = PopulatedCrewSerializer(crew)
        return Response(serializer.data)

    def put(self, request, pk):
        crew = self.get_crew(pk)
        crew = Crew.objects.get(pk=pk)
        serializer = CrewSerializer(crew, data=request.data)
        if serializer.is_valid():
            serializer.save()

            # self.update_rankings()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=422)

            
    def delete(self, _request, pk):
        crew = self.get_crew(pk)
        crew = Crew.objects.get(pk=pk)
        crew.delete()
        return Response(status=204)

class CrewDataImport(APIView):

    def get(self, _request):
        # Start by deleting all existing crews and times
        Crew.objects.all().delete()
        RaceTime.objects.all().delete()

        Meeting = os.getenv("MEETING2019") # Competition Meeting API from the Information --> API Key menu
        UserAPI = os.getenv("USERAPI") # As supplied in email
        UserAuth = os.getenv("USERAUTH") # As supplied in email

        header = {'Authorization':UserAuth}
        request = {'api_key':UserAPI, 'meetingIdentifier':Meeting}

        url = 'https://webapi.britishrowing.org/api/OE2CrewInformation' # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            for crew in r.json()['crews']:

                data = {
                    'name': crew['name'],
                    'id': crew['id'],
                    'composite_code': crew['compositeCode'],
                    'club': crew['clubId'],
                    'rowing_CRI': crew['rowingCRI'],
                    'rowing_CRI_max': crew['rowingCRIMax'],
                    'sculling_CRI': crew['scullingCRI'],
                    'sculling_CRI_max': crew['scullingCRIMax'],
                    'event': crew['eventId'],
                    'status': crew['status'],
                    'bib_number': crew['customCrewNumber'],
                    'band': crew['bandId'],
                }

                serializer = WriteCrewSerializer(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save()

            crews = Crew.objects.all()
            serializer = WriteCrewSerializer(crews, many=True)
            return Response(serializer.data)

        return Response(status=400)

# class CrewDataExport(APIView):
#
#     def get(self, _request):
#
#         crews = Crew.objects.all()
#         response = HttpResponse(content_type='text/csv')
#         response['Content-Disposition'] = 'attachment; filename="crewdata.csv"'
#
#         writer = csv.writer(response, delimiter=',')
#         writer.writerow(['name', 'bib_number', 'id', 'status', 'composite_code', 'rowing_CRI', 'rowing_CRI_max', 'sculling_CRI', 'sculling_CRI_max', 'club', 'event', 'band', 'competitors', 'penalty', 'handicap', 'raw_time',])
#
#         # (, 'times', 'raw_time', 'race_time', 'start_time', 'finish_time', 'start_sequence', 'finish_sequence', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds',  'band', ,)
#
#         for crew in crews:
#             writer.writerow(
#             [crew.name,
#             crew.bib_number,
#             crew.id,
#             crew.status,
#             crew.composite_code,
#             crew.rowing_CRI,
#             crew.rowing_CRI_max,
#             crew.sculling_CRI,
#             crew.sculling_CRI_max,
#             crew.club.name,
#             crew.event.name,
#             crew.band,
#             crew.competitor_names,
#             crew.penalty,
#             crew.handicap,
#             crew.times, ])
#
#         return response
#
#         # serializer = PopulatedCrewSerializer(crews, many=True)
#         # return Response(serializer.data)


class CrewDataExport(APIView):

    def get(self, _request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="crewdata.csv"'

        crews = Crew.objects.filter(status__exact='Accepted')

        serializer = CrewExportSerializer(crews, many=True)

        crews = serializer.data

        header = CrewExportSerializer.Meta.fields

        writer = csv.DictWriter(response, fieldnames=header)
        writer.writeheader()

        for row in serializer.data:
            writer.writerow(row)

        return response
