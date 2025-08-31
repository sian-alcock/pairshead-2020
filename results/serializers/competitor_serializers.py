"""
Competitor-related serializers.
"""

from rest_framework import serializers
from ..models import Competitor, Crew

class CompetitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competitor
        fields = ('last_name', 'gender', 'crew',)

class CompetitorExportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Crew
        fields = ('id', 'name', 'competitor_names',)