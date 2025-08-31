from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Q, Exists, OuterRef
from ..models import Race, Crew, RaceTime, OriginalEventCategory, EventOrder, MarshallingDivision, NumberLocation

class DataOverviewStatsView(generics.GenericAPIView):
    """
    Get stats for Crew dashboard
    """
    
    def get(self, request, *args, **kwargs):
        phase = request.query_params.get('phase', 'setup')  # or whatever makes sense as default


        stats = self.get_stats_data(phase)
        return Response(stats)

    def get_stats_data(self, phase):
        """
        Get stats based on phase - only calculate what's needed
        """
        stats = {
            'phase': phase,
            'last_updated': timezone.now().isoformat()
        }
        
        # Common stats for all phases
        stats.update(self.get_common_stats())
        
        # Phase-specific stats
        if phase == 'setup':
            stats.update(self.get_setup_stats())
        elif phase == 'pre-race':
            stats.update(self.get_prerace_stats())
        elif phase == 'race':
            stats.update(self.get_race_stats())
        
        return stats

    def get_common_stats(self):
        """Stats needed across all phases"""
        return {
            'total_crews_count': Crew.objects.count(),
            'scratched_crews_count': Crew.objects.filter(status__exact='Scratched').count(),
            'withdrawn_crews_count': Crew.objects.filter(status__exact='Withdrawn').count(),
            'accepted_crews_count': Crew.objects.filter(status__exact='Accepted').count(),
            'submitted_crews_count': Crew.objects.filter(status__exact='Submitted').count(),
        }
    
    def get_setup_stats(self):
        """Stats specific to setup phase"""        
        return {
            'event_order_count': EventOrder.objects.count(),
            'crews_with_start_order_count': Crew.objects.filter(calculated_start_order__gt=0).exclude(calculated_start_order=9999999,).count(),
        }
    
    def get_prerace_stats(self):
        """Stats specific to pre-race phase"""
        return {
            'marshalling_divisions_count': MarshallingDivision.objects.count(),
            'number_locations_count': NumberLocation.objects.count(),
        }
    
    def get_race_stats(self):
        """Stats specific to race phase"""
        original_events = OriginalEventCategory.objects.count() if OriginalEventCategory.objects.exists() else 0

        return {
            'races_count': Race.objects.count(),
            'race_times_count': RaceTime.objects.count(),
            'race_times_count': RaceTime.objects.count(),
            'original_event_categories_imported': original_events,
            'masters_crews_count': Crew.objects.filter(
                Q(event_band__icontains='mas')
            ).count(),
        }
        