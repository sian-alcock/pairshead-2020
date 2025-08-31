from __future__ import absolute_import
import csv
import datetime
import os
import requests
import time

from django.http import Http404, HttpResponse
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters, generics, status  # Added missing import
from django_filters.rest_framework import DjangoFilterBackend

from ..serializers import EventMeetingKeySerializer
from ..models import EventMeetingKey

class EventMeetingKeyListView(generics.ListCreateAPIView):
    queryset = EventMeetingKey.objects.all()
    serializer_class = EventMeetingKeySerializer

class EventMeetingKeyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EventMeetingKey.objects.all()
    serializer_class = EventMeetingKeySerializer

class EventMeetingKeyBulkUpdate(APIView):
    def post(self, request):
        """Handling bulk create"""
        serializer = EventMeetingKeySerializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Handling bulk update"""
        data = request.data
        
        if not isinstance(data, list):
            return Response(
                {'error': 'Expected a list of objects'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_objects = []
        errors = []
        
        with transaction.atomic():
            for item in data:
                try:
                    item_id = item.get('id')
                    if not item_id:
                        errors.append({'error': 'Missing id field', 'item': item})
                        continue
                    
                    # Get the existing object
                    try:
                        obj = EventMeetingKey.objects.get(id=item_id)
                    except EventMeetingKey.DoesNotExist:
                        errors.append({'error': f'Object with id {item_id} not found', 'item': item})
                        continue
                    
                    # Update fields if provided
                    if 'event_meeting_key' in item:
                        obj.event_meeting_key = item['event_meeting_key']
                    if 'event_meeting_name' in item:
                        obj.event_meeting_name = item['event_meeting_name']
                    if 'current_event_meeting' in item:
                        obj.current_event_meeting = item['current_event_meeting']
                    
                    # Use the model's save method to ensure business logic is respected
                    obj.save()
                    updated_objects.append({
                        'id': obj.id,
                        'event_meeting_key': obj.event_meeting_key,
                        'event_meeting_name': obj.event_meeting_name,
                        'current_event_meeting': obj.current_event_meeting
                    })
                    
                except Exception as e:
                    errors.append({'error': str(e), 'item': item})
        
        response_data = {
            'status': 'Bulk update completed',
            'updated_count': len(updated_objects),
            'updated_objects': updated_objects
        }
        
        if errors:
            response_data['errors'] = errors
            response_data['error_count'] = len(errors)
        
        return Response(response_data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Alternative method for partial bulk updates"""
        return self.put(request)  # For now, treat PATCH the same as PUT