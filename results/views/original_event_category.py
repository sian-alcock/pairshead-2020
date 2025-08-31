import csv, io
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from ..models import OriginalEventCategory, Crew
from ..serializers import ImportOriginalEventSerializer


class OriginalEventCategoryImport(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        # clear existing
        OriginalEventCategory.objects.all().delete()

        # parse uploaded file
        file = request.FILES['file']
        decoded_file = io.TextIOWrapper(file.file, encoding='utf-8')
        reader = csv.reader(decoded_file)
        next(reader, None)  # skip header row

        created_count = 0
        errors = []
        matched_crews = 0
        unmatched_crews = 0

        for row in reader:
            if row:
                crew_id = row[0]
                event_original = row[1]

                # check if crew exists in DB
                if Crew.objects.filter(pk=crew_id).exists():
                    matched_crews += 1
                else:
                    unmatched_crews += 1

                data = {
                    'crew': crew_id,
                    'event_original': event_original,
                }
                serializer = ImportOriginalEventSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()
                    created_count += 1
                else:
                    errors.append({'row': row, 'errors': serializer.errors})

        event_categories = OriginalEventCategory.objects.all()
        serializer = ImportOriginalEventSerializer(event_categories, many=True)
        try:
            Crew.update_all_computed_properties()
        except Exception:
            pass

        return Response({
            "status": "success",
            "created_count": created_count,
            "matched_crews": matched_crews,
            "unmatched_crews": unmatched_crews,
            "data": serializer.data,
            "errors": errors
        })
