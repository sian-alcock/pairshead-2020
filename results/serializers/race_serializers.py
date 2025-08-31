"""
Race and RaceTime related serializers.
"""

import re
from rest_framework import serializers
from ..models import Race, RaceTime, RaceTimingSync
from ..utils import parse_time_to_milliseconds

class RaceTimingSyncSerializer(serializers.ModelSerializer):

    class Meta:
        model = RaceTimingSync
        fields = '__all__'

class RaceTimesSerializer(serializers.ModelSerializer):

    class Meta:
        model = RaceTime
        fields = '__all__'

class RaceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Race
        fields = '__all__'

class RaceTimesWithRaceSerializer(serializers.ModelSerializer):
    """RaceTime serializer that includes race info but no crew to avoid circular references."""
    race = RaceSerializer()
    
    class Meta:
        model = RaceTime
        fields = '__all__'

class WriteRaceTimesSerializer(serializers.ModelSerializer):

    time_tap = serializers.CharField(max_length=20)

    class Meta:
        model = RaceTime
        fields = ('id', 'sequence', 'bib_number', 'tap', 'time_tap', 'crew', 'race',)

    def validate_time_tap(self, value):
        try:
            return parse_time_to_milliseconds(value)
        except ValueError as e:
            raise serializers.ValidationError({
                'time_tap': str(e)
            })
        

class PopulatedRaceTimesSerializer(serializers.ModelSerializer):
    """RaceTime serializer with basic crew info and race info."""
    race = RaceSerializer()
    
    # Use SerializerMethodField to avoid circular import
    crew = serializers.SerializerMethodField()
    
    class Meta:
        model = RaceTime
        fields = '__all__'
    
    def get_crew(self, obj):
        # Import locally to avoid circular import
        from .crew_serializers import CrewBasicSerializer
        return CrewBasicSerializer(obj.crew).data