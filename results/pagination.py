from rest_framework.pagination import PageNumberPagination


class CrewPaginationWithAggregates(PageNumberPagination):
    def paginate_queryset(self, queryset, request, view=None):
        self.num_scratched_crews = len(queryset.filter(status__exact='Scratched'))
        self.num_accepted_crews = len(queryset.filter(status__exact='Accepted'))
        self.num_accepted_crews_no_times = len(queryset.filter(status__exact='Accepted', times__isnull=True))
        self.num_accepted_crews_no_start_time = len(queryset.filter(status__exact='Accepted', start_time__exact=0))
        self.num_accepted_crews_no_finish_time = len(queryset.filter(status__exact='Accepted', finish_time__exact=0))
        self.num_accepted_crews_invalid_time = len(queryset.filter(status__exact='Accepted', invalid_time__exact=1))
        self.requires_ranking_update = len(queryset.filter(requires_recalculation__exact=True))
        return super(CrewPaginationWithAggregates, self).paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        paginated_response = super(CrewPaginationWithAggregates, self).get_paginated_response(data)
        paginated_response.data['num_scratched_crews'] = self.num_scratched_crews
        paginated_response.data['num_accepted_crews'] = self.num_accepted_crews
        paginated_response.data['num_accepted_crews_no_times'] = self.num_accepted_crews_no_times
        paginated_response.data['num_accepted_crews_no_start_time'] = self.num_accepted_crews_no_start_time
        paginated_response.data['num_accepted_crews_no_finish_time'] = self.num_accepted_crews_no_finish_time
        paginated_response.data['num_accepted_crews_invalid_time'] = self.num_accepted_crews_invalid_time
        paginated_response.data['requires_ranking_update'] = self.requires_ranking_update
        return paginated_response

# class ResultsPaginationWithAggregates(PageNumberPagination):
#     def paginate_queryset(self, queryset, request, view=None):
#         # self.num_accepted_crews = len(queryset.filter(status__exact='Accepted'))
#         self.requires_ranking_update = len(queryset.filter(requires_recalculation__exact=True))
#         return super(ResultsPaginationWithAggregates, self).paginate_queryset(queryset, request, view)

#     def get_paginated_response(self, data):
#         paginated_response = super(ResultsPaginationWithAggregates, self).get_paginated_response(data)
#         # paginated_response.data['num_accepted_crews'] = self.num_accepted_crews
#         paginated_response.data['requires_ranking_update'] = self.requires_ranking_update
#         return paginated_response


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