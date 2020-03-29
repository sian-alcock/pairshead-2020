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

# from ..pagination import ResultsPaginationWithAggregates
from ..pagination import CrewPaginationWithAggregates


class ResultsListView(generics.ListCreateAPIView):
    serializer_class = PopulatedCrewSerializer
    # pagination_class = PageNumberPagination
    pagination_class = CrewPaginationWithAggregates
    PageNumberPagination.page_size_query_param = 'page_size' or 10
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend,]
    ordering_fields = ['overall_rank', 'gender_rank', 'category_rank', 'event_band',]
    search_fields = ['name', 'id', 'club__name', 'event_band', 'bib_number',]
    filterset_fields = ['status', 'event_band', 'raw_time',]

    def get_queryset(self):

        queryset = Crew.objects.filter(status__exact='Accepted', published_time__gt=0,).order_by('overall_rank',)

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

        # close_first_and_second_crews = self.request.query_params.get('categoryRankClose')
        # if close_first_and_second_crews != 'all':
        #     queryset = queryset.filter(category_rank__in=(1, 2), ).order_by('category_rank',)
        #     return queryset