"""
Marshalling division serializers.
"""

from rest_framework import serializers
from ..models import (
    MarshallingDivision
)

class MarshallingDivisionSerializer(serializers.ModelSerializer):

    class Meta:
        model = MarshallingDivision
        fields = '__all__'