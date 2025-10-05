from django.http import JsonResponse
from django.views import View
from django.db.models import Q
from collections import defaultdict
import json
from ..models import Race, RaceTime
from django.core.paginator import Paginator

class RawTimeComparisonView(View):

    def get(self, request):
        """
        Compare raw times (finish - start) across different Race timing systems.
        Groups by crew and calculates confidence based on time differences.
        Includes position rankings for each race timing system.
        Supports pagination, filtering, and sorting.
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
        ).select_related('crew', 'race', 'crew__club').order_by('crew__bib_number', 'race__id', 'tap')
        
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
            crew_obj = None
            for race_id, times in race_data.items():
                if times['start'] and times['start'].crew:
                    crew_obj = times['start'].crew
                    crew_info = {
                        'id': crew_obj.id,
                        'bib_number': crew_obj.bib_number,
                        'name': crew_obj.name,
                        'competitor_names': crew_obj.competitor_names,
                        'club': crew_obj.club.name if crew_obj.club else None,
                        'event_band': crew_obj.event_band if hasattr(crew_obj, 'event_band') else None,
                        'status': crew_obj.status,
                        'time_only': crew_obj.time_only,
                        'penalty': crew_obj.penalty if hasattr(crew_obj, 'penalty') else 0,
                        'masters_adjusted_time': crew_obj.masters_adjusted_time if hasattr(crew_obj, 'masters_adjusted_time') else None,
                    }
                    break
                elif times['finish'] and times['finish'].crew:
                    crew_obj = times['finish'].crew
                    crew_info = {
                        'id': crew_obj.id,
                        'bib_number': crew_obj.bib_number,
                        'name': crew_obj.name,
                        'competitor_names': crew_obj.competitor_names,
                        'club': crew_obj.club.name if crew_obj.club else None,
                        'event_band': crew_obj.event_band if hasattr(crew_obj, 'event_band') else None,
                        'status': crew_obj.status,
                        'time_only': crew_obj.time_only,
                        'penalty': crew_obj.penalty if hasattr(crew_obj, 'penalty') else 0,
                        'masters_adjusted_time': crew_obj.masters_adjusted_time if hasattr(crew_obj, 'masters_adjusted_time') else None,
                    }
                    break
            
            if not crew_info:
                continue
            
            row = {
                'crew': crew_info,
                'raw_times': {},  # race_id -> raw_time (in centiseconds)
                'race_time_details': {},  # race_id -> {start, finish, raw_time, position_time}
                'missing_races': [],
                'incomplete_races': [],  # races with only start or finish
                'positions_match': None,  # Will be set after calculating positions
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
                        
                        # Calculate position time (like calc_category_position_time)
                        position_time = self._calc_position_time(
                            raw_time,
                            crew_info['masters_adjusted_time'],
                            crew_info['penalty']
                        )
                        
                        row['raw_times'][race_id] = raw_time
                        row['race_time_details'][race_id] = {
                            'start_id': start_time.id,
                            'finish_id': finish_time.id,
                            'start_time': start_time.time_tap,
                            'finish_time': finish_time.time_tap,
                            'raw_time': raw_time,
                            'position_time': position_time,
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
                            'position_time': None,
                            'incomplete': True,
                        }
                else:
                    row['missing_races'].append(race_id)
            
            # Calculate confidence metrics
            if len(raw_times_list) >= 2:
                max_time = max(raw_times_list)
                min_time = min(raw_times_list)
                time_spread = (max_time - min_time) / 10  # in centiseconds
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
        
        # Calculate positions for each race
        self._calculate_positions(comparison_data, race_info)
        
        # Check if positions match across races for each crew
        self._check_position_matches(comparison_data, race_info)
        
        # Apply filtering
        filtered_data = self._apply_filters(comparison_data, request)
        
        # Apply sorting
        sorted_data = self._apply_sorting(filtered_data, request)
        
        # Calculate summary statistics (on filtered data)
        total_crews = len(sorted_data)
        high_confidence = sum(1 for row in sorted_data if row['confidence']['level'] == 'high')
        medium_confidence = sum(1 for row in sorted_data if row['confidence']['level'] == 'medium')
        low_confidence = sum(1 for row in sorted_data if row['confidence']['level'] == 'low')
        single_time = sum(1 for row in sorted_data if row['confidence']['level'] == 'single')
        no_data = sum(1 for row in sorted_data if row['confidence']['level'] == 'none')
        
        # Calculate position match statistics
        positions_match_count = sum(1 for row in sorted_data if row.get('positions_match') is True)
        positions_mismatch_count = sum(1 for row in sorted_data if row.get('positions_match') is False)
        positions_na_count = sum(1 for row in sorted_data if row.get('positions_match') is None)
        
        # Calculate race coverage (on filtered data)
        race_coverage = {}
        for race_id in race_info.keys():
            complete_count = sum(1 for row in sorted_data 
                               if race_id in row['raw_times'] and row['raw_times'][race_id] is not None)
            incomplete_count = sum(1 for row in sorted_data 
                                 if race_id in row['incomplete_races'])
            missing_count = sum(1 for row in sorted_data 
                              if race_id in row['missing_races'])
            
            race_coverage[race_id] = {
                'complete_count': complete_count,
                'incomplete_count': incomplete_count,
                'missing_count': missing_count,
                'coverage_percentage': round((complete_count / total_crews) * 100, 1) if total_crews > 0 else 0
            }
        
        # Apply pagination
        page_size = int(request.GET.get('page_size', 25))
        page = int(request.GET.get('page', 1))
        
        paginator = Paginator(sorted_data, page_size)
        page_obj = paginator.get_page(page)
        
        return JsonResponse({
            'races': race_info,
            'race_coverage': race_coverage,
            'comparison_data': list(page_obj),
            'total_crews': len(comparison_data),  # Total before filtering
            'filtered_crews': total_crews,  # Total after filtering
            'confidence_summary': {
                'high': high_confidence,
                'medium': medium_confidence,
                'low': low_confidence,
                'single': single_time,
                'none': no_data,
                'high_percentage': round((high_confidence / total_crews) * 100, 1) if total_crews > 0 else 0,
            },
            'position_match_summary': {
                'match': positions_match_count,
                'mismatch': positions_mismatch_count,
                'na': positions_na_count,
                'match_percentage': round((positions_match_count / total_crews) * 100, 1) if total_crews > 0 else 0,
            },
            'summary': {
                'total_races': len(race_info),
                'crews_with_data': total_crews,
            },
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })
    
    def _calc_position_time(self, raw_time, masters_adjusted_time, penalty):
        """
        Calculate the time to use for position ranking.
        Similar to Crew.calc_category_position_time()
        """
        if masters_adjusted_time is not None and masters_adjusted_time > 0:
            return masters_adjusted_time + penalty * 1000
        return raw_time
    
    def _calculate_positions(self, comparison_data, race_info):
        """
        Calculate positions for each race timing system.
        Similar to Crew.calc_category_rank()
        """
        # For each race, calculate positions within each event_band
        for race_id in race_info.keys():
            # Group crews by event_band for this race
            event_band_crews = defaultdict(list)
            
            for row in comparison_data:
                # Skip if crew doesn't have data for this race
                if race_id not in row['race_time_details']:
                    continue
                
                details = row['race_time_details'][race_id]
                
                # Skip incomplete races or time_only crews
                if details.get('incomplete') or row['crew']['time_only']:
                    continue
                
                # Skip if no valid time
                if details.get('raw_time') is None or details.get('raw_time') <= 0:
                    continue
                
                # Skip if crew status is not "Accepted"
                if row['crew']['status'] != 'Accepted':
                    continue
                
                event_band = row['crew']['event_band']
                event_band_crews[event_band].append({
                    'crew_id': row['crew']['id'],
                    'position_time': details['position_time'],
                })
            
            # Sort and assign positions within each event_band
            for event_band, crews in event_band_crews.items():
                # Sort by position_time
                crews.sort(key=lambda x: x['position_time'])
                
                # Assign positions
                for position, crew_data in enumerate(crews, start=1):
                    # Find the crew in comparison_data and add position
                    for row in comparison_data:
                        if row['crew']['id'] == crew_data['crew_id']:
                            if 'positions' not in row['race_time_details'][race_id]:
                                row['race_time_details'][race_id]['positions'] = {}
                            row['race_time_details'][race_id]['positions']['category'] = position
                            break
            
            # Also calculate overall positions (across all event_bands)
            all_crews = []
            for row in comparison_data:
                if race_id not in row['race_time_details']:
                    continue
                
                details = row['race_time_details'][race_id]
                
                if details.get('incomplete') or row['crew']['time_only']:
                    continue
                
                if details.get('raw_time') is None or details.get('raw_time') <= 0:
                    continue
                
                if row['crew']['status'] != 'Accepted':
                    continue
                
                all_crews.append({
                    'crew_id': row['crew']['id'],
                    'raw_time': details['raw_time'],
                })
            
            # Sort by raw_time for overall position
            all_crews.sort(key=lambda x: x['raw_time'])
            
            # Assign overall positions
            for position, crew_data in enumerate(all_crews, start=1):
                for row in comparison_data:
                    if row['crew']['id'] == crew_data['crew_id']:
                        if 'positions' not in row['race_time_details'][race_id]:
                            row['race_time_details'][race_id]['positions'] = {}
                        row['race_time_details'][race_id]['positions']['overall'] = position
                        break
    
    def _apply_filters(self, data, request):
        """Apply filters to the comparison data."""
        filtered_data = data
        
        # Search filter (searches crew name, competitor names, bib number, club)
        search = request.GET.get('search', '').lower()
        if search:
            filtered_data = [
                row for row in filtered_data
                if search in str(row['crew'].get('name', '')).lower()
                or search in str(row['crew'].get('competitor_names', '')).lower()
                or search in str(row['crew'].get('bib_number', '')).lower()
                or search in str(row['crew'].get('club', '')).lower()
            ]
        
        # Confidence level filter
        confidence_level = request.GET.get('confidence_level')
        if confidence_level:
            filtered_data = [
                row for row in filtered_data
                if row['confidence']['level'] == confidence_level
            ]
        
        # Event band filter
        event_band = request.GET.get('event_band')
        if event_band:
            filtered_data = [
                row for row in filtered_data
                if row['crew'].get('event_band') == event_band
            ]
        
        # Status filter
        status = request.GET.get('status')
        if status:
            filtered_data = [
                row for row in filtered_data
                if row['crew'].get('status') == status
            ]
        
        return filtered_data
    
    def _apply_sorting(self, data, request):
        """Apply sorting to the comparison data."""
        ordering = request.GET.get('ordering', 'confidence_score')
        
        # Define sorting key functions
        sort_keys = {
            'confidence_score': lambda x: (
                x['confidence']['score'],
                x['crew']['bib_number'] if x['crew']['bib_number'] else 999999
            ),
            '-confidence_score': lambda x: (
                -x['confidence']['score'],
                x['crew']['bib_number'] if x['crew']['bib_number'] else 999999
            ),
            'bib_number': lambda x: x['crew']['bib_number'] if x['crew']['bib_number'] else 999999,
            '-bib_number': lambda x: -(x['crew']['bib_number'] if x['crew']['bib_number'] else 0),
            'name': lambda x: x['crew']['name'].lower(),
            '-name': lambda x: x['crew']['name'].lower(),
            'club': lambda x: (x['crew']['club'] or '').lower(),
            '-club': lambda x: (x['crew']['club'] or '').lower(),
            'event_band': lambda x: x['crew']['event_band'] or '',
            '-event_band': lambda x: x['crew']['event_band'] or '',
            'time_spread': lambda x: x['confidence'].get('time_spread', 0),
            '-time_spread': lambda x: -x['confidence'].get('time_spread', 0),
        }
        
        if ordering in sort_keys:
            sorted_data = sorted(data, key=sort_keys[ordering])
        else:
            # Default sort
            sorted_data = sorted(data, key=sort_keys['confidence_score'])
        
        # Handle reverse for keys that need it
        if ordering.startswith('-') and ordering in ['-name', '-club', '-event_band']:
            sorted_data = list(reversed(sorted_data))
        
        return sorted_data
    
    def _check_position_matches(self, comparison_data, race_info):
        """
        Check if category positions match across all races for each crew.
        Sets positions_match flag: True if all match, False if mismatch, None if not enough data.
        """
        for row in comparison_data:
            # Collect all category positions for this crew across races
            category_positions = []
            
            for race_id in race_info.keys():
                if race_id in row['race_time_details']:
                    details = row['race_time_details'][race_id]
                    
                    # Skip incomplete races
                    if details.get('incomplete'):
                        continue
                    
                    # Get the category position if it exists
                    position = details.get('positions', {}).get('category')
                    if position is not None:
                        category_positions.append(position)
            
            # Determine if positions match
            if len(category_positions) == 0:
                # No valid positions to compare
                row['positions_match'] = None
            elif len(category_positions) == 1:
                # Only one race with position, can't compare
                row['positions_match'] = None
            else:
                # Check if all positions are the same
                row['positions_match'] = len(set(category_positions)) == 1