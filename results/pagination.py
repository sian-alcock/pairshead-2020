from rest_framework.pagination import PageNumberPagination
from django.db.models import Min, Count, Q
from django.core.cache import cache


class CrewPaginationWithAggregates(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def paginate_queryset(self, queryset, request, view=None):
        # Store the original queryset for aggregations (before pagination)
        self.original_queryset = queryset
        return super().paginate_queryset(queryset, request, view)

    def get_aggregates(self, queryset):
        """Calculate aggregates efficiently using a single query where possible"""
        # Use cache key based on queryset hash to avoid recalculating
        cache_key = f"crew_aggregates_{hash(str(queryset.query))}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return cached_result

        # Single query for status counts
        status_counts = queryset.aggregate(
            num_scratched_crews=Count('id', filter=Q(status='Scratched')),
            num_accepted_crews=Count('id', filter=Q(status='Accepted')),
            num_scratched_crews_with_time=Count('id', filter=Q(status='Scratched', times__isnull=False)),
            num_accepted_crews_no_times=Count('id', filter=Q(status='Accepted', times__isnull=True)),
            num_accepted_crews_no_start_time=Count('id', filter=Q(status='Accepted', start_time=0)),
            num_accepted_crews_no_finish_time=Count('id', filter=Q(status='Accepted', finish_time=0)),
            num_crews_masters_adjusted=Count('id', filter=Q(status='Accepted', masters_adjustment__gt=0)),
            num_crews_require_masters_adjusted=Count('id', filter=Q(status='Accepted', event_band__contains='/', raw_time__gt=0)),
            requires_ranking_update=Count('id', filter=Q(status='Accepted', requires_recalculation=True)),
        )

        # Single query for fastest times
        fastest_times = queryset.aggregate(
            fastest_open_2x_time=Min('raw_time', filter=Q(event_band__startswith='Op', event_band__contains='2x', raw_time__gt=0)),
            fastest_female_2x_time=Min('raw_time', filter=Q(event_band__startswith='W', event_band__contains='2x', raw_time__gt=0)),
            fastest_open_sweep_time=Min('raw_time', filter=Q(event_band__startswith='Op', event_band__contains='2-', raw_time__gt=0)),
            fastest_female_sweep_time=Min('raw_time', filter=Q(event_band__startswith='W', event_band__contains='2-', raw_time__gt=0)),
            fastest_mixed_2x_time=Min('raw_time', filter=Q(event_band__startswith='Mx', event_band__contains='2x', raw_time__gt=0)),
        )

        # Combine results
        result = {**status_counts, **fastest_times}
        
        # Cache for 30 seconds
        cache.set(cache_key, result, 30)
        return result

    def get_paginated_response(self, data):
        paginated_response = super().get_paginated_response(data)
        
        # Only calculate aggregates if needed (you might want to make this optional)
        # For sorting to work properly, we might want to skip aggregates during sorting requests
        request = self.request if hasattr(self, 'request') else None
        
        # Skip expensive aggregations during sorting/filtering operations to improve performance
        if request and (request.GET.get('ordering') or request.GET.get('search')):
            # Just add basic counts for UI feedback
            paginated_response.data.update({
                'num_scratched_crews': 0,  # Placeholder
                'num_accepted_crews': 0,   # Placeholder
                'aggregates_skipped': True  # Flag to indicate aggregates were skipped
            })
        else:
            # Calculate full aggregates
            aggregates = self.get_aggregates(self.original_queryset)
            paginated_response.data.update(aggregates)
            paginated_response.data['aggregates_skipped'] = False
        
        return paginated_response


class RaceTimePaginationWithAggregates(PageNumberPagination):
    def paginate_queryset(self, queryset, request, view=None):
        self.start_times_no_crew = len(queryset.filter(tap__exact='Start', crew__isnull=True))
        self.finish_times_no_crew = len(queryset.filter(tap__exact='Finish', crew__isnull=True))
        return super(RaceTimePaginationWithAggregates, self).paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        paginated_response = super(RaceTimePaginationWithAggregates, self).get_paginated_response(data)
        paginated_response.data['start_times_no_crew'] = self.start_times_no_crew
        paginated_response.data['finish_times_no_crew'] = self.finish_times_no_crew
        return paginated_response