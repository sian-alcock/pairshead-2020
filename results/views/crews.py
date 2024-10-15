from __future__ import absolute_import
import csv
import datetime
import os
import requests
import time
# if this is where you store your django-rest-framework settings
# from django.conf import settings
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters, generics, serializers
from django_filters.rest_framework import DjangoFilterBackend


from ..serializers import ClubSerializer, CrewSerializer, PopulatedCrewSerializer, WriteCrewSerializer, CrewExportSerializer

from ..models import Crew, RaceTime, OriginalEventCategory, EventMeetingKey

from ..pagination import CrewPaginationWithAggregates

class CrewListView(generics.ListCreateAPIView):
    queryset = Crew.objects.filter(status__in=('Scratched', 'Accepted', 'Submitted'))
    serializer_class = PopulatedCrewSerializer
    pagination_class = CrewPaginationWithAggregates
    PageNumberPagination.page_size_query_param = 'page_size' or 10
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    ordering_fields = '__all__'
    search_fields = ['name', 'id', 'club__name', 'event_band', 'bib_number',]
    filterset_fields = ['status', 'event_band', 'start_time', 'finish_time', 'invalid_time',]

    def get_queryset(self):

        queryset = Crew.objects.filter(status__in=('Scratched', 'Accepted', 'Submitted'))

        masters = self.request.query_params.get('masters')
        # print(masters)
        if masters == 'true':
            queryset = queryset.filter(status__exact='Accepted', masters_adjustment__gt=0).order_by('event_band')
            return queryset

        order = self.request.query_params.get('order', None)
        if order == 'start-score':
            return queryset.order_by('draw_start_score')
        if order == 'club':
            return queryset.order_by('club__name', 'name',)
        # if order == 'crew':
        #     return queryset.order_by('competitor_names', 'name',)
        # if order == '-crew':
        #     return queryset.order_by('-competitor_names', '-name',)
        if order is not None:
            return queryset.order_by(order)
        return queryset.order_by('bib_number')

    def get_num_scratched_crews(self):
        return len(self.queryset.filter(status__exact='Scratched'))
    
class CrewGetEventBand(APIView):
    def get(self, _request):
        crews = Crew.objects.filter(status__exact='Accepted') # get all the Accepted crews
        serializer = CrewSerializer(crews, many=True)
        self.get_event_band(crews)
        return Response(serializer.data) # send the JSON to the client
    
    def get_event_band(self, crews):
        # Get event band for all crews
        for crew in crews:
            crew.event_band = crew.calc_event_band()
            crew.save()

class CrewGetStartScore(APIView):
    def get(self, _request):
        crews = Crew.objects.filter(status__exact='Accepted') # get all the Accepted crews
        serializer = CrewSerializer(crews, many=True)
        self.get_start_score(crews)
        return Response(serializer.data) # send the JSON to the client
    
    def get_start_score(self, crews):
        # Recalculate rankings for all crews
        for crew in crews:
            crew.draw_start_score = crew.calc_draw_start_score()
            crew.save()

class CrewGetStartOrder(APIView):
    def get(self, _request):
        crews = Crew.objects.filter(status__exact='Accepted') # get all the Accepted crews
        serializer = CrewSerializer(crews, many=True)
        self.update_start_order(crews)
        return Response(serializer.data) # send the JSON to the client

    def update_start_order(self, crews):
        # Add the start order

        for crew in crews:
            crew.calculated_start_order = crew.calc_calculated_start_order()
            crew.save()

class CheckStartOrderUnique(APIView):
    def get(self, _request):
        crews = Crew.objects.filter(status__exact='Accepted')
        crews_with_unique_start_order = set(Crew.objects.filter(status__exact='Accepted').values_list('calculated_start_order'))

        if len(crews) != len(crews_with_unique_start_order):
            return Response('There are Accepted crews that do not have a unique start order')
        else:
            return Response('The start order is unique amongst accepted crews')


