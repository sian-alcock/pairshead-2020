import os
import csv, sys
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, ParseError
from ..serializers import WriteEventOrderSerializer
from ..models import EventOrder, Crew

class ImportEventOrderCSVFolder(APIView):
    # This function imports the csv from the projects folder
    # Ideally replace with one imported via the frontend below
    # Start by deleting all existing event cats

    def get(self, _request):
        EventOrder.objects.all().delete()
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "../csv/event_order.csv"
        abs_file_path = os.path.join(script_dir, rel_path)

        with open(abs_file_path, newline='') as f:
            reader = csv.reader(f)
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

            self.calculate_computed_properties()


            return Response(serializer.data)
        
    def calculate_computed_properties(self):

        for crew in Crew.objects.all():
            crew.event_band = crew.calc_event_band()
            crew.draw_start_score = crew.calc_draw_start_score()
            crew.calculated_start_order = crew.calc_calculated_start_order()
            crew.save()

# class EventOrderImport(APIView):
#     # This function ATTEMPTS to import the csv from frontend
#     # Should replace the function above when working
#     # Start by deleting all existing event cats

#     parser_classes = (FormParser, MultiPartParser)

#     def post(self, request):
#         EventOrder.objects.all().delete()
#         # Convert the InMemoryUploadedFile to a NamedTemporaryFile
#         for csv_upload in request.FILES.values():
#             file_temp = tempfile.NamedTemporaryFile()
#             file_temp.write(csv_upload.read())
#             print(file_temp.name) # This is the path.

#             with open(file_temp.name, newline='') as f:
#                 reader = csv.reader(f)
#                 next(reader) # skips the first row

#                 for row in reader:

#                     if row:
#                         data = {
#                             'event': row[0],
#                             'event_order': row[1]
#                         }
#                         serializer = ImportEventOrderSerializer(data=data)
#                         if serializer.is_valid():
#                             serializer.save()

#                 event_orders = EventOrder.objects.all()

#                 serializer = ImportEventOrderSerializer(event_orders, many=True)

#                 self.calculate_computed_properties()

#                 file_temp.close()

#                 return Response(serializer.data)

#         return Response({"Success!": "CSV imported OK"})

#     def calculate_computed_properties(self):

#         for crew in Crew.objects.all():
#             crew.event_band = crew.calc_event_band()
#             crew.save()



# Attempt to read in the event order CSV from the front end

class EventOrderImport(APIView):
    parser_classes = (FormParser, MultiPartParser)

    def post(self, request):
        EventOrder.objects.all().delete()
        # Convert the InMemoryUploadedFile to a NamedTemporaryFile
        for csv_upload in request.FILES.values():
            file_temp = tempfile.NamedTemporaryFile()
            file_temp.write(csv_upload.read())
            print(file_temp.name) # This is the path.

            with open(file_temp.name, newline='', encoding='utf-8') as f:
                reader = csv.reader(f)
                # print(reader)
                print('we have a reader if we are here')
                next(reader) # skips the first row

                # check_file = os.path.getsize(file_temp.name)

                # if(check_file == 0):
                #     print("The file is empty.")
                #     return Response({"Bummer!": "There is no data or data is not recognized"})
                # else:
                #     print("The file is not empty.")

                #     result = []

                #     for row in reader:
                #         print('are we getting to here within the row??')
                #         result.append(row[0])

                #     print(result)

                try:
                    for row in reader:
                        if row:
                            data = {
                                'event': row[0],
                                'event_order': row[1]
                            }
                            serializer = WriteEventOrderSerializer(data=data)
                            if serializer.is_valid(raise_exception=True):
                                serializer.save()

                            event_orders = EventOrder.objects.all()

                            serializer = WriteEventOrderSerializer(event_orders, many=True)

                            # self.calculate_computed_properties()

                            file_temp.close()

                            return Response(serializer.data)
                
                except csv.Error as e:
                    sys.exit('file {}, line {}: {}'.format(file_temp.name, reader.line_num, e))



        return Response({"Success!": "CSV imported OK"})
    
    # def calculate_computed_properties(self):

    #     for crew in Crew.objects.all():
    #         crew.event_band = crew.calc_event_band()
    #         crew.draw_start_score = crew.calc_draw_start_score()
    #         crew.calculated_start_order = crew.calc_calculated_start_order()
    #         crew.save()


