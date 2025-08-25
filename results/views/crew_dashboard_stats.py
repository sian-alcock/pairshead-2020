from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Q, Exists, OuterRef
from ..models import Race, Crew, RaceTime, OriginalEventCategory

class DataOverviewStatsView(generics.GenericAPIView):
    """
    Get stats for Crew dashboard
    """
    
    def get(self, request, *args, **kwargs):
        stats = self.get_stats_data()
        return Response(stats)
    
    def get_stats_data(self):
        """
        Model counts etc
        """
        original_events = 0

        if OriginalEventCategory.objects.count() > 0:
            original_events = OriginalEventCategory.objects.count()
        else:
            original_events = 0

        return {
            'original_event_categories_imported': original_events,
            'races_count': Race.objects.count(),
            'crews_count': Crew.objects.filter(status__exact='Accepted').count(),
            'race_times_count': RaceTime.objects.count(),
            'masters_crews_count': Crew.objects.filter(
                Q(event_band__icontains='mas')
            ).count(),
            'last_updated': timezone.now().isoformat()
        }
        