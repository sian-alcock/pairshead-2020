# from rest_framework.pagination import PageNumberPagination
# from django.db.models import Min


# class CrewPaginationWithAggregates(PageNumberPagination):
#     def paginate_queryset(self, queryset, request, view=None):
#         self.num_scratched_crews = len(queryset.filter(status__exact='Scratched'))
#         self.num_accepted_crews = len(queryset.filter(status__exact='Accepted'))
#         self.num_scratched_crews_with_time = len(queryset.filter(status__exact='Scratched', times__isnull=False))
#         self.num_accepted_crews_no_times = len(queryset.filter(status__exact='Accepted', times__isnull=True))
#         self.num_accepted_crews_no_start_time = len(queryset.filter(status__exact='Accepted', start_time__exact=0))
#         self.num_accepted_crews_no_finish_time = len(queryset.filter(status__exact='Accepted', finish_time__exact=0))
#         self.num_crews_masters_adjusted = len(queryset.filter(status__exact='Accepted', masters_adjustment__gt=0))
#         self.num_crews_require_masters_adjusted = len(queryset.filter(status__exact='Accepted', event_band__contains='/', raw_time__gt=0))
#         self.requires_ranking_update = len(queryset.filter(status__exact='Accepted', requires_recalculation__exact=True))
#         self.fastest_open_2x_time = (queryset.filter(event_band__startswith='Op', event_band__contains='2x', raw_time__gt=0)).aggregate(Min('raw_time'))
#         self.fastest_female_2x_time = (queryset.filter(event_band__startswith='W', event_band__contains='2x', raw_time__gt=0)).aggregate(Min('raw_time'))
#         self.fastest_open_sweep_time = (queryset.filter(event_band__startswith='Op', event_band__contains='2-', raw_time__gt=0)).aggregate(Min('raw_time'))
#         self.fastest_female_sweep_time = (queryset.filter(event_band__startswith='W', event_band__contains='2-', raw_time__gt=0)).aggregate(Min('raw_time'))
#         self.fastest_mixed_2x_time = (queryset.filter(event_band__startswith='Mx', event_band__contains='2x', raw_time__gt=0)).aggregate(Min('raw_time'))
#         return super(CrewPaginationWithAggregates, self).paginate_queryset(queryset, request, view)

#     def get_paginated_response(self, data):
#         paginated_response = super(CrewPaginationWithAggregates, self).get_paginated_response(data)
#         paginated_response.data['num_scratched_crews'] = self.num_scratched_crews
#         paginated_response.data['num_accepted_crews'] = self.num_accepted_crews
#         paginated_response.data['num_scratched_crews_with_time'] = self.num_scratched_crews_with_time
#         paginated_response.data['num_accepted_crews_no_times'] = self.num_accepted_crews_no_times
#         paginated_response.data['num_accepted_crews_no_start_time'] = self.num_accepted_crews_no_start_time
#         paginated_response.data['num_accepted_crews_no_finish_time'] = self.num_accepted_crews_no_finish_time
#         paginated_response.data['num_crews_masters_adjusted'] = self.num_crews_masters_adjusted
#         paginated_response.data['num_crews_require_masters_adjusted'] = self.num_crews_require_masters_adjusted
#         paginated_response.data['requires_ranking_update'] = self.requires_ranking_update
#         paginated_response.data['fastest_open_2x_time'] = self.fastest_open_2x_time
#         paginated_response.data['fastest_female_2x_time'] = self.fastest_female_2x_time
#         paginated_response.data['fastest_open_sweep_time'] = self.fastest_open_sweep_time
#         paginated_response.data['fastest_female_sweep_time'] = self.fastest_female_sweep_time
#         paginated_response.data['fastest_mixed_2x_time'] = self.fastest_mixed_2x_time
#         return paginated_response


# class RaceTimePaginationWithAggregates(PageNumberPagination):
#     def paginate_queryset(self, queryset, request, view=None):
#         self.start_times_no_crew = len(queryset.filter(tap__exact='Start', crew__isnull=True))
#         self.finish_times_no_crew = len(queryset.filter(tap__exact='Finish', crew__isnull=True))
#         return super(RaceTimePaginationWithAggregates, self).paginate_queryset(queryset, request, view)

#     def get_paginated_response(self, data):
#         paginated_response = super(RaceTimePaginationWithAggregates, self).get_paginated_response(data)
#         paginated_response.data['start_times_no_crew'] = self.start_times_no_crew
#         paginated_response.data['finish_times_no_crew'] = self.finish_times_no_crew
#         return paginated_response