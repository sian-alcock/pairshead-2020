from django.http import JsonResponse
from django.views import View
from django.db.models import Q
from collections import defaultdict
import json
from ..models import Race, RaceTime

class RawTimeComparisonView(View):

    def get(self, request):
        """
        Compare raw times (finish - start) across different Race timing systems.
        Groups by crew and calculates confidence based on time differences.
        """
        # Get all races that have both start and finish timing data
        races_with_complete_times = Race.objects.filter(
            race_times__tap='Start'
        ).filter(
            race_times__tap='Finish'
        ).distinct().order_by('name')
        
        if not races_with_complete_times.exists():
            return JsonResponse({
                'error': 'No races found with both Start and Finish timing data'
            }, status=404)
        
        # Get all race times (both start and finish) for these races
        race_times = RaceTime.objects.filter(
            race__in=races_with_complete_times,
        ).select_related('crew', 'race').order_by('crew__bib_number', 'race__id', 'tap')
        
        # Build race info
        race_info = {}
        for race in races_with_complete_times:
            race_info[race.id] = {
                'name': race.name,
                'race_id': race.race_id,
                'is_reference': race.is_timing_reference
            }
        
        # Group race times by crew and race, separating start and finish
        crew_race_times = defaultdict(lambda: defaultdict(lambda: {'start': None, 'finish': None}))
        unassigned_times = defaultdict(lambda: defaultdict(lambda: {'start': None, 'finish': None}))
        
        for race_time in race_times:
            tap_type = race_time.tap.lower()
            if race_time.crew:
                crew_race_times[race_time.crew.id][race_time.race.id][tap_type] = race_time
            else:
                unassigned_times[race_time.race.id][race_time.id][tap_type] = race_time
        
        # Calculate raw times and build comparison data
        comparison_data = []
        
        for crew_id, race_data in crew_race_times.items():
            # Get crew info
            crew_info = None
            for race_id, times in race_data.items():
                if times['start'] and times['start'].crew:
                    crew = times['start'].crew
                    crew_info = {
                        'id': crew.id,
                        'bib_number': crew.bib_number,
                        'name': crew.name,
                        'competitor_names': crew.competitor_names,
                        'club': crew.club.name if crew.club else None,
                    }
                    break
                elif times['finish'] and times['finish'].crew:
                    crew = times['finish'].crew
                    crew_info = {
                        'id': crew.id,
                        'bib_number': crew.bib_number,
                        'name': crew.name,
                        'competitor_names': crew.competitor_names,
                        'club': crew.club.name if crew.club else None,
                    }
                    break
            
            if not crew_info:
                continue
            
            row = {
                'crew': crew_info,
                'raw_times': {},  # race_id -> raw_time (in centiseconds)
                'race_time_details': {},  # race_id -> {start, finish, raw_time}
                'missing_races': [],
                'incomplete_races': [],  # races with only start or finish
            }
            
            raw_times_list = []
            
            # Calculate raw times for each race
            for race_id in race_info.keys():
                if race_id in race_data:
                    times = race_data[race_id]
                    start_time = times['start']
                    finish_time = times['finish']
                    
                    if start_time and finish_time:
                        # Calculate raw time (finish - start) in centiseconds
                        raw_time = finish_time.time_tap - start_time.time_tap
                        
                        row['raw_times'][race_id] = raw_time
                        row['race_time_details'][race_id] = {
                            'start_id': start_time.id,
                            'finish_id': finish_time.id,
                            'start_time': start_time.time_tap,
                            'finish_time': finish_time.time_tap,
                            'raw_time': raw_time,
                        }
                        raw_times_list.append(raw_time)
                    elif start_time or finish_time:
                        # Has one but not the other
                        row['incomplete_races'].append(race_id)
                        row['race_time_details'][race_id] = {
                            'start_id': start_time.id if start_time else None,
                            'finish_id': finish_time.id if finish_time else None,
                            'start_time': start_time.time_tap if start_time else None,
                            'finish_time': finish_time.time_tap if finish_time else None,
                            'raw_time': None,
                            'incomplete': True,
                        }
                else:
                    row['missing_races'].append(race_id)
            
            # Calculate confidence metrics
            if len(raw_times_list) >= 2:
                max_time = max(raw_times_list)
                min_time = min(raw_times_list)
                time_spread = (max_time - min_time)/10  # in centiseconds
                avg_time = sum(raw_times_list) / len(raw_times_list)
                
                # Determine confidence level based on spread (100 centiseconds = 1 second)
                if time_spread <= 100:  # 1.0s
                    confidence = 'high'
                    confidence_score = 3
                elif time_spread <= 500:  # 5.0s
                    confidence = 'medium'
                    confidence_score = 2
                else:
                    confidence = 'low'
                    confidence_score = 1
                
                row['confidence'] = {
                    'level': confidence,
                    'score': confidence_score,
                    'time_spread': time_spread,  # in centiseconds
                    'max_time': max_time,
                    'min_time': min_time,
                    'avg_time': avg_time,
                }
            elif len(raw_times_list) == 1:
                row['confidence'] = {
                    'level': 'single',
                    'score': 0,
                    'time_spread': 0,
                    'avg_time': raw_times_list[0],
                }
            else:
                row['confidence'] = {
                    'level': 'none',
                    'score': 0,
                }
            
            comparison_data.append(row)
        
        # Sort by confidence (low first), then by bib number
        comparison_data.sort(key=lambda x: (
            x['confidence']['score'],
            x['crew']['bib_number'] if x['crew']['bib_number'] else 999999,
        ))
        
        # Calculate summary statistics
        total_crews = len(comparison_data)
        high_confidence = sum(1 for row in comparison_data if row['confidence']['level'] == 'high')
        medium_confidence = sum(1 for row in comparison_data if row['confidence']['level'] == 'medium')
        low_confidence = sum(1 for row in comparison_data if row['confidence']['level'] == 'low')
        single_time = sum(1 for row in comparison_data if row['confidence']['level'] == 'single')
        no_data = sum(1 for row in comparison_data if row['confidence']['level'] == 'none')
        
        # Calculate race coverage
        race_coverage = {}
        for race_id in race_info.keys():
            complete_count = sum(1 for row in comparison_data 
                               if race_id in row['raw_times'] and row['raw_times'][race_id] is not None)
            incomplete_count = sum(1 for row in comparison_data 
                                 if race_id in row['incomplete_races'])
            missing_count = sum(1 for row in comparison_data 
                              if race_id in row['missing_races'])
            
            race_coverage[race_id] = {
                'complete_count': complete_count,
                'incomplete_count': incomplete_count,
                'missing_count': missing_count,
                'coverage_percentage': round((complete_count / total_crews) * 100, 1) if total_crews > 0 else 0
            }
        
        return JsonResponse({
            'races': race_info,
            'race_coverage': race_coverage,
            'comparison_data': comparison_data,
            'total_crews': total_crews,
            'confidence_summary': {
                'high': high_confidence,
                'medium': medium_confidence,
                'low': low_confidence,
                'single': single_time,
                'none': no_data,
                'high_percentage': round((high_confidence / total_crews) * 100, 1) if total_crews > 0 else 0,
            },
            'summary': {
                'total_races': len(race_info),
                'crews_with_data': total_crews,
            }
        })