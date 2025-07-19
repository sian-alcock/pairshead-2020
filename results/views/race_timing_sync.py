from rest_framework import generics
from ..serializers import RaceTimingSyncSerializer

from ..models import RaceTimingSync

class RaceTimingSyncListView(generics.ListCreateAPIView):
    queryset = RaceTimingSync.objects.all()
    serializer_class = RaceTimingSyncSerializer

class RaceTimingSyncDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RaceTimingSync.objects.all()
    serializer_class = RaceTimingSyncSerializer