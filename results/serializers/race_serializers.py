"""
Race and RaceTime related serializers.
"""

import re
from rest_framework import serializers
from ..models import Race, RaceTime

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

        # if time tap format is mm:ss.SS (eg 58:13.04), then add 0: at front
        if re.match(r'^[0-9]{2}:[0-9]{2}.[0-9]{2}', value):
            value = f'0:{value}'

        # if time tap format is not h:mm:ss.SS (eg 2:58:13.04), then generate an error
        if not re.match(r'^[0-9]{1}:[0-9]{2}:[0-9]{2}.[0-9]{2}', value):
            raise serializers.ValidationError({'time_tap': 'Problem with time tap format'})

        hrs, mins, secs = value.split(':')

        secs, hdths = secs.split('.')

        # convert to miliseconds
        value = int(hrs)*60*60*1000 + int(mins)*60*1000 + int(secs)*1000 + int(hdths) * 10

        return value

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