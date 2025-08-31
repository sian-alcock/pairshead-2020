from rest_framework import generics
from ..serializers import RaceTimingSyncSerializer

from ..models import RaceTimingSync, Crew

class RaceTimingSyncListView(generics.ListCreateAPIView):
    queryset = RaceTimingSync.objects.all()
    serializer_class = RaceTimingSyncSerializer
    try:
        Crew.update_all_computed_properties()
    except Exception:
        pass

class RaceTimingSyncDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RaceTimingSync.objects.all()
    serializer_class = RaceTimingSyncSerializer
    try:
        Crew.update_all_computed_properties()
    except Exception:
        pass