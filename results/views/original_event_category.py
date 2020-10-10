import csv
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from ..serializers import ImportOriginalEventSerializer
from ..models import OriginalEventCategory, Crew

class OriginalEventCategoryImport(APIView):
    # Start by deleting all existing event cats

    def get(self, _request):
        OriginalEventCategory.objects.all().delete()
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "../csv/original_event_categories.csv"
        abs_file_path = os.path.join(script_dir, rel_path)

        with open(abs_file_path, newline='') as f:
            reader = csv.reader(f)
            next(reader) # skips the first row

            for row in reader:

                if row:
                    data = {
                        'crew': row[0],
                        'event_original': row[1]
                    }
                    serializer = ImportOriginalEventSerializer(data=data)
                    if serializer.is_valid():
                        serializer.save()

            original_event_categories = OriginalEventCategory.objects.all()

            serializer = ImportOriginalEventSerializer(original_event_categories, many=True)

            # self.calculate_computed_properties()

            return Response(serializer.data)
    
    def calculate_computed_properties(self):

        for crew in Crew.objects.all():
            print('masters adjustment ' + str(crew.masters_adjustment))
            print('crew category position ' + str(crew.category_position_time))
            print('crew category rank ' + str(crew.category_rank))
            crew.save()
        
