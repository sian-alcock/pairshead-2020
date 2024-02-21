import os
import csv
import requests
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count


from ..serializers import EventSerializer, PopulatedEventSerializer

from ..models import Event, EventMeetingKey

class EventListView(APIView): # extend the APIView

    def get(self, _request):
        events = Event.objects.all() # get all the events
        serializer = PopulatedEventSerializer(events, many=True)

        return Response(serializer.data) # send the JSON to the client

class EventDataImport(APIView):

    def get(self, _request):
        # Start by deleting all existing events
        Event.objects.all().delete()

        Meeting = EventMeetingKey.objects.get(current_event_meeting=True).event_meeting_key

        UserAPI = os.getenv("USERAPI") # As supplied in email
        UserAuth = os.getenv("USERAUTH") # As supplied in email

        header = {'Authorization':UserAuth}
        request = {'api_key':UserAPI, 'meetingIdentifier':Meeting}
        url = 'https://webapi.britishrowing.org/api/OE2MeetingSetup' # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            for event in r.json()['events']:
                data = {
                    'name': event['name'],
                    'id': event['id'],
                    'override_name': event['overrideName'],
                    'info': event['info'],
                    'type': event['type'],
                    'gender': event['gender'],
                }

                serializer = EventSerializer(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save()

            events = Event.objects.all()
            serializer = EventSerializer(events, many=True)
            return Response(serializer.data)

        return Response(status=400)
    
