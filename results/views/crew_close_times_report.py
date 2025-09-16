# views.py
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Crew

class CloseTimesReportView(APIView):
    """
    Report showing 1st and 2nd place crews by category and overall winners with time comparisons
    """
    
    def get(self, request):
        try:
            # Get overall winner and runner-up
            overall_crews = Crew.objects.filter(
                overall_rank__in=[1, 2],
                published_time__gt=0,
                status='Accepted'
            ).order_by('overall_rank').values(
                'competitor_names',
                'bib_number',
                'club__name',
                'overall_rank',
                'published_time',
                'event_band'
            )
            
            overall_data = None
            overall_crews_list = list(overall_crews)
            
            if len(overall_crews_list) >= 2:
                overall_first = next((crew for crew in overall_crews_list if crew['overall_rank'] == 1), None)
                overall_second = next((crew for crew in overall_crews_list if crew['overall_rank'] == 2), None)
                
                if overall_first and overall_second:
                    time_diff = (overall_second['published_time'] - overall_first['published_time']) / 1000
                    
                    closeness = 'normal'
                    if time_diff <= 1.0:
                        closeness = 'very_close'
                    elif time_diff <= 2.0:
                        closeness = 'close'
                    
                    overall_data = {
                        'first_place': {
                            'competitor_names': overall_first['competitor_names'],
                            'bib_number': overall_first['bib_number'],
                            'club_name': overall_first['club__name'],
                            'published_time': overall_first['published_time'],
                            'event_band': overall_first['event_band']
                        },
                        'second_place': {
                            'competitor_names': overall_second['competitor_names'],
                            'bib_number': overall_second['bib_number'],
                            'club_name': overall_second['club__name'],
                            'published_time': overall_second['published_time'],
                            'event_band': overall_second['event_band']
                        },
                        'time_difference': time_diff,
                        'closeness': closeness
                    }
            
            # Get all event_bands that have crews with the required criteria
            event_bands = Crew.objects.filter(
                category_rank__in=[1, 2],
                published_time__gt=0,  # Non-zero published times
                status='Accepted'
            ).values_list('event_band', flat=True).distinct().order_by('event_band')
            
            category_data = []
            
            for event_band in event_bands:
                if not event_band:  # Skip null event_bands
                    continue
                    
                # Get 1st and 2nd place crews for this event_band
                top_crews = Crew.objects.filter(
                    event_band=event_band,
                    category_rank__in=[1, 2],
                    published_time__gt=0,  # Non-zero published times
                    status='Accepted'  # Only accepted crews
                ).order_by('category_rank').values(
                    'competitor_names',
                    'bib_number', 
                    'club__name',
                    'category_rank',
                    'published_time'
                )
                
                # Convert to list to work with
                crews_list = list(top_crews)
                
                if len(crews_list) >= 2:
                    first_place = next((crew for crew in crews_list if crew['category_rank'] == 1), None)
                    second_place = next((crew for crew in crews_list if crew['category_rank'] == 2), None)
                    
                    if first_place and second_place:
                        # Calculate time difference in seconds (published_time is in milliseconds)
                        time_diff = (second_place['published_time'] - first_place['published_time']) / 1000
                        
                        # Determine closeness category
                        closeness = 'normal'
                        if time_diff <= 1.0:
                            closeness = 'very_close'  # Within 1 second
                        elif time_diff <= 2.0:
                            closeness = 'close'  # Within 2 seconds
                        
                        category_data.append({
                            'event_band': event_band,
                            'first_place': {
                                'competitor_names': first_place['competitor_names'],
                                'bib_number': first_place['bib_number'],
                                'club_name': first_place['club__name'],
                                'published_time': first_place['published_time']
                            },
                            'second_place': {
                                'competitor_names': second_place['competitor_names'],
                                'bib_number': second_place['bib_number'],
                                'club_name': second_place['club__name'],
                                'published_time': second_place['published_time']
                            },
                            'time_difference': time_diff,
                            'closeness': closeness
                        })
            
            # Sort by closeness (very_close first, then close, then normal)
            closeness_order = {'very_close': 0, 'close': 1, 'normal': 2}
            category_data.sort(key=lambda x: (closeness_order[x['closeness']], x['time_difference']))
            
            return Response({
                'overall': overall_data,
                'categories': category_data,
                'total_categories': len(category_data),
                'very_close_count': len([r for r in category_data if r['closeness'] == 'very_close']),
                'close_count': len([r for r in category_data if r['closeness'] == 'close']),
                'overall_is_close': overall_data['closeness'] in ['very_close', 'close'] if overall_data else False,
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )