from django.http import JsonResponse
from django.views import View
from django.db.models import Q
from ..models import Crew, Race

class MissingTimesView(View):

    def get(self, request):
        """
        Get crews that are missing start times, finish times, or both.
        Only includes crews with accepted/submitted status.
        """
        
        # Get crews that should have times (not scratched, DNS, DNF, DQ)
        crews = Crew.objects.filter(
            status__in=('Accepted', 'Submitted')
        ).exclude(
            Q(did_not_start=True) | Q(did_not_finish=True) | Q(disqualified=True)
        ).select_related('club').prefetch_related('times__race')
        
        missing_times_data = []
        
        for crew in crews:
            # Check for start and finish times
            start_times = crew.times.filter(tap='Start')
            finish_times = crew.times.filter(tap='Finish')
            
            has_start = start_times.exists()
            has_finish = finish_times.exists()
            
            # Only include crews that are missing at least one type of time
            if not has_start or not has_finish:
                # Get the actual times if they exist
                start_time = None
                finish_time = None
                start_race_name = None
                finish_race_name = None
                
                if has_start:
                    start_record = start_times.first()
                    start_time = start_record.time_tap
                    start_race_name = start_record.race.name if start_record.race else 'Unknown'
                
                if has_finish:
                    finish_record = finish_times.first()
                    finish_time = finish_record.time_tap
                    finish_race_name = finish_record.race.name if finish_record.race else 'Unknown'
                
                missing_times_data.append({
                    'crew_id': crew.id,
                    'name': crew.competitor_names if crew.competitor_names else crew.name,
                    'club': crew.club.name if crew.club else '',
                    'bib_number': crew.bib_number,
                    'start_time': start_time,
                    'finish_time': finish_time,
                    'start_race': start_race_name,
                    'finish_race': finish_race_name,
                    'missing_start': not has_start,
                    'missing_finish': not has_finish,
                    'missing_both': not has_start and not has_finish,
                    'status': crew.status,
                })
        
        # Calculate summary statistics
        total_missing = len(missing_times_data)
        missing_start_only = len([c for c in missing_times_data if c['missing_start'] and not c['missing_finish']])
        missing_finish_only = len([c for c in missing_times_data if c['missing_finish'] and not c['missing_start']])
        missing_both = len([c for c in missing_times_data if c['missing_both']])
        
        return JsonResponse({
            'crews_missing_times': missing_times_data,
            'summary': {
                'total_crews_missing_times': total_missing,
                'missing_start_only': missing_start_only,
                'missing_finish_only': missing_finish_only,
                'missing_both': missing_both,
                'total_crews_checked': crews.count()
            }
        })