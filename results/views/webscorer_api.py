import os
# class RaceTimeDataImport(APIView):
# # Not finished... attempting to get race time data direct from Webscorer via API

    # User = os.getenv("WEBSCORERUSER")
    # Password = os.getenv("WEBSCORERPASS")
  
#     def get(self, _request):
#         # Start by deleting all existing times
#         RaceTime.objects.all().delete()

#         headers = {'content-type': 'application/json'}
#         payload = {
#             # "raceid":198625,
#             "raceid":224232,
#             "EmailAddress":User,
#             "Password":Password,
#             "udid": "ffffff75e3bbe75cd7432863a0d8937b396fffff"
#             }

#         url = "https://api.webscorer.com/racetimer/webscorerapi/taps"

#         r = requests.get(url, params=payload, headers=headers)
      
#         if r.status_code == 200:
#             # print(r.url)
#             # print(data)
#             # print(r.json.loads(r)['FastTaps'])

#             for time in r.json()['FastTaps']:

#                 data = {
#                     'sequence': time['SequenceNumber'],
#                     'tap': time['Lap'],
#                     'time_tap': time['RaceClock'],
#                     'bib_tap': time['BibRaceClock'],
#                     'bib_number': time['Bib'],
#                     # 'crew': time['Name'] or None,
#                 }

#                 serializer = ImportRaceTimesSerializer(data=data)
#                 serializer.is_valid(raise_exception=True)
#                 serializer.save()

#             times = RaceTime.objects.all()
#             serializer = RaceTimesSerializer(times, many=True)
#             return Response(serializer.data)

#         return Response(status=400)






# class ImportRaceTimesSerializer(serializers.ModelSerializer):
# This will be the serializer for the web scorer import from API which should replace import from csv
# Not working yet - struggling to get a link between times and crew
#     time_tap = serializers.FloatField()
#     bib_tap = serializers.FloatField()
#     # crew = serializers.CharField(max_length=20, allow_null=True)
#     # crew = Crew.objects.get(bib_number='bib_number')

#     class Meta:
#         model = RaceTime
#         fields = ('id', 'sequence', 'bib_number', 'tap', 'time_tap', 'bib_tap', 'crew',)

#     def validate_time_tap(self, value):
#         # time tap format is in seconds
#         # convert to miliseconds
#         value = float(value) * 1000

#         return int(value)

#     def validate_bib_tap(self, value):
#         # time tap format is in seconds
#         # convert to miliseconds
#         value = float(value) * 1000

#         return int(value)

#     def validate_tap(self, value):
#         # taken from 'lap' in webscorer (0 = start, 1 = finish)
#         if value == "0":
#             value = 'Start'
#         elif value == "1":
#             value = 'Finish'

#         return value

    # def validate_crew(self, value):
    #     value = re.search(r"\(([A-Za-z0-9_]+)\)", str(value))
    #     # print(value.group(1))
    #     if value is None or re.match(r'^-?\d+(?:\.\d+)?$', str(value.group(1))) is None:
    #         value = None
    #     else:
    #         value = int(value.group(1))
    #     print(value)
    #     print(isinstance(value, int))
    #     return value

    # def validate_crew(self, value):
    #     value = Crew.objects.get(bib_number=self.bib_number)
    #     return value