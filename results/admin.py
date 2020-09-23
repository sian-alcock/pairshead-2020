from django.contrib import admin
from .models import Club, Event, Crew, RaceTime, Competitor, MastersAdjustment

# Register your models here.

admin.site.register(Club)
admin.site.register(Event)
admin.site.register(Crew)
admin.site.register(RaceTime)
admin.site.register(Competitor)
admin.site.register(MastersAdjustment)