class CrewUpdateRankings(APIView): 
    def get(self, _request):
        crews = Crew.objects.filter(status__exact=('Accepted')) # get all the crews
        serializer = CrewSerializer(crews, many=True)
        self.update_timing_calcs(crews)
        return Response(serializer.data) # send the JSON to the client

    def update_timing_calcs(self, crews):
        # Recalculate rankings for all crews

        for crew in crews:
            crew.event_band = crew.calc_event_band()
            crew.raw_time = crew.calc_raw_time()
            crew.race_time = crew.calc_race_time()
            crew.published_time = crew.calc_published_time()
            crew.start_time = crew.calc_start_time()
            crew.finish_time = crew.calc_finish_time()
            crew.invalid_time = crew.calc_invalid_time()
            crew.overall_rank = crew.calc_overall_rank()
            crew.gender_rank = crew.calc_gender_rank()
            crew.category_rank = crew.calc_category_rank()
            crew.category_position_time = crew.calc_category_position_time()
            crew.start_sequence = crew.calc_start_sequence()
            crew.finish_sequence = crew.calc_finish_sequence()
            crew.masters_adjustment = crew.calc_masters_adjustment()
            crew.requires_recalculation = False
            crew.save()


class CrewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer

class CrewDataImport(APIView):

    def get(self, _request, personal=0):
        # Start by deleting all existing crews and times
        Crew.objects.all().delete()
        RaceTime.objects.all().delete()
        OriginalEventCategory.objects.all().delete()

        Meeting = EventMeetingKey.objects.get(current_event_meeting=True).event_meeting_key

        UserAPI = os.getenv("USERAPI") # As supplied in email
        UserAuth = os.getenv("USERAUTH") # As supplied in email

        header = {'Authorization':UserAuth}
        request = {'api_key':UserAPI, 'meetingIdentifier':Meeting}

        url = 'https://webapi.britishrowing.org/api/OE2CrewInformation' # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            for crew in r.json()['crews']:

                if crew['competitionNotes'] == 'TO':
                    time_only = True
                else:
                    time_only = False

                if personal > 0:

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
                        'host_club': crew['boatingPermissionsClubID'] or 999999,
                        'otd_contact': crew['competitionContactName'],
                        'otd_home_phone': crew['competitionContactHomePhone'],
                        'otd_mobile_phone': crew['competitionContactMobilePhone'],
                        'otd_work_phone': crew['competitionContactWorkPhone'],
                        'time_only': time_only
                    }

                else:
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
                        'host_club': crew['boatingPermissionsClubID'] or 999999,
                        'time_only': time_only
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

        filename = 'crewdataforimporttobroe - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact='Accepted')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'
        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Crew ID', 'Event ID', 'Event', 'Band', 'Division', 'Crew Name', 'Crew Club', 'Position In Event', 'Raw Time', 'Time', 'Status',])


        for crew in crews:

            if crew.manual_override_time > 0:
                raw_time = crew.manual_override_time
            else:
                raw_time = crew.raw_time

            if raw_time == 0:
                rank = 0
            else:
                rank = crew.category_rank

            if raw_time > 0 and crew.time_only:
                status = 'Time Only'
            elif crew.disqualified:
                status = 'Disqualified'
            elif crew.did_not_start:
                status = 'Did not start'
            elif crew.did_not_finish:
                status = 'Did not finish'
            elif raw_time == 0 or raw_time is None:
                status = 'Did not start'
            elif raw_time > 0:
                status = 'Finished'

            if crew.band is None:
                band = ''
            else:
                band = crew.band.name

            if raw_time > 0:
                hundredths = int((raw_time / 10)%100)
                seconds = int((raw_time / 1000)%60)
                minutes = int((raw_time / (1000*60))%60)

                raw_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)
            else:
                raw_time = 0

            if crew.masters_adjusted_time > 0:
                hundredths = int((crew.masters_adjusted_time / 10)%100)
                seconds = int((crew.masters_adjusted_time / 1000)%60)
                minutes = int((crew.masters_adjusted_time / (1000*60))%60)
                race_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)

            elif crew.published_time > 0:
                hundredths = int((crew.published_time / 10)%100)
                seconds = int((crew.published_time / 1000)%60)
                minutes = int((crew.published_time / (1000*60))%60)

                race_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)
            else:
                race_time = 0

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
            race_time,
            status
            ])

        return response
    

