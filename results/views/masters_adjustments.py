import csv
import os

from rest_framework.views import APIView
from rest_framework.response import Response

from ..serializers import WriteMastersAdjustmentSerializer

from ..models import MastersAdjustment


class MastersAdjustmentsImport(APIView):
    # Start by deleting all existing times

    def get(self, _request):
        MastersAdjustment.objects.all().delete()
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "../csv/masters_adjustments.csv"
        abs_file_path = os.path.join(script_dir, rel_path)

        with open(abs_file_path, newline='') as f:
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
                    if serializer.is_valid():
                        serializer.save()

            masters_adjustments = MastersAdjustment.objects.all()

            serializer = WriteMastersAdjustmentSerializer(masters_adjustments, many=True)

            return Response(serializer.data)