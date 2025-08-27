from django.http import JsonResponse
from django.views import View
from django.db.models import Min, Q
from ..models import Crew, OriginalEventCategory, MastersAdjustment

class MastersCrewsView(View):

    def get(self, request):
        """
        Get all masters crews with handicap calculation details.
        Masters crews are identified by having 'mas' in their event_band.
        """
        
        # Get all masters crews (those with 'mas' in event_band, case insensitive)
        masters_crews = Crew.objects.filter(
            Q(event_band__icontains='mas') | Q(event_band__icontains='Mas'),
            status__in=('Accepted', 'Submitted')
        ).exclude(
            Q(did_not_start=True) | Q(did_not_finish=True) | Q(disqualified=True)
        ).select_related('club', 'event').prefetch_related('event_original')
        
        # Calculate the fastest times used in masters adjustments
        fastest_times = self._get_fastest_times()
        
        masters_data = []
        
        for crew in masters_crews:
            # Get masters adjustment
            masters_adjustment = crew.calc_masters_adjustment() if hasattr(crew, 'calc_masters_adjustment') else 0
            
            # Get original event category
            original_event = None
            if crew.event_original.exists():
                original_event = crew.event_original.first().event_original
            
            # Determine which fastest time category this crew falls into
            fastest_time_category = self._determine_fastest_time_category(crew, original_event)
            applicable_fastest_time = fastest_times.get(fastest_time_category)
            
            # Get master category for lookup
            master_category = None
            if original_event and len(original_event) >= 4:
                if crew.event.gender == 'Open':
                    master_category = original_event[:4]
                if crew.event.gender == 'Female':
                    master_category = original_event[2:6]
                if crew.event.gender == 'Mixed':
                    master_category = original_event[3:7]
            
            # Look up the adjustment details
            adjustment_details = None
            if master_category and applicable_fastest_time:
                try:
                    rounded_fastest = round(int(applicable_fastest_time), -3)
                    adjustment_record = MastersAdjustment.objects.get(
                        master_category=master_category,
                        standard_time_ms=rounded_fastest
                    )
                    adjustment_details = {
                        'master_category': master_category,
                        'standard_time_ms': rounded_fastest,
                        'adjustment_ms': adjustment_record.master_time_adjustment_ms,
                        'found_in_table': True
                    }
                except MastersAdjustment.DoesNotExist:
                    adjustment_details = {
                        'master_category': master_category,
                        'standard_time_ms': rounded_fastest,
                        'adjustment_ms': 0,
                        'found_in_table': False
                    }
            
            masters_data.append({
                'crew_id': crew.id,
                'name': crew.competitor_names if crew.competitor_names else crew.name,
                'bib_number': crew.bib_number,
                'club': crew.club.name if crew.club else '',
                'event_band': crew.event_band,
                'original_event_category': original_event,
                'raw_time': crew.raw_time,
                'masters_adjustment': masters_adjustment,
                'published_time': crew.published_time,
                'event_type': crew.event.type if crew.event else None,
                'event_gender': crew.event.gender if crew.event else None,
                'fastest_time_category': fastest_time_category,
                'applicable_fastest_time': applicable_fastest_time,
                'adjustment_details': adjustment_details,
                'has_valid_times': crew.raw_time is not None and crew.raw_time > 0,
                'status': crew.status,
            })
        
        # Calculate summary statistics
        total_masters = len(masters_data)
        with_adjustments = len([c for c in masters_data if c['masters_adjustment'] and c['masters_adjustment'] != 0])
        with_times = len([c for c in masters_data if c['has_valid_times']])
        
        return JsonResponse({
            'masters_crews': masters_data,
            'fastest_times': fastest_times,
            'summary': {
                'total_masters_crews': total_masters,
                'crews_with_adjustments': with_adjustments,
                'crews_with_times': with_times,
                'crews_without_times': total_masters - with_times,
            }
        })
    
    def _get_fastest_times(self):
        """
        Calculate the fastest times for each category used in masters adjustments.
        """
        fastest_times = {}
        
        # Only calculate if OriginalEventCategory with '2x' exists
        if not OriginalEventCategory.objects.filter(event_original='2x').exists():
            return fastest_times
        
        # Get fastest times for each category
        categories = [
            ('fastest_men_scull', Q(event_band__startswith='Op', event_band__contains='2x')),
            ('fastest_men_sweep', Q(event_band__startswith='Op', event_band__contains='2-')),
            ('fastest_female_scull', Q(event_band__startswith='W', event_band__contains='2x')),
            ('fastest_female_sweep', Q(event_band__startswith='W', event_band__contains='2-')),
            ('fastest_mixed_scull', Q(event_band__startswith='Mx', event_band__contains='2x')),
        ]
        
        for category_name, filter_q in categories:
            result = Crew.objects.filter(filter_q, raw_time__gt=0).aggregate(Min('raw_time'))
            fastest_times[category_name] = result.get('raw_time__min')
        
        return fastest_times
    
    def _determine_fastest_time_category(self, crew, original_event):
        """
        Determine which fastest time category applies to this crew for masters adjustment.
        """
        if not original_event or not crew.event:
            return None
        
        # Check if this is a 2x (scull) event
        if '2x' in original_event:
            if crew.event.gender == 'Open':
                return 'fastest_men_scull'
            elif crew.event.gender == 'Women':
                return 'fastest_female_scull'
            elif crew.event.gender == 'Mixed':
                return 'fastest_mixed_scull'
        
        # Check if this is a 2- (sweep) event
        elif '2-' in original_event:
            if crew.event.gender == 'Open':
                return 'fastest_men_sweep'
            elif crew.event.gender == 'Women':
                return 'fastest_female_sweep'
        
        return None