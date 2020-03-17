import re
from rest_framework import serializers
from .models import Club, Event, Band, Crew, RaceTime, Competitor


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('id', 'name', 'override_name', 'info', 'type', 'gender',)

class BandSerializer(serializers.ModelSerializer):

    class Meta:
        model = Band
        fields = ('id', 'name', 'event',)

class PopulatedBandSerializer(serializers.ModelSerializer):
    event = EventSerializer()
    class Meta:
        model = Band
        fields = ('id', 'name', 'event',)

class CompetitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competitor
        fields = ('last_name', 'gender', 'crew',)

class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ('id', 'name', 'abbreviation', 'index_code', 'colours', 'blade_image',)

class RaceTimesSerializer(serializers.ModelSerializer):

    class Meta:
        model = RaceTime
        fields = ('id', 'sequence', 'tap', 'time_tap', 'crew',)

class CrewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'status', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'penalty', 'masters_adjustment', 'masters_adjusted_time', 'masters_adjust_minutes', 'masters_adjust_seconds', 'bib_number', 'time_only', 'did_not_start', 'did_not_finish', 'band',)


class PopulatedCrewSerializer(serializers.ModelSerializer):

    club = ClubSerializer()
    event = EventSerializer()
    band = BandSerializer()
    competitors = CompetitorSerializer(many=True)
    times = RaceTimesSerializer(many=True)


    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'status', 'penalty', 'bib_number', 'times', 'raw_time', 'race_time', 'start_time', 'finish_time', 'start_sequence', 'finish_sequence', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'masters_adjustment', 'masters_adjusted_time', 'masters_adjust_minutes', 'masters_adjust_seconds', 'event', 'club', 'band', 'competitors', 'competitor_names', 'event_band', 'time_only', 'published_time', 'category_position_time', 'did_not_start', 'did_not_finish',)

    def save(self):
        for crew in Crew.objects.all.iterator():
            crew.save()

class CrewExportSerializer(serializers.ModelSerializer):

    raw_time = serializers.CharField(max_length=15)

    class Meta:
        model = Crew
        fields = ('id', 'bib_number', 'name', 'competitor_names', 'start_sequence', 'finish_sequence', 'raw_time',)

    def validate_raw_time(self, value):

        hundredths = (value / 10)%60
        seconds = (value / 1000)%60
        minutes = (value / (1000*60))%60

        value = str(minutes)+':'+str(seconds)+'.'+str(hundredths)

        return value

class CompetitorExportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = ('id', 'name', 'competitor_names',)


class WriteCrewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'club', 'rowing_CRI', 'rowing_CRI_max', 'sculling_CRI', 'sculling_CRI_max', 'event', 'status', 'band', 'bib_number')

class WriteRaceTimesSerializer(serializers.ModelSerializer):

    time_tap = serializers.CharField(max_length=20)

    class Meta:
        model = RaceTime
        fields = ('id', 'sequence', 'bib_number', 'tap', 'time_tap', 'crew',)

    def validate_time_tap(self, value):
        # if time tap format is mm:ss.ms (eg 58:13.04), then add 0: at front
        if re.match(r'^[0-9]{2}:[0-9]{2}.[0-9]{2}', value):
            value = f'0:{value}'

        if not re.match(r'^[0-9]:[0-9]{2}:[0-9]{2}.[0-9]{2}', value):
            raise serializers.ValidationError({'time_tap': 'Problem with time tap format'})

        hrs, mins, secs = value.split(':')
        secs, hdths = secs.split('.')
        # convert to miliseconds
        value = int(hrs)*60*60*1000 + int(mins)*60*1000 + int(secs)*1000 + int(hdths)*10

        return value

class PopulatedRaceTimesSerializer(serializers.ModelSerializer):

    crew = PopulatedCrewSerializer()

    class Meta:
        model = RaceTime
        fields = ('id', 'sequence', 'bib_number', 'tap', 'time_tap', 'crew',)


class WriteClubSerializer(serializers.ModelSerializer):

    # id = serializers.CharField(max_length=10)

    class Meta:
        model = Club
        fields = ('id', 'name', 'abbreviation', 'index_code', 'colours', 'blade_image',)

    def validate_id(self, value):

        if not isinstance(value, int):
            raise serializers.ValidationError({'id': 'Problem with ID'})

        return value
