# serializers/event_serializers.py
"""
Event and Band related serializers.
"""

from django.db.models import Count
from rest_framework import serializers
from ..models import Event, Band, EventOrder, Crew, OriginalEventCategory

class EventSerializer(serializers.ModelSerializer):
    crews = Crew.objects.annotate(Count('event'))
    class Meta:
        model = Event
        fields = ('id', 'name', 'override_name', 'info', 'type', 'gender', )

class PopulatedEventSerializer(serializers.ModelSerializer):
    crews = Crew.objects.annotate(Count('event'))
    class Meta:
        model = Event
        fields = ('id', 'name', 'override_name', 'info', 'type', 'gender', 'crews', )

class BandSerializer(serializers.ModelSerializer):

    class Meta:
        model = Band
        fields = ('id', 'name', 'event',)

class PopulatedBandSerializer(serializers.ModelSerializer):
    event = EventSerializer()
    class Meta:
        model = Band
        fields = ('id', 'name', 'event',)

class ImportOriginalEventSerializer(serializers.ModelSerializer):
    crew = serializers.CharField()  # accept string from CSV

    class Meta:
        model = OriginalEventCategory
        fields = ('crew', 'event_original',)

    def validate_crew(self, value):
        try:
            crew_id = int(value)
        except ValueError:
            raise serializers.ValidationError(f"CrewID '{value}' is not a valid integer")

        try:
            return Crew.objects.get(pk=crew_id)
        except Crew.DoesNotExist:
            raise serializers.ValidationError(f"CrewID {crew_id} not found in database")


class WriteEventOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = EventOrder
        fields = ('event', 'event_order',)