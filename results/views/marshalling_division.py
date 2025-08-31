import csv
from .helpers import decode_utf8
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from ..serializers import ImportMarshallingDivisionSerializer, MarshallingDivisionSerializer
from ..models import MarshallingDivision

class MarshallingDivisionListView(generics.ListCreateAPIView):
    queryset = MarshallingDivision.objects.all()
    serializer_class = MarshallingDivisionSerializer

class MarshallingDivisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MarshallingDivision.objects.all()
    serializer_class = MarshallingDivisionSerializer

class BulkUpdateMarshallingDivisions(APIView):
    """
    Handle bulk updates of marshalling divisions with automatic range calculation
    """
    def put(self, request):
        divisions_data = request.data.get('divisions', [])
        
        if not divisions_data:
            return Response(
                {'error': 'No divisions data provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Clear existing divisions
                MarshallingDivision.objects.all().delete()
                
                # Sort by order (assuming you have an order field or use array index)
                divisions_data.sort(key=lambda x: x.get('order', 0))
                
                created_divisions = []
                current_bottom = 1  # Start from 1
                
                for i, division_data in enumerate(divisions_data):
                    # Calculate ranges
                    bottom_range = current_bottom
                    top_range = division_data.get('top_range', bottom_range + 99)
                    
                    # Ensure top_range is at least bottom_range
                    if top_range < bottom_range:
                        top_range = bottom_range
                    
                    division = MarshallingDivision.objects.create(
                        name=division_data.get('name', f'Division {i+1}'),
                        bottom_range=bottom_range,
                        top_range=top_range
                    )
                    created_divisions.append(division)
                    
                    # Next division starts where this one ends + 1
                    current_bottom = top_range + 1
                
                # Serialize and return the created divisions
                serializer = MarshallingDivisionSerializer(created_divisions, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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
                serializer = ImportMarshallingDivisionSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        marshalling_divisions = MarshallingDivision.objects.all()

        serializer = ImportMarshallingDivisionSerializer(marshalling_divisions, many=True)

        return Response(serializer.data)

