import csv
import os
import requests
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response


from ..serializers import CompetitorSerializer, CompetitorExportSerializer

from ..models import Competitor, Crew, EventMeetingKey

class CompetitorDataImport(APIView):

    def get(self, _request):
        # Start by deleting all existing competitors
        Competitor.objects.all().delete()

        Meeting = EventMeetingKey.objects.get(current_event_meeting=True).event_meeting_key

        UserAPI = os.getenv("USERAPI") # As supplied in email
        UserAuth = os.getenv("USERAUTH") # As supplied in email

        header = {'Authorization':UserAuth}
        request = {'api_key':UserAPI, 'meetingIdentifier':Meeting}
        url = 'https://webapi.britishrowing.org/api/OE2CrewInformation' # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            for competitor in r.json()['competitors']:

                data = {
                    'last_name': competitor['surname'],
                    'gender': competitor['gender'],
                    'crew': competitor['crewId'],
                }

                serializer = CompetitorSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

            competitors = Competitor.objects.all()
            serializer = CompetitorSerializer(competitors, many=True)
            self.calculate_computed_properties()
            return Response(serializer.data)

        return Response(status=400)
    def calculate_computed_properties(self):

        for crew in Crew.objects.all():
            crew.save()

class CompetitorDataExport(APIView):

    def get(self, _request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="competitordata.csv"'

        crews = Crew.objects.filter(status__exact='Accepted')

        serializer = CompetitorExportSerializer(crews, many=True)

        crews = serializer.data

        header = CompetitorExportSerializer.Meta.fields

        writer = csv.DictWriter(response, fieldnames=header)
        writer.writeheader()

        for row in serializer.data:
            writer.writerow(row)

        return response
