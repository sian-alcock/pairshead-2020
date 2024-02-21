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


from ..serializers import EventMeetingKeySerializer

from ..models import EventMeetingKey

class EventMeetingKeyListView(generics.ListCreateAPIView):
    queryset = EventMeetingKey.objects.all()
    serializer_class = EventMeetingKeySerializer

class EventMeetingKeyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EventMeetingKey.objects.all()
    serializer_class = EventMeetingKeySerializer