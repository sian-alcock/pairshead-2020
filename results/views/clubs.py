import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response


from ..serializers import WriteClubSerializer, ClubSerializer

from ..models import Club

class ClubListView(APIView): # extend the APIView

    def get(self, _request):
        clubs = Club.objects.all() # get all the clubs
        serializer = ClubSerializer(clubs, many=True)

        return Response(serializer.data) # send the JSON to the client

class ClubDataImport(APIView):

    def get(self, _request):
        # Start by deleting all existing clubs
        Club.objects.all().delete()

        Meeting = os.getenv("MEETING2022") # Competition Meeting API
        UserAPI = os.getenv("USERAPI") # As supplied in email
        UserAuth = os.getenv("USERAUTH") # As supplied in email

        header = {'Authorization':UserAuth}
        request = {'api_key':UserAPI, 'meetingIdentifier':Meeting}
        url = 'https://webapi.britishrowing.org/api/OE2ClubInformation' # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            clubs = r.json()

            for club in clubs:
                data = {
                    'name': club['name'],
                    'id': club['id'],
                    'abbreviation': club['abbreviation'],
                    'index_code': club['indexCode'],
                    'colours': club['colours'],
                    'blade_image': club['bladeImage'],
                }
                serializer = WriteClubSerializer(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save()

            clubs = Club.objects.all()
            serializer = ClubSerializer(clubs, many=True)
            return Response(serializer.data)

        return Response(status=400)
