from __future__ import absolute_import
import csv
import datetime
import os
import requests
import time
from django.db.models import Min

# if this is where you store your django-rest-framework settings
from django.conf import settings
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters, generics
from django_filters.rest_framework import DjangoFilterBackend



from ..serializers import PopulatedCrewSerializer

from ..models import Crew

from ..pagination import CrewPaginationWithAggregates


class ResultsListView(generics.ListCreateAPIView):
    serializer_class = PopulatedCrewSerializer
    pagination_class = CrewPaginationWithAggregates
    PageNumberPagination.page_size_query_param = 'page_size' or 10
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    ordering_fields = ['overall_rank', 'gender_rank', 'category_rank', 'event_band', 'name',]
    search_fields = ['name', 'club__name', 'event_band', 'bib_number', 'competitor_names',]
    filterset_fields = ['status', 'event_band', 'raw_time',]

    def get_queryset(self):

        queryset = Crew.objects.filter(status__exact='Accepted', published_time__gt=0,).order_by('name',)

        gender = self.request.query_params.get('gender')
        print(gender)
        if gender != 'all':
            queryset = queryset.filter(event__gender=gender).order_by('overall_rank')
            return queryset

        first_and_second_crews = self.request.query_params.get('categoryRank')
        print(first_and_second_crews)
        if first_and_second_crews != 'all':
            queryset = queryset.filter(category_rank__lt=3).order_by('event_band', 'category_rank',)
            return queryset

        return queryset.order_by('overall_rank')

class ResultDataExport(APIView):

    def get(self, _request):

        filename = 'resultdataexport - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact='Accepted', published_time__gt=0,).order_by('overall_rank')
        fastest_female_scull = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time'))
        fastest_female_sweep = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time'))
        fastest_mixed_scull = Crew.objects.all().filter(event_band__startswith='Mx', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time'))
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Id', 'Overall pos', 'No', 'Time', 'Mas adj time','Blade(img)', 'Club', 'Crew', 'Com code', 'Category', 'Pos in Cat', 'Pennant', 'Trophy', 'Penalty', 'Time only',])



        for crew in crews:

            if crew.published_time == 0:
                rank = 0
            else:
                rank = crew.overall_rank

            if crew.published_time > 0:
                tenths = int((crew.published_time / 100)%10)
                seconds = int((crew.published_time / 1000)%60)
                minutes = int((crew.published_time / (1000*60))%60)

                published_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%01d" % tenths)
            else:
                published_time = 0

            if crew.masters_adjusted_time > 0:
                tenths = int((crew.masters_adjusted_time / 100)%10)
                seconds = int((crew.masters_adjusted_time / 1000)%60)
                minutes = int((crew.masters_adjusted_time / (1000*60))%60)

                masters_adjusted_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%01d" % tenths)
            else:
                masters_adjusted_time = ''


            if crew.penalty > 0:
                penalty = 'P'
            else:
                penalty = ''

            if crew.time_only:
                time_only = 'TO'
            else:
                time_only = ''

            if crew.category_rank == 0:
                category_rank = ''
            else:
                category_rank = crew.category_rank

            if crew.category_rank == 1:
                pennant = '=IMAGE("https://www.bblrc.co.uk/wp-content/uploads/2021/09/pennant-ph80.png")'
            else:
                pennant = ''

            if crew.overall_rank == 1 or crew.published_time == fastest_female_scull['raw_time__min'] or crew.published_time == fastest_female_sweep['raw_time__min'] or crew.published_time == fastest_mixed_scull['raw_time__min']:
                trophy = '=IMAGE("https://www.bblrc.co.uk/wp-content/uploads/2023/10/trophy_PH-2.jpg")'
            else:
                trophy = ''

            if crew.club.blade_image:
                image = '=IMAGE("' + crew.club.blade_image + '")'

            writer.writerow(
            [
            crew.id,    
            rank,
            crew.bib_number,
            published_time,
            masters_adjusted_time,
            image,
            crew.club.name,
            crew.competitor_names,
            crew.composite_code,
            crew.event_band,
            category_rank,
            pennant,
            trophy,
            penalty,
            time_only,
            ])

            # print(crew.calc_published_time)
            # print(fastest_female_scull)
            # print(fastest_female_sweep)
            # print(fastest_mixed_scull)

        return response
