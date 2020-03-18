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

class ResultsListView(generics.ListCreateAPIView):    
    serializer_class = PopulatedCrewSerializer
    pagination_class = PageNumberPagination
    PageNumberPagination.page_size_query_param = 'page_size' or 10
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    ordering_fields = ['overall_rank', 'gender_rank', ]
    search_fields = ['name', 'id', 'club__name', 'event_band', 'bib_number',]
    filterset_fields = ['status', 'event_band', 'raw_time',]

    def get_queryset(self):

        queryset = Crew.objects.filter(status__exact='Accepted', published_time__gt=0,).order_by('overall_rank',)

        gender = self.request.query_params.get('gender')
        if gender != 'all':
            queryset = queryset.filter(event__gender=gender).order_by('gender_rank',)
        return queryset