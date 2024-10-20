from django.contrib import admin
from .models import Club, Event, Crew, RaceTime, Competitor, MastersAdjustment, EventMeetingKey, GlobalSettings, Band, MarshallingDivision, NumberLocation, EventOrder, OriginalEventCategory

# Register your models here.

admin.site.register(Club)
admin.site.register(Event)
admin.site.register(Crew)
admin.site.register(RaceTime)
admin.site.register(Competitor)
admin.site.register(MastersAdjustment)
admin.site.register(EventMeetingKey)
admin.site.register(GlobalSettings)
admin.site.register(Band)
admin.site.register(MarshallingDivision)
admin.site.register(NumberLocation)
admin.site.register(EventOrder)
admin.site.register(OriginalEventCategory)
