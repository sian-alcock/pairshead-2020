import csv
from .helpers import decode_utf8
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..serializers import WriteEventOrderSerializer
from ..models import EventOrder

class EventOrderImport(APIView):
    # This function ATTEMPTS to import the csv from frontend
    # Start by deleting all existing event cats

    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        EventOrder.objects.all().delete()

        reader = csv.reader(decode_utf8(request.FILES['file']))
        next(reader) # skips the first row
        for row in reader:

            if row:
                data = {
                    'event': row[0],
                    'event_order': row[1]
                }
                serializer = WriteEventOrderSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        event_orders = EventOrder.objects.all()

        serializer = WriteEventOrderSerializer(event_orders, many=True)

        return Response(serializer.data)
