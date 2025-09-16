from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from collections import defaultdict
from ..models import Crew

class StartOrderDuplicateCheckView(APIView):
    """
    API endpoint to check for duplicate calculated_start_order values
    across all accepted crews.
    """
    
    def get(self, request):
        try:
            # Get all accepted crews since these should all have a start order
            crews = Crew.objects.filter(status__exact='Accepted').select_related('club')
            
            # Group crews by start order
            start_order_groups = defaultdict(list)
            
            for crew in crews:
                start_order_groups[crew.calculated_start_order].append({
                    'id': crew.id,
                    'name': crew.competitor_names or crew.name,
                    'club': crew.club.index_code if crew.club else '--',
                    'event_band': crew.event_band,
                    'calculated_start_order': crew.calculated_start_order
                })
            
            # Find duplicates
            duplicates = {}
            total_crews_with_duplicates = 0
            
            for start_order, crew_list in start_order_groups.items():
                if len(crew_list) > 1:
                    duplicates[start_order] = crew_list
                    total_crews_with_duplicates += len(crew_list)
            
            # Get summary statistics
            total_accepted_crews = crews.count()
            unique_start_orders = len(start_order_groups)
            duplicate_start_orders = len(duplicates)
            
            return Response({
                'success': True,
                'has_duplicates': len(duplicates) > 0,
                'duplicates': duplicates,
                'summary': {
                    'total_accepted_crews': total_accepted_crews,
                    'unique_start_orders': unique_start_orders,
                    'duplicate_start_orders': duplicate_start_orders,
                    'crews_with_duplicates': total_crews_with_duplicates
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error checking for duplicates: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
