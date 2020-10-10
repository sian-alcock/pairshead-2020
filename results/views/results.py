from __future__ import absolute_import
import csv
import os
import requests
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
    search_fields = ['name', 'id', 'club__name', 'event_band', 'bib_number', 'competitor_names',]
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

        crews = Crew.objects.filter(status__exact='Accepted', raw_time__gt=0,).order_by('overall_rank')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="crewdata.csv"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Overall position', 'Number', 'Time', 'Masters adjusted time','Blade', 'Club', 'Crew', 'Composite code', 'Event', 'Position In Category', 'Penalty', 'Time only',])


        for crew in crews:

            if crew.raw_time == 0:
                rank = 0
            else:
                rank = crew.overall_rank

            if crew.published_time > 0:
                hundredths = int((crew.published_time / 10)%60)
                seconds = int((crew.published_time / 1000)%60)
                minutes = int((crew.published_time / (1000*60))%60)

                published_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)
            else:
                published_time = 0

            if crew.masters_adjusted_time > 0:
                hundredths = int((crew.masters_adjusted_time / 10)%60)
                seconds = int((crew.masters_adjusted_time / 1000)%60)
                minutes = int((crew.masters_adjusted_time / (1000*60))%60)

                masters_adjusted_time = str("%02d" % minutes)+':'+str("%02d" % seconds)+'.'+str("%02d" % hundredths)
            else:
                masters_adjusted_time = ''

            if crew.penalty > 0:
                penalty = crew.penalty
            else:
                penalty = ''

            if crew.time_only:
                time_only = 'TO'
            else:
                time_only = ''

            if crew.club.blade_image:
                image = '=IMAGE("' + crew.club.blade_image + '")'

            writer.writerow(
            [
            rank,
            crew.bib_number,
            published_time,
            masters_adjusted_time,
            image,
            crew.club.name,
            crew.competitor_names,
            crew.composite_code,
            crew.event_band,
            crew.category_rank,
            penalty,
            time_only,
            ])

        return response
