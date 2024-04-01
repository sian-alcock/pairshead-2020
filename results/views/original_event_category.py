import csv
from .helpers import decode_utf8
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..serializers import ImportOriginalEventSerializer
from ..models import OriginalEventCategory


class OriginalEventCategoryImport(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        OriginalEventCategory.objects.all().delete()

        reader = csv.reader(decode_utf8(request.FILES['file']))
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

        event_categories = OriginalEventCategory.objects.all()

        serializer = ImportOriginalEventSerializer(event_categories, many=True)

        return Response(serializer.data)

