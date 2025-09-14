from django.urls import path
from .views import clubs
from .views import events
from .views import bands
from .views import crews
from .views import competitors
from .views import times
from .views import masters_adjustments
from .views import original_event_category
from .views import event_order
from .views import marshalling_division
from .views import number_location
from .views import event_meeting_key
from .views import global_settings
from .views import race
from .views import race_timing_sync
from .views import time_compare
from .views import sequence_compare
from .views import missing_times
from .views import masters_crews
from .views import crew_dashboard_stats
from .views import crew_start_order_duplicates_check


urlpatterns = [
    path("clubs/", clubs.ClubListView.as_view()),
    path("club-data-import/", clubs.ClubDataImport.as_view()),
    path("events/", events.EventListView.as_view()),
    path("event-data-import/", events.EventDataImport.as_view()),
    path("gender-options/", events.GenderOptionsView.as_view()),
    path("band-data-import/", bands.BandDataImport.as_view()),
    path("bands/", bands.BandListView.as_view()),
    path("crews/", crews.CrewListView.as_view(), name="crews-list"),
    path("crews/<int:pk>", crews.CrewDetailView.as_view(), name="crews-detail"),
    path(
        "crews/bulk-update-overrides/",
        crews.CrewBulkUpdateOverridesView.as_view(),
        name="crew-bulk-update-overrides",
    ),
    path(
        "crew-start-order-duplicates/",
        crew_start_order_duplicates_check.StartOrderDuplicateCheckView.as_view(),
        name="crew-start-order-duplicates",
    ),
    path("results-export/", crews.ResultDataExport.as_view()),
    path("crew-update-rankings/", crews.CrewUpdateRankings.as_view()),
    path("crew-get-event-band/", crews.CrewGetEventBand.as_view()),
    path("crew-update-start-orders/", crews.UpdateStartOrdersView.as_view()),
    path("crew-import-penalties/", crews.CSVImportPenalties.as_view()),
    path("crew-penalties-template/", crews.CreatePenaltiesTemplate.as_view()),
    path("crew-data-import/", crews.CrewDataImport.as_view()),
    path(
        "crew-data-import/<int:personal>",
        crews.CrewDataImport.as_view(),
        name="crews-with-contact-data",
    ),
    path("crew-data-export/", crews.CrewDataExport.as_view()),
    path("bib-data-export/", crews.BibDataExport.as_view()),
    path("start-order-data-export/", crews.StartOrderDataExport.as_view()),
    path(
        "crew-start-order-data-export-after-broe-import/",
        crews.CrewStartOrderDataExport.as_view(),
    ),
    path("crew-web-scorer-data/", crews.CrewWebScorerDataExport.as_view()),
    path("event-order-template-export/", crews.CreateEventOrderTemplate.as_view()),
    path("crew-host-clubs/", crews.CrewUniqueHostClub.as_view()),
    path("crew-list-select/", crews.CrewListOptionsForSelect.as_view()),
    path("competitor-data-export/", competitors.CompetitorDataExport.as_view()),
    path("competitor-data-import/", competitors.CompetitorDataImport.as_view()),
    path("race-times/", times.RaceTimeListView.as_view()),
    path("race-times/<int:pk>", times.RaceTimeDetailView.as_view()),
    path("crew-race-times-import/", times.ImportRaceTimes.as_view()),
    path(
        "crew-race-times-import-webscorer/<int:id>",
        times.ImportTimesWebscorer.as_view(),
    ),
    path(
        "marshalling-divisions/",
        marshalling_division.MarshallingDivisionListView.as_view(),
        name="marshalling-divisions-list",
    ),
    path(
        "marshalling-divisions/<int:pk>/",
        marshalling_division.MarshallingDivisionDetailView.as_view(),
        name="marshalling-divisions-detail",
    ),
    path(
        "marshalling-divisions/import/",
        marshalling_division.ImportMarshallingDivision.as_view(),
        name="import-marshalling-divisions",
    ),
    path(
        "marshalling-divisions/bulk-update/",
        marshalling_division.BulkUpdateMarshallingDivisions.as_view(),
        name="bulk-update-marshalling-divisions",
    ),
    path(
        "original-event-import/",
        original_event_category.OriginalEventCategoryImport.as_view(),
    ),
    path("event-order-import/", event_order.EventOrderImport.as_view()),
    path(
        "marshalling-division-import/",
        marshalling_division.ImportMarshallingDivision.as_view(),
    ),
    path(
        "number-location-template/",
        number_location.CreateNumberLocationTemplate.as_view(),
    ),
    path("number-location-import/", number_location.NumberLocationImport.as_view()),
    path(
        "number-location-bulk-update/",
        number_location.NumberLocationBulkUpdate.as_view(),
    ),
    path("number-locations/", number_location.NumberLocationListView.as_view()),
    path(
        "number-locations/<int:pk>",
        number_location.NumberLocationDetailView.as_view(),
        name="number-location-detail",
    ),
    path(
        "event-meeting-key-bulk-update/",
        event_meeting_key.EventMeetingKeyBulkUpdate.as_view(),
    ),
    path(
        "event-meeting-key-list/", event_meeting_key.EventMeetingKeyListView.as_view()
    ),
    path(
        "event-meeting-key-list/<int:pk>",
        event_meeting_key.EventMeetingKeyDetailView.as_view(),
        name="event-meeting-key-detail",
    ),
    path("global-settings-list/", global_settings.GlobalSettingsListView.as_view()),
    path(
        "global-settings-list/<int:pk>",
        global_settings.GlobalSettingsDetailView.as_view(),
        name="global-settings-detail",
    ),
    path("races/", race.RaceListView.as_view(), name="race-list"),
    path("races/<int:pk>/", race.RaceDetailView.as_view(), name="race-detail"),
    path(
        "race-time-sync/",
        race_timing_sync.RaceTimingSyncListView.as_view(),
        name="race-timing-sync-list",
    ),
    path(
        "race-time-sync/<int:pk>/",
        race_timing_sync.RaceTimingSyncDetailView.as_view(),
        name="race-timing-sync-detail",
    ),
    path(
        "results-comparison/",
        time_compare.ResultsComparisonView.as_view(),
        name="results-comparison",
    ),
    path(
        "race-sequence-comparison/",
        sequence_compare.SequenceComparisonView.as_view(),
        name="sequence-comparison",
    ),
    path(
        "crews/missing-times/",
        missing_times.MissingTimesView.as_view(),
        name="missing-times",
    ),
    path(
        "crews/masters/", masters_crews.MastersCrewsView.as_view(), name="masters-crews"
    ),
    path(
        "crews/stats/",
        crew_dashboard_stats.DataOverviewStatsView.as_view(),
        name="data-overview-stats",
    ),
    path(
        "masters-adjustments-import/",
        masters_adjustments.MastersAdjustmentsImport.as_view(),
        name="masters-adjustment-import",
    ),
]
