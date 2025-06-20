import re
from django.db.models import Count
import csv
import io
from rest_framework import serializers

from results.models.global_settings_model import GlobalSettings
from .models import Club, Event, Band, Crew, RaceTime, Competitor, MastersAdjustment, OriginalEventCategory, EventOrder, MarshallingDivision, NumberLocation, EventMeetingKey, Race

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
        fields = '__all__'

class CrewSerializerLimited(serializers.ModelSerializer):
    times = RaceTimesSerializer(many=True)

    class Meta:
        model = Crew
        fields = ('id', 'bib_number', 'competitor_names', 'times',)

class CrewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = ('id', 'name', 'composite_code', 'status', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'penalty', 'masters_adjustment', 'masters_adjusted_time', 'bib_number', 'time_only', 'did_not_start', 'did_not_finish', 'disqualified', 'band', 'overall_rank', 'gender_rank', 'requires_recalculation', 'competitor_names',)

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
        fields = ('id', 'name', 'composite_code', 'status', 'penalty', 'bib_number', 'times', 'raw_time', 'race_time', 'start_time', 'finish_time', 'start_sequence', 'finish_sequence', 'manual_override_time', 'manual_override_minutes', 'manual_override_seconds', 'manual_override_hundredths_seconds', 'masters_adjustment', 'masters_adjusted_time', 'event', 'club', 'band', 'competitors', 'competitor_names', 'event_band', 'time_only', 'published_time', 'category_position_time', 'did_not_start', 'did_not_finish', 'disqualified', 'overall_rank', 'gender_rank', 'category_position_time', 'category_rank', 'event_original', 'sculling_CRI', 'rowing_CRI', 'draw_start_score', 'calculated_start_order', 'event_order', 'host_club', 'marshalling_division', 'number_location', 'otd_contact', 'otd_home_phone', 'otd_work_phone', 'otd_mobile_phone', 'updated', 'crew_timing_offset',)


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
        fields = ('id', 'name', 'composite_code', 'club', 'rowing_CRI', 'sculling_CRI', 'event', 'status', 'band', 'bib_number', 'host_club', 'otd_contact', 'otd_home_phone', 'otd_mobile_phone', 'otd_work_phone', 'updated', 'time_only', )
    
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

class RaceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Race
        fields = '__all__'

class PopulatedRaceTimesSerializer(serializers.ModelSerializer):

    crew = PopulatedCrewSerializer()
    race = RaceSerializer()

    class Meta:
        model = RaceTime
        fields = '__all__'


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

class GlobalSettingsSerializer(serializers.ModelSerializer):

    class Meta:
        model = GlobalSettings
        fields = '__all__'

class CSVUpdateCrewSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("File must be a CSV file.")
        return value

    def save(self):
        file = self.validated_data['file']
        
        # Read CSV file
        file_data = file.read().decode('utf-8')
        csv_data = csv.DictReader(io.StringIO(file_data))
        
        created_count = 0
        updated_count = 0
        errors = []

        for row_num, row in enumerate(csv_data, start=2):  # Start from 2 (header is row 1)
            try:
                bib_number = row.get('bib_number', '').strip()
                penalty = row.get('penalty', '').strip()
                time_only = row.get('time_only', '').strip()
                did_not_start = row.get('did_not_start', '').strip()
                did_not_finish = row.get('did_not_finish', '').strip()
                disqualified = row.get('disqualified', '').strip()

                if not bib_number:
                    errors.append(f"Row {row_num}: Bib number is required")
                    continue

                # Check penalty is number
                try:
                    penalty = float(penalty) if penalty else 0
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid penalty format")
                    continue

                # Check booleans
                try:
                    time_only = True if time_only == 'true' else False
                    did_not_start = True if did_not_start == 'true' else False
                    did_not_finish = True if did_not_finish == 'true' else False
                    disqualified = True if disqualified == 'true' else False
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid value for time_only, did_not_start, did_not_finish or disqualified.  Must be true, false or blank")
                    continue

                # Check if crew exists
                crew = Crew.objects.get(bib_number=bib_number)
                crew.penalty = penalty
                crew.time_only = time_only
                crew.did_not_start = did_not_start
                crew.did_not_finish = did_not_finish
                crew.disqualified = disqualified
                crew.requires_recalculation = True
                crew.save()
                updated_count += 1

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")

        return {
        'created_count': created_count,
        'updated_count': updated_count,
        'errors': errors,
        'total_processed': created_count + updated_count
        }
