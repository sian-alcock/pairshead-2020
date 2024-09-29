import re
from django.db.models import Count

from rest_framework import serializers
from .models import Club, Event, Band, Crew, RaceTime, Competitor, MastersAdjustment, OriginalEventCategory, EventOrder, MarshallingDivision, NumberLocation, EventMeetingKey


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
        fields = ('id', 'name', 'composite_code', 'status', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'penalty', 'masters_adjustment', 'masters_adjusted_time', 'bib_number', 'time_only', 'did_not_start', 'did_not_finish', 'disqualified', 'band', 'overall_rank', 'gender_rank', 'requires_recalculation',)

class ImportOriginalEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = OriginalEventCategory
        fields = ('crew', 'event_original',)



class ImportMarshallingDivisionSerializer(serializers.ModelSerializer):

    class Meta:
        model = MarshallingDivision
        fields = ('name', 'bottom_range', 'top_range',)

class NumberLocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = NumberLocation
        fields = ('id', 'club', 'number_location',)


class PopulatedCrewSerializer(serializers.ModelSerializer):

    club = ClubSerializer()
    event = EventSerializer()
    band = BandSerializer()
    host_club = ClubSerializer()
    competitors = CompetitorSerializer(many=True)
    times = RaceTimesSerializer(many=True)
    event_original = ImportOriginalEventSerializer(many=True)


    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'status', 'penalty', 'bib_number', 'times', 'raw_time', 'race_time', 'start_time', 'finish_time', 'start_sequence', 'finish_sequence', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'masters_adjustment', 'masters_adjusted_time', 'event', 'club', 'band', 'competitors', 'competitor_names', 'event_band', 'time_only', 'published_time', 'category_position_time', 'did_not_start', 'did_not_finish', 'disqualified', 'overall_rank', 'gender_rank', 'category_position_time', 'category_rank', 'event_original', 'sculling_CRI', 'rowing_CRI', 'draw_start_score', 'calculated_start_order', 'event_order', 'host_club', 'marshalling_division', 'number_location', 'otd_contact', 'otd_home_phone', 'otd_work_phone', 'otd_mobile_phone',)


class CrewExportSerializer(serializers.ModelSerializer):
    raw_time = serializers.CharField(max_length=15)

    class Meta:
        model = Crew
        fields = ('id', 'bib_number', 'name', 'event', 'club', 'overall_rank', 'competitor_names', 'start_sequence', 'finish_sequence', 'raw_time',)

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

    host_club = serializers.CharField()

    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'club', 'rowing_CRI', 'sculling_CRI', 'event', 'status', 'band', 'bib_number', 'host_club', 'otd_contact', 'otd_home_phone', 'otd_mobile_phone', 'otd_work_phone', )
    
    def create(self, validated_data):
        host_club = validated_data.pop('host_club')

        try:
            club = Club.objects.get(id = host_club)
        except Club.DoesNotExist:
            club = Club.objects.create(id = host_club, name = 'Unknown club' + ' - ' + host_club)

        new_crew = Crew.objects.create(host_club = club, **validated_data)
        return new_crew
    
class WriteRaceTimesSerializer(serializers.ModelSerializer):

    time_tap = serializers.CharField(max_length=20)

    class Meta:
        model = RaceTime
        fields = ('id', 'sequence', 'bib_number', 'tap', 'time_tap', 'crew',)

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

class WriteMastersAdjustmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = MastersAdjustment
        fields = ('standard_time_label', 'standard_time_ms', 'master_category', 'master_time_adjustment_ms',)

class WriteEventOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = EventOrder
        fields = ('event', 'event_order',)

class EventMeetingKeySerializer(serializers.ModelSerializer):

    class Meta:
        model = EventMeetingKey
        fields = ('id', 'event_meeting_key', 'event_meeting_name', 'current_event_meeting',)

