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
from rest_framework import filters, generics
from django_filters.rest_framework import DjangoFilterBackend


from ..serializers import RaceSerializer

from ..models import Race, Crew

class RaceListView(generics.ListCreateAPIView):
    queryset = Race.objects.all()
    serializer_class = RaceSerializer
    
    def perform_create(self, serializer):
        """Called after a race is successfully created"""
        serializer.save()
        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass

class RaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Race.objects.all()
    serializer_class = RaceSerializer
    
    def perform_update(self, serializer):
        """Called after a race is successfully updated"""
        serializer.save()
        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass
    
    def perform_destroy(self, instance):
        """Called after a race is successfully deleted"""
        instance.delete()
        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass
