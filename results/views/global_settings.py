from rest_framework import generics
from ..serializers import GlobalSettingsSerializer
from ..models import GlobalSettings

class GlobalSettingsListView(generics.ListCreateAPIView):
    queryset = GlobalSettings.objects.all()
    serializer_class = GlobalSettingsSerializer

class GlobalSettingsDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GlobalSettings.objects.all()
    serializer_class = GlobalSettingsSerializer