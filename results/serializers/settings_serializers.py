"""
Settings and configuration serializers.
"""

from rest_framework import serializers
from results.models.global_settings_model import GlobalSettings
from results.models.event_meeting_key_model import EventMeetingKey


class GlobalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSettings
        fields = '__all__'

class EventMeetingKeySerializer(serializers.ModelSerializer):

    class Meta:
        model = EventMeetingKey
        fields = ('id', 'event_meeting_key', 'event_meeting_name', 'current_event_meeting',)

