import csv
from .helpers import decode_utf8
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..serializers import ImportMarshallingDivisionSerializer
from ..models import MarshallingDivision

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

