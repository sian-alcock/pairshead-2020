# serializers/import_serializers.py
"""
Import and utility serializers.
"""

import csv
import io
from rest_framework import serializers
from ..models import (
    OriginalEventCategory, MarshallingDivision, NumberLocation, 
    MastersAdjustment, Crew
)




class ImportMarshallingDivisionSerializer(serializers.ModelSerializer):

    class Meta:
        model = MarshallingDivision
        fields = ('name', 'bottom_range', 'top_range',)

class NumberLocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = NumberLocation
        fields = ('id', 'club', 'number_location',)


class WriteMastersAdjustmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = MastersAdjustment
        fields = ('standard_time_label', 'standard_time_ms', 'master_category', 'master_time_adjustment_ms',)

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

