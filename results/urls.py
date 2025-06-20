from django.urls import path
from .views import clubs
from .views import events
from .views import bands
from .views import crews
from .views import competitors
from .views import times
from .views import results
from .views import masters_adjustments
from .views import original_event_category
from .views import event_order
from .views import marshalling_division
from .views import number_location
from .views import event_meeting_key
from .views import global_settings
from .views import race


urlpatterns = [
path('clubs/', clubs.ClubListView.as_view()),
path('club-data-import/', clubs.ClubDataImport.as_view()),
path('events/', events.EventListView.as_view()),
path('event-data-import/', events.EventDataImport.as_view()),
path('band-data-import/', bands.BandDataImport.as_view()),
path('bands/', bands.BandListView.as_view()),
path('crews/', crews.CrewListView.as_view(), name='crews-list'),
path('crews/<int:pk>', crews.CrewDetailView.as_view(), name='crews-detail'),
path('', crews.CrewListView.as_view()),
path('results/', results.ResultsListView.as_view()),
path('results-export/', results.ResultDataExport.as_view()),
path('crew-update-rankings/', crews.CrewUpdateRankings.as_view()),
path('crew-get-event-band/', crews.CrewGetEventBand.as_view()),
path('crew-get-start-score/', crews.CrewGetStartScore.as_view()),
path('crew-get-start-order/', crews.CrewGetStartOrder.as_view()),
path('crew-check-start-order/', crews.CheckStartOrderUnique.as_view()),
path('crew-import-penalties/', crews.CSVImportPenalties.as_view()),
path('crew-data-import/', crews.CrewDataImport.as_view()),
path('crew-data-import/<int:personal>', crews.CrewDataImport.as_view(), name='crews-with-contact-data'),
path('crew-data-export/', crews.CrewDataExport.as_view()),
path('bib-data-export/', crews.BibDataExport.as_view()),
path('start-order-data-export/', crews.StartOrderDataExport.as_view()),
path('crew-start-order-data-export-after-broe-import/', crews.CrewStartOrderDataExport.as_view()),
path('crew-web-scorer-data/', crews.CrewWebScorerDataExport.as_view()),
path('event-order-template-export/', crews.CreateEventOrderTemplate.as_view()),
path('crew-host-clubs/', crews.CrewUniqueHostClub.as_view()),
path('crew-list-select/', crews.CrewListOptionsForSelect.as_view()),
path('competitor-data-export/', competitors.CompetitorDataExport.as_view()),
path('competitor-data-import/', competitors.CompetitorDataImport.as_view()),
path('race-times/', times.RaceTimeListView.as_view()),
path('race-times/<int:pk>', times.RaceTimeDetailView.as_view()),
path('crew-race-times-import/', times.ImportRaceTimes.as_view()),
path('crew-race-times-import-folder/', times.ImportRaceTimesCSVFolder.as_view()),
path('crew-race-times-import-webscorer/<int:id>', times.ImportTimesWebscorer.as_view()),
path('masters-adjustments-import/', masters_adjustments.MastersAdjustmentsImport.as_view()),
path('original-event-import/', original_event_category.OriginalEventCategoryImport.as_view()),
path('event-order-import/', event_order.EventOrderImport.as_view()),
path('marshalling-division-import/', marshalling_division.ImportMarshallingDivision.as_view()),
path('number-location-template/', number_location.CreateNumberLocationTemplate.as_view()),
path('number-location-import/', number_location.NumberLocationImport.as_view()),
path('number-locations/', number_location.NumberLocationListView.as_view()),
path('number-locations/<int:pk>', number_location.NumberLocationDetailView.as_view(), name='number-location-detail'),
path('event-meeting-key-list/', event_meeting_key.EventMeetingKeyListView.as_view()),
path('event-meeting-key-list/<int:pk>', event_meeting_key.EventMeetingKeyDetailView.as_view(), name='event-meeting-key-detail'),
path('global-settings-list/', global_settings.GlobalSettingsListView.as_view()),
path('global-settings-list/<int:pk>', global_settings.GlobalSettingsDetailView.as_view(), name='global-settings-detail'),
path('race/<int:pk>', race.RaceDetailView.as_view(), name='race-detail'),
path('race-list/', race.RaceListView.as_view(), name='race-list'),

]
