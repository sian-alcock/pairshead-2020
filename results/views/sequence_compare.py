from django.http import JsonResponse
from django.views import View
from django.db.models import Q
from collections import defaultdict
import json
from ..models import Race, RaceTime

class SequenceComparisonView(View):

    def get(self, request):
        """
        Compare sequences across different Race timing systems for the same tap type.
        Groups by crew and shows what sequence each crew got in each race.
        """
        tap = request.GET.get('tap', 'Start')  # 'Start' or 'Finish'
        
        # Get all races that have timing data for the specified tap
        races_with_times = Race.objects.filter(
            race_times__tap=tap
        ).distinct().order_by('name')
        
        if not races_with_times.exists():
            return JsonResponse({
                'error': f'No races found with {tap} timing data'
            }, status=404)
        
        # Get all race times for the specified tap across all races
        race_times = RaceTime.objects.filter(
            race__in=races_with_times,
            tap=tap
        ).select_related('crew', 'race').order_by('crew__bib_number', 'race__id')
        
        if not race_times.exists():
            return JsonResponse({
                'error': f'No timing data found for {tap}',
                'races_checked': [{'name': r.name, 'race_id': r.race_id} for r in races_with_times]
            }, status=404)
        
        # Build race info
        race_info = {}
        for race in races_with_times:
            race_info[race.id] = {
                'name': race.name,
                'race_id': race.race_id,
                'is_reference': race.is_timing_reference
            }
        
        # Group race times by crew (including None for unassigned times)
        crew_sequences = defaultdict(lambda: defaultdict(list))  # {crew_id: {race_id: [race_time_objects]}}
        unassigned_times = defaultdict(list)  # {race_id: [race_time_objects]}
        
        for race_time in race_times:
            if race_time.crew:
                crew_sequences[race_time.crew.id][race_time.race.id].append(race_time)
            else:
                unassigned_times[race_time.race.id].append(race_time)
        
        # Build comparison data for crews
        comparison_data = []
        
        # Process crews with assignments
        for crew_id, race_data in crew_sequences.items():
            # Get crew info from the first race time we find
            crew_info = None
            for race_times_list in race_data.values():
                if race_times_list:
                    first_time = race_times_list[0]
                    crew_info = {
                        'id': first_time.crew.id,
                        'bib_number': first_time.crew.bib_number,
                        'name': first_time.crew.name,
                        'competitor_names': first_time.crew.competitor_names,
                        'club': first_time.crew.club.name if first_time.crew.club else None,
                    }
                    break
            
            if not crew_info:
                continue
            
            row = {
                'crew': crew_info,
                'sequences': {},  # race_id -> sequence_number or list of sequences
                'race_times': {},  # race_id -> race_time_data
                'sequences_agree': True,
                'missing_races': [],  # race_ids where this crew has no data
                'multiple_sequences': {},  # race_id -> True if crew has multiple sequences in that race
            }
            
            # Collect sequences for this crew across all races
            crew_sequences_list = []
            
            for race_id in race_info.keys():
                if race_id in race_data and race_data[race_id]:
                    race_times_for_race = race_data[race_id]
                    
                    if len(race_times_for_race) == 1:
                        # Single sequence for this crew in this race
                        race_time = race_times_for_race[0]
                        row['sequences'][race_id] = race_time.sequence
                        row['race_times'][race_id] = {
                            'id': race_time.id,
                            'sequence': race_time.sequence,
                            'time_tap': race_time.time_tap,
                            'bib_number': race_time.bib_number,
                        }
                        crew_sequences_list.append(race_time.sequence)
                    else:
                        # Multiple sequences for this crew in this race (shouldn't normally happen)
                        sequences = [rt.sequence for rt in race_times_for_race]
                        row['sequences'][race_id] = sequences
                        row['multiple_sequences'][race_id] = True
                        row['race_times'][race_id] = {
                            'sequences': sequences,
                            'time_taps': [rt.time_tap for rt in race_times_for_race],
                            'bib_number': race_times_for_race[0].bib_number,
                        }
                        crew_sequences_list.extend(sequences)
                else:
                    # No data for this crew in this race
                    row['sequences'][race_id] = None
                    row['race_times'][race_id] = None
                    row['missing_races'].append(race_id)
            
            # Check if sequences agree across races (ignoring None values)
            unique_sequences = set(seq for seq in crew_sequences_list if seq is not None)
            row['sequences_agree'] = len(unique_sequences) <= 1
            
            comparison_data.append(row)
        
        # Process unassigned times (times without crew assignments)
        unassigned_data = []
        for race_id, race_times_list in unassigned_times.items():
            for race_time in race_times_list:
                unassigned_row = {
                    'crew': None,
                    'sequences': {race_id: race_time.sequence},
                    'race_times': {
                        race_id: {
                            'id': race_time.id,
                            'sequence': race_time.sequence,
                            'time_tap': race_time.time_tap,
                            'bib_number': race_time.bib_number,
                        }
                    },
                    'sequences_agree': None,  # Not applicable for unassigned
                    'missing_races': [rid for rid in race_info.keys() if rid != race_id],
                    'multiple_sequences': {},
                    'race_id': race_id,  # For sorting/grouping unassigned times
                }
                unassigned_data.append(unassigned_row)
        
        # Sort comparison data by bib number, then by crew name
        comparison_data.sort(key=lambda x: (
            x['crew']['bib_number'] if x['crew']['bib_number'] else 999999,
            x['crew']['name'] if x['crew'] else ''
        ))
        
        # Sort unassigned data by race, then by sequence
        unassigned_data.sort(key=lambda x: (
            x['race_id'],
            x['sequences'][x['race_id']] if x['race_id'] in x['sequences'] else 999999
        ))
        
        # Calculate summary statistics
        total_crews = len(comparison_data)
        agreements = sum(1 for row in comparison_data if row['sequences_agree'])
        disagreements = total_crews - agreements
        
        # Calculate race coverage (how many crews each race has data for)
        race_coverage = {}
        for race_id, race_data in race_info.items():
            crews_in_race = sum(1 for row in comparison_data if race_id in row['sequences'] and row['sequences'][race_id] is not None)
            unassigned_in_race = len(unassigned_times.get(race_id, []))
            
            race_coverage[race_id] = {
                'crews_count': crews_in_race,
                'unassigned_count': unassigned_in_race,
                'total_sequences': crews_in_race + unassigned_in_race,
                'coverage_percentage': round((crews_in_race / total_crews) * 100, 1) if total_crews > 0 else 0
            }
        
        return JsonResponse({
            'tap': tap,
            'races': race_info,
            'race_coverage': race_coverage,
            'comparison_data': comparison_data,
            'unassigned_data': unassigned_data,
            'total_crews': total_crews,
            'total_unassigned': len(unassigned_data),
            'agreements': agreements,
            'disagreements': disagreements,
            'agreement_percentage': round((agreements / total_crews) * 100, 1) if total_crews > 0 else 0,
            'summary': {
                'total_races': len(race_info),
                'crews_with_data': total_crews,
                'unassigned_times': len(unassigned_data),
            }
        })