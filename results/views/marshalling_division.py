import csv

from django.http import HttpResponse
from .helpers import decode_utf8
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from ..serializers import MarshallingDivisionSerializer
from ..models import MarshallingDivision

class MarshallingDivisionListView(generics.ListCreateAPIView):
    queryset = MarshallingDivision.objects.all()
    serializer_class = MarshallingDivisionSerializer

class MarshallingDivisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MarshallingDivision.objects.all()
    serializer_class = MarshallingDivisionSerializer

class ImportMarshallingDivision(APIView):
    # This function imports the csv from frontend
    # Start by deleting all existing marshalling divisions

    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        MarshallingDivision.objects.all().delete()

        reader = csv.reader(decode_utf8(request.FILES['file']))
        next(reader) # skips the first row
        for row in reader:

            if row:
                data = {
                    'name': row[0],
                    'bottom_range': row[1],
                    'top_range': row[2],

                }
                serializer = MarshallingDivisionSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        marshalling_divisions = MarshallingDivision.objects.all()

        serializer = MarshallingDivisionSerializer(marshalling_divisions, many=True)

        return Response(serializer.data)

