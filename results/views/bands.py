import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response


from ..serializers import  BandSerializer, PopulatedBandSerializer

from ..models import Band

class BandListView(APIView): # used to populate the pulldown on the CrewTimeEdit page

    def get(self, _request):
        bands = Band.objects.all() # get all the bands
        serializer = PopulatedBandSerializer(bands, many=True)

        return Response(serializer.data) # send the JSON to the client

class BandDataImport(APIView):

    def get(self, _request):
        # Start by deleting all existing bands
        Band.objects.all().delete()


        Meeting = os.getenv("MEETING2022") # Competition Meeting API
        UserAPI = os.getenv("USERAPI") # As supplied in email
        UserAuth = os.getenv("USERAUTH") # As supplied in email

        header = {'Authorization':UserAuth}
        request = {'api_key':UserAPI, 'meetingIdentifier':Meeting}
        url = 'https://webapi.britishrowing.org/api/OE2MeetingSetup' # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            for band in r.json()['eventBands']:
                data = {
                    'name': band['bandName'],
                    'id': band['group1Id'],
                    'event': band['eventId'],
                }

                serializer = BandSerializer(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save()

            bands = Band.objects.all()
            serializer = BandSerializer(bands, many=True)
            return Response(serializer.data)

        return Response(status=400)
