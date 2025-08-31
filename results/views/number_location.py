import csv
import datetime
from .helpers import decode_utf8
from django.http import Http404, HttpResponse
from django.db import transaction
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, ParseError
from ..serializers import NumberLocationSerializer
from ..models import NumberLocation, Crew

class NumberLocationListView(generics.ListCreateAPIView):
    queryset = NumberLocation.objects.all()
    serializer_class = NumberLocationSerializer

class NumberLocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NumberLocation.objects.all()
    serializer_class = NumberLocationSerializer

class NumberLocationBulkUpdate(APIView):
    def post(self, request):
        # Handling bulk create
        serializer = NumberLocationSerializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        # Handling bulk update
        data = request.data
        with transaction.atomic():
            for item in data:
                number_location, created = NumberLocation.objects.update_or_create(
                    id=item.get('id'),
                    defaults={
                        'number_location': item.get('number_location'),
                        'club': item.get('club'),
                    }
                )
        return Response({'status': 'Updated number_locations successfully'}, status=status.HTTP_200_OK)


class NumberLocationImport(APIView):
    # This function imports the csv from frontend
    # Start by deleting all existing event cats

    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        NumberLocation.objects.all().delete()

        reader = csv.reader(decode_utf8(request.FILES['file']))
        next(reader) # skips the first row
        for row in reader:

            if row:
                data = {
                    'club': row[0],
                    'number_location': row[1]
                }
                serializer = NumberLocationSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        number_locations = NumberLocation.objects.all()

        serializer = NumberLocationSerializer(number_locations, many=True)

        return Response(serializer.data)
    
class CreateNumberLocationTemplate(APIView):
    def get(self, _request):

        filename = 'numberlocationtemplate - ' + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact='Accepted')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=',')
        writer.writerow(['Host club', 'Number location' ])

        unique_host_clubs = []

        for crew in crews:

            if crew.host_club not in unique_host_clubs:
                unique_host_clubs.append(crew.host_club)

        unique_host_clubs.sort(key=lambda x: x.name)

        for club in unique_host_clubs:
            writer.writerow(
                [
                    club.name,
                    ''

                ])

        return response




