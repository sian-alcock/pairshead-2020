import csv
from .helpers import decode_utf8
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from ..serializers import WriteMastersAdjustmentSerializer

from ..models import MastersAdjustment

class MastersAdjustmentsImport(APIView):
    # This function imports the csv from frontend
    # Start by deleting all existing masters adjustments

    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        MastersAdjustment.objects.all().delete()

        reader = csv.reader(decode_utf8(request.FILES['file']))
        next(reader) # skips the first row
        for row in reader:

            if row:
                data = {
                    'standard_time_label': row[0],
                    'standard_time_ms': row[1],
                    'master_category': row[2],
                    'master_time_adjustment_ms':row[3]
                }
                serializer = WriteMastersAdjustmentSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()

        masters_adjustments = MastersAdjustment.objects.all()

        serializer = WriteMastersAdjustmentSerializer(masters_adjustments, many=True)

        return Response(serializer.data)
    
