import csv
import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, ParseError
from ..serializers import ImportNumberLocationSerializer
from ..models import NumberLocation, Crew

class ImportNumberLocationCSVFolder(APIView):
    # This function imports the csv from the projects folder
    # Ideally replace with one imported via the frontend (from others that are working)
    # Start by deleting all existing event cats

    def get(self, _request):
        NumberLocation.objects.all().delete()
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "../csv/number_location.csv"
        abs_file_path = os.path.join(script_dir, rel_path)

        with open(abs_file_path, newline='') as f:
            reader = csv.reader(f)
            next(reader) # skips the first row

            for row in reader:

                if row:
                    data = {
                        'club': row[0],
                        'number_location': row[1],
                    }
                    serializer = ImportNumberLocationSerializer(data=data)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()

            number_locations = NumberLocation.objects.all()

            serializer = ImportNumberLocationSerializer(number_locations, many=True)

            # self.calculate_computed_properties()


            return Response(serializer.data)
        
    # def calculate_computed_properties(self):

    #     for crew in Crew.objects.all():
    #         crew.event_band = crew.calc_event_band()
    #         crew.draw_start_score = crew.calc_draw_start_score()
    #         crew.calculated_start_order = crew.calc_calculated_start_order()
    #         crew.save()


