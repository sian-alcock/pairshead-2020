from rest_framework import generics
from ..serializers import RaceTimingSyncSerializer

from ..models import RaceTimingSync, Crew

class RaceTimingSyncListView(generics.ListCreateAPIView):
    queryset = RaceTimingSync.objects.all()
    serializer_class = RaceTimingSyncSerializer
    Crew.update_all_computed_properties()

class RaceTimingSyncDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RaceTimingSync.objects.all()
    serializer_class = RaceTimingSyncSerializer
    Crew.update_all_computed_properties()