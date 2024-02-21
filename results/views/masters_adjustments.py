import csv
import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, ParseError

from ..serializers import WriteMastersAdjustmentSerializer

from ..models import MastersAdjustment


# Attempt to read in the masters adjustment CSV from the front end

class MastersAdjustmentsImport(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        MastersAdjustment.objects.all().delete()
        # Convert the InMemoryUploadedFile to a NamedTemporaryFile
        for csv_upload in request.FILES.values():
            file_temp = tempfile.NamedTemporaryFile()
            file_temp.write(csv_upload.read())
            print(file_temp.name) # This is the path.

            with open(file_temp.name, newline='') as f:
                reader = csv.reader(f)
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
                        if serializer.is_valid(raise_exception=True):
                            serializer.save()

                masters_adjustments = MastersAdjustment.objects.all()

                serializer = WriteMastersAdjustmentSerializer(masters_adjustments, many=True)

                file_temp.close()

                return Response(serializer.data)

        return Response({"Success!": "CSV imported OK"})
