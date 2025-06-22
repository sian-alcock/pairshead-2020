"""
Crew-related serializers.
"""

from rest_framework import serializers
from ..models import Crew, Club
from .club_serializers import ClubSerializer
from .event_serializers import EventSerializer, BandSerializer, ImportOriginalEventSerializer
from .competitor_serializers import CompetitorSerializer
from .race_serializers import RaceTimesWithRaceSerializer

class CrewBasicSerializer(serializers.ModelSerializer):
    """Simplified crew serializer to avoid circular references."""
    
    class Meta:
        model = Crew
        fields = ('id', 'name', 'bib_number', 'competitor_names', 'club', 'event')

class CrewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'status', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'penalty', 'masters_adjustment', 'masters_adjusted_time', 'bib_number', 'time_only', 'did_not_start', 'did_not_finish', 'disqualified', 'band', 'overall_rank', 'gender_rank', 'requires_recalculation', 'competitor_names',)

# class PopulatedCrewSerializer(serializers.ModelSerializer):

#     club = ClubSerializer()
#     event = EventSerializer()
#     band = BandSerializer()
#     host_club = ClubSerializer()
#     competitors = CompetitorSerializer(many=True)
#     times = serializers.SerializerMethodField()
#     event_original = ImportOriginalEventSerializer(many=True)


#     class Meta:
#         model = Crew
#         fields = ('id', 'name', 'composite_code', 'status', 'penalty', 'bib_number', 'times', 'raw_time', 'race_time', 'start_time', 'finish_time', 'start_sequence', 'finish_sequence', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'masters_adjustment', 'masters_adjusted_time', 'event', 'club', 'band', 'competitors', 'competitor_names', 'event_band', 'time_only', 'published_time', 'category_position_time', 'did_not_start', 'did_not_finish', 'disqualified', 'overall_rank', 'gender_rank', 'category_position_time', 'category_rank', 'event_original', 'sculling_CRI', 'rowing_CRI', 'draw_start_score', 'calculated_start_order', 'event_order', 'host_club', 'marshalling_division', 'number_location', 'otd_contact', 'otd_home_phone', 'otd_work_phone', 'otd_mobile_phone', 'updated', 'crew_timing_offset',)

class PopulatedCrewSerializer(serializers.ModelSerializer):
    # Use SerializerMethodField for nested serializers to avoid circular imports
    club = serializers.SerializerMethodField()
    event = serializers.SerializerMethodField()
    band = serializers.SerializerMethodField()
    host_club = serializers.SerializerMethodField()
    competitors = serializers.SerializerMethodField()
    times = serializers.SerializerMethodField()
    event_original = serializers.SerializerMethodField()

    class Meta:
        model = Crew
        fields = (
            'id', 'name', 'composite_code', 'status', 'penalty', 'bib_number', 'times', 
            'raw_time', 'race_time', 'start_time', 'finish_time', 'start_sequence', 
            'finish_sequence', 'manual_override_time', 'manual_override_minutes', 
            'manual_override_seconds', 'manual_override_hundredths_seconds', 'masters_adjustment', 
            'masters_adjusted_time', 'event', 'club', 'band', 'competitors', 'competitor_names', 
            'event_band', 'time_only', 'published_time', 'category_position_time', 'did_not_start', 
            'did_not_finish', 'disqualified', 'overall_rank', 'gender_rank', 'category_position_time', 
            'category_rank', 'event_original', 'sculling_CRI', 'rowing_CRI', 'draw_start_score', 
            'calculated_start_order', 'event_order', 'host_club', 'marshalling_division', 
            'number_location', 'otd_contact', 'otd_home_phone', 'otd_work_phone', 'otd_mobile_phone', 
            'updated', 'crew_timing_offset',
        )
    
    def get_club(self, obj):
        from .club_serializers import ClubSerializer
        return ClubSerializer(obj.club).data if obj.club else None
    
    def get_event(self, obj):
        from .event_serializers import EventSerializer
        return EventSerializer(obj.event).data if obj.event else None
    
    def get_band(self, obj):
        from .event_serializers import BandSerializer
        return BandSerializer(obj.band).data if obj.band else None
    
    def get_host_club(self, obj):
        from .club_serializers import ClubSerializer
        return ClubSerializer(obj.host_club).data if obj.host_club else None
    
    def get_competitors(self, obj):
        from .competitor_serializers import CompetitorSerializer
        return CompetitorSerializer(obj.competitors.all(), many=True).data
    
    def get_times(self, obj):
        from .race_serializers import RaceTimesWithRaceSerializer
        return RaceTimesWithRaceSerializer(obj.times.all(), many=True).data
    
    def get_event_original(self, obj):
        from .event_serializers import ImportOriginalEventSerializer
        return ImportOriginalEventSerializer(obj.event_original.all(), many=True).data


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


class WriteCrewSerializer(serializers.ModelSerializer):

    host_club = serializers.CharField()

    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'club', 'rowing_CRI', 'sculling_CRI', 'event', 'status', 'band', 'bib_number', 'host_club', 'otd_contact', 'otd_home_phone', 'otd_mobile_phone', 'otd_work_phone', 'updated', 'time_only', )
    
    def create(self, validated_data):
        host_club = validated_data.pop('host_club')

        try:
            club = Club.objects.get(id = host_club)
        except Club.DoesNotExist:
            club = Club.objects.create(id = host_club, name = 'Unknown club' + ' - ' + host_club)

        new_crew = Crew.objects.create(host_club = club, **validated_data)
        return new_crew


class CrewSerializerLimited(serializers.ModelSerializer):
    # Use SerializerMethodField to avoid circular import
    times = serializers.SerializerMethodField()

    class Meta:
        model = Crew
        fields = ('id', 'bib_number', 'competitor_names', 'times',)
    
    def get_times(self, obj):
        # Import locally to avoid circular import
        from .race_serializers import RaceTimesSerializer
        return RaceTimesSerializer(obj.times.all(), many=True).data
