import csv
import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, ParseError
from ..serializers import ImportOriginalEventSerializer
from ..models import OriginalEventCategory, Crew


class OriginalEventCategoryImport(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        OriginalEventCategory.objects.all().delete()
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
                            'crew': row[0],
                            'event_original': row[1]
                        }
                        serializer = ImportOriginalEventSerializer(data=data)
                        if serializer.is_valid(raise_exception=True):
                            serializer.save()

                original_event_categories = OriginalEventCategory.objects.all()

                serializer = ImportOriginalEventSerializer(original_event_categories, many=True)

                file_temp.close()

                return Response(serializer.data)

        return Response({"Success!": "CSV imported OK"})


class ImportOriginalEventCategoryCSVFolder(APIView):
    # This function imports the csv from the projects folder
    # Ideally replace with one imported via the frontend (from others that are working)
    # Start by deleting all existing race times

    def post(self, _request):
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
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()

            original_event_categories = OriginalEventCategory.objects.all()

            serializer = ImportOriginalEventSerializer(original_event_categories, many=True)

            return Response(serializer.data)
