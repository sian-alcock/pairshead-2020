from __future__ import absolute_import
import csv
import os
import requests
import time
# if this is where you store your django-rest-framework settings
# from django.conf import settings
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters, generics
from django_filters.rest_framework import DjangoFilterBackend


from ..serializers import CrewSerializer, PopulatedCrewSerializer, WriteCrewSerializer, CrewExportSerializer

from ..models import Crew, RaceTime, OriginalEventCategory

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

        masters = self.request.query_params.get('masters')
        print(masters)
        if masters == 'true':
            queryset = queryset.filter(status__exact='Accepted', masters_adjustment__gt=0).order_by('event_band')
            return queryset

        order = self.request.query_params.get('order', None)
        if order == 'crew':
            return queryset.order_by('competitor_names', 'name',)
        if order == '-crew':
            return queryset.order_by('-competitor_names', '-name',)
        if order is not None:
            return queryset.order_by(order)
        return queryset.order_by('bib_number')

    def get_num_scratched_crews(self):
        return len(self.queryset.filter(status__exact='Scratched'))

class CrewUpdateRankings(APIView): 
    def get(self, _request):
        crews = Crew.objects.filter(status__exact=('Accepted')) # get all the crews
        serializer = CrewSerializer(crews, many=True)
        self.update_masters_adjustment(crews)
        self.update_rankings(crews)
        return Response(serializer.data) # send the JSON to the client

    def update_masters_adjustment(self, crews):
        # Recalculate rankings for all crews
        for crew in crews:
            print(crew.id)
            print(crew.masters_adjustment)
            crew.save()
    def update_rankings(self, crews):
        # Recalculate rankings for all crews
        for crew in crews:
            print(crew.id)
            print(crew.overall_rank)
            print(crew.gender_rank)
            print(crew.category_rank)
            crew.requires_recalculation = False
            crew.save()


class CrewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer

class CrewDataImport(APIView):

    def get(self, _request):
        # Start by deleting all existing crews and times
        Crew.objects.all().delete()
        RaceTime.objects.all().delete()
        OriginalEventCategory.objects.all().delete()

        Meeting = os.getenv("MEETING2022") # Competition Meeting API from the Information --> API Key menu
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
                    'sculling_CRI': crew['scullingCRI'],
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

class CrewDataExport(APIView):
    def get(self, _request):

        crews = Crew.objects.filter(status__exact='Accepted')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="crewdata.csv"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Crew ID', 'Event ID', 'Event', 'Band', 'Division', 'Crew Name', 'Crew Club', 'Position In Event', 'Raw Time', 'Time', 'Status',])


        for crew in crews:

            if crew.raw_time == 0:
                rank = 0
            else:
                rank = crew.category_rank

            if crew.raw_time > 0 and crew.time_only:
                status = 'Time Only'
            elif crew.disqualified:
                status = 'Disqualified'
            elif crew.did_not_start:
                status = 'Did not start'
            elif crew.did_not_finish:
                status = 'Did not finish'
            elif crew.raw_time == 0 or crew.raw_time is None:
                status = 'Did not start'
            elif crew.raw_time > 0:
                status = 'Finished'

            if crew.band is None:
                band = ''
            else:
                band = crew.band.name

            if crew.raw_time > 0:
                hundredths = int((crew.raw_time / 10)%100)
                seconds = int((crew.raw_time / 1000)%60)
                minutes = int((crew.raw_time / (1000*60))%60)

                raw_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)
            else:
                raw_time = 0

            if crew.published_time > 0:
                hundredths = int((crew.published_time / 10)%100)
                seconds = int((crew.published_time / 1000)%60)
                minutes = int((crew.published_time / (1000*60))%60)

                published_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)
            else:
                published_time = 0

            writer.writerow(
            [crew.id,
            crew.event.id,
            crew.event.name,
            band,
            '',
            crew.name,
            crew.club.name,
            rank,
            raw_time,
            published_time,
            status
            ])

        return response
