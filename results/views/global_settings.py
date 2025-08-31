from rest_framework import generics, status
from rest_framework.response import Response
from ..serializers import GlobalSettingsSerializer
from ..models import GlobalSettings

class GlobalSettingsListView(generics.ListCreateAPIView):
    serializer_class = GlobalSettingsSerializer
    
    def get_queryset(self):
        # Simple approach: just get or create the singleton
        GlobalSettings.get_instance()
        return GlobalSettings.objects.filter(id=1)

class GlobalSettingsDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GlobalSettingsSerializer
    
    def get_object(self):
        # Always return the singleton instance
        return GlobalSettings.get_instance()
    
    def destroy(self, request, *args, **kwargs):
        # Prevent deletion
        return Response(
            {"error": "Cannot delete global settings"}, 
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )