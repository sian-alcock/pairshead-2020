from django.http import JsonResponse
from django.views import View
from django.db.models import Q
from collections import defaultdict
import json
from ..models import Crew, Race, RaceTime, RaceTimingSync

class ResultsComparisonView(View):

    def post(self, request):
        """
        Compare results between two different start/finish race combinations
        """
        try:
            data = json.loads(request.body)
            
            # Extract race selections for both comparisons
            comparison1 = data.get('comparison1', {})
            comparison2 = data.get('comparison2', {})
            
            start_race_1_id = comparison1.get('start_race_id')
            finish_race_1_id = comparison1.get('finish_race_id')
            start_race_2_id = comparison2.get('start_race_id')
            finish_race_2_id = comparison2.get('finish_race_id')
            
            if not all([start_race_1_id, finish_race_1_id, start_race_2_id, finish_race_2_id]):
                return JsonResponse({'error': 'All race selections are required'}, status=400)
            
            # Get results for both comparisons
            results1 = self._get_results_for_races(start_race_1_id, finish_race_1_id)
            results2 = self._get_results_for_races(start_race_2_id, finish_race_2_id)
            
            # Get race names for display
            races = Race.objects.filter(
                id__in=[start_race_1_id, finish_race_1_id, start_race_2_id, finish_race_2_id]
            ).values('id', 'name')
            race_names = {race['id']: race['name'] for race in races}
            
            return JsonResponse({
                'comparison1': {
                    'start_race': race_names.get(start_race_1_id),
                    'finish_race': race_names.get(finish_race_1_id),
                    'results': results1
                },
                'comparison2': {
                    'start_race': race_names.get(start_race_2_id),
                    'finish_race': race_names.get(finish_race_2_id),
                    'results': results2
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    def _get_results_for_races(self, start_race_id, finish_race_id):
        """
        Calculate results for a given start/finish race combination
        """
        try:
            start_race = Race.objects.get(id=start_race_id)
            finish_race = Race.objects.get(id=finish_race_id)
        except Race.DoesNotExist:
            raise ValueError("Invalid race ID provided")
        
        # Get all crews that have both start and finish times for the specified races
        crews_with_times = Crew.objects.filter(
            times__tap='Start',
            times__race=start_race
        ).filter(
            times__tap='Finish',
            times__race=finish_race
        ).exclude(
            Q(did_not_start=True) | Q(did_not_finish=True) | Q(disqualified=True)
        ).distinct()
        
        # Calculate times and group by event_band
        results_by_category = defaultdict(list)
        
        for crew in crews_with_times:
            try:
                # Get start and finish times
                start_time_record = crew.times.get(tap='Start', race=start_race)
                finish_time_record = crew.times.get(tap='Finish', race=finish_race)
                
                # Calculate synchronized times
                synchronized_start = self._get_synchronized_time(
                    start_time_record.time_tap, start_race
                )
                synchronized_finish = self._get_synchronized_time(
                    finish_time_record.time_tap, finish_race
                )
                
                raw_time = synchronized_finish - synchronized_start
                if raw_time <= 0:
                    continue  # Skip invalid times
                
                # Apply manual overrides and penalties
                race_time = raw_time + (crew.penalty * 1000)  # Assuming penalty is in seconds
                race_time += (crew.manual_override_minutes * 60 * 1000)
                race_time += (crew.manual_override_seconds * 1000)
                race_time += (crew.manual_override_hundredths_seconds * 10)
                
                # Calculate published time (including masters adjustment if applicable)
                published_time = race_time
                if hasattr(crew, 'calc_masters_adjustment') and crew.calc_masters_adjustment():
                    published_time += crew.calc_masters_adjustment()
                
                event_band = crew.calc_event_band()
                
                results_by_category[event_band].append({
                    'crew_id': crew.id,
                    'crew_name': crew.competitor_names if crew.competitor_names else crew.name,
                    'club_name': crew.club.name if crew.club else '',
                    'bib_number': crew.bib_number,
                    'raw_time': raw_time,
                    'race_time': race_time,
                    'published_time': published_time,
                    'formatted_time': self._format_time(published_time),
                    'penalty': crew.penalty
                })
                
            except RaceTime.DoesNotExist:
                continue  # Skip crews without required times
        
        # Sort results within each category and get winners/runners-up
        category_results = {}
        for event_band, crews in results_by_category.items():
            # Sort by published time
            sorted_crews = sorted(crews, key=lambda x: x['published_time'])
            
            category_results[event_band] = {
                'winner': sorted_crews[0] if len(sorted_crews) > 0 else None,
                'runner_up': sorted_crews[1] if len(sorted_crews) > 1 else None,
                'total_crews': len(sorted_crews)
            }
        
        return category_results
    
    def _get_synchronized_time(self, raw_time_ms, source_race):
        """
        Helper method to get synchronized time for a given race.
        """
        if source_race.is_timing_reference:
            return raw_time_ms
        
        try:
            sync_record = RaceTimingSync.objects.get(target_race=source_race)
            return raw_time_ms + sync_record.timing_offset_ms
        except RaceTimingSync.DoesNotExist:
            return raw_time_ms
    
    def _format_time(self, time_ms):
        """
        Format time in milliseconds to MM:SS.HH format
        """
        if not time_ms or time_ms <= 0:
            return "00:00.00"
        
        total_seconds = time_ms / 1000
        minutes = int(total_seconds // 60)
        seconds = int(total_seconds % 60)
        hundredths = int((time_ms % 1000) / 10)
        
        return f"{minutes:02d}:{seconds:02d}.{hundredths:02d}"