class BibDataExport(APIView):
    def get(self, _request):
        filename = 'bibdata - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact='Accepted')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Crew ID', 'Crew', 'Bib',])


        for crew in crews:

            writer.writerow(
            [
                crew.id,
                crew.name,
                crew.calculated_start_order,
            ])

        return response
    
class StartOrderDataExport(APIView):
    def get(self, _request):
        filename = 'startorderdata - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__in=['Accepted', 'Scratched']).order_by('bib_number')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Status', 'Crew No', 'Crew', 'Club', 'Blade', 'CompCode', 'Category', 'Host club', 'Number location', 'Marshalling division', 'Time only',])


        for crew in crews:

            if crew.competitor_names is None:
                crew_name = crew.name
            else:
                crew_name = crew.competitor_names

            if crew.club.blade_image:
                image = '=IMAGE("' + crew.club.blade_image + '")'

            if crew.number_location is None:
                number_location = '⚠️ Missing number location!'
            else:
                number_location = crew.number_location

            if crew.time_only:
                time_only = 'TO'
            else:
                time_only  = ''


            writer.writerow(
            [
                crew.status,
                crew.bib_number,
                crew_name,
                crew.club.name,
                image,
                crew.composite_code,
                crew.event_band,
                crew.host_club.name,
                number_location,
                crew.marshalling_division,
                time_only,
            ])

        return response
    
class CrewStartOrderDataExport(APIView):
    def get(self, _request):

        crews = Crew.objects.filter(status__in=['Accepted', 'Scratched']).order_by('bib_number')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="crewstartorderdata.csv"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Bib', 'Crew No', 'Crew', 'Club name', 'Club code', 'Event band'])


        for crew in crews:

            if crew.competitor_names is None:
                crew_name = crew.name
            else:
                crew_name = crew.competitor_names


            writer.writerow(
            [
                crew.bib_number,
                crew.id,
                crew.status,
                crew_name,
                crew.club.name,
                crew.club.index_code,
                crew.event_band,
            ])

        return response
    
class CrewWebScorerDataExport (APIView):
    def get(self, _request):

        filename = 'webscorerdata - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact='Accepted').order_by('bib_number')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Name', 'Team name', 'Team name 2', 'Category', 'Bib', 'Info 1'])


        for crew in crews:

            if crew.competitor_names is None:
                crew_name = crew.club.index_code + ' - ' + crew.name
            else:
                crew_name = crew.club.index_code +  ' - ' + crew.competitor_names.rsplit('/', 1)[-1]


            writer.writerow(
            [
                crew_name,
                crew.club.name,
                crew.id,
                crew.event_band,
                crew.bib_number,
                crew.status,
            ])

        return response

class CreateEventOrderTemplate(APIView):
    def get(self, _request):

        filename = 'eventordertemplate - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact='Accepted')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Event', 'Order' ])

        unique_event_bands = []
        for crew in crews:
            # print(crew.id)
            crew.event_band=crew.calc_event_band()
            crew.save()

        for crew in crews:

            if crew.event_band not in unique_event_bands:
                unique_event_bands.append(crew.event_band)

                # print(unique_event_bands)

        for event in unique_event_bands:
            writer.writerow(
                [
                    event,
                    ''

                ])
            # print(event)

        return response
    
class CrewUniqueHostClub(generics.ListCreateAPIView):
    def get(self, _request):
        crews = Crew.objects.filter(status__exact='Accepted')
        unique_host_clubs = []
        data = []

        for crew in crews:

            if crew.host_club not in unique_host_clubs:
                unique_host_clubs.append(crew.host_club)
        
        for club in unique_host_clubs:

            data.append(ClubSerializer(club).data)

        return Response(data)