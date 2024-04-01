import csv
from .helpers import decode_utf8
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, ParseError
from ..serializers import ImportNumberLocationSerializer
from ..models import NumberLocation, Crew

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
                serializer = ImportNumberLocationSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        number_locations = NumberLocation.objects.all()

        serializer = ImportNumberLocationSerializer(number_locations, many=True)

        return Response(serializer.data)



