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
                # Simple header mapping with underscores
                bib_number = row.get('bib_number', '').strip()
                penalty = row.get('penalty', '').strip()
                time_only = row.get('time_only', '').strip()
                did_not_start = row.get('did_not_start', '').strip()
                did_not_finish = row.get('did_not_finish', '').strip()
                disqualified = row.get('disqualified', '').strip()

                # Debug logging for row 150
                if bib_number == '150':
                    print(f"DEBUG Row 150 - penalty: '{penalty}', did_not_finish: '{did_not_finish}'")

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
                    time_only = True if time_only.lower() == 'true' else False
                    did_not_start = True if did_not_start.lower() == 'true' else False
                    did_not_finish = True if did_not_finish.lower() == 'true' else False
                    disqualified = True if disqualified.lower() == 'true' else False
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid value for time_only, did_not_start, did_not_finish or disqualified.  Must be true, false or blank")
                    continue

                # Check if crew exists
                crew = Crew.objects.get(bib_number=bib_number)
                
                # Debug logging for row 150 before save
                if bib_number == '150':
                    print(f"DEBUG Row 150 - Before save: penalty={penalty}, did_not_finish={did_not_finish}")
                    print(f"DEBUG Row 150 - Current crew values: penalty={crew.penalty}, did_not_finish={crew.did_not_finish}")
                
                crew.penalty = penalty
                crew.time_only = time_only
                crew.did_not_start = did_not_start
                crew.did_not_finish = did_not_finish
                crew.disqualified = disqualified
                crew.requires_recalculation = True
                crew.save()
                
                # Debug logging for row 150 after save
                if bib_number == '150':
                    crew.refresh_from_db()
                    print(f"DEBUG Row 150 - After save: penalty={crew.penalty}, did_not_finish={crew.did_not_finish}")
                
                updated_count += 1

            except Crew.DoesNotExist:
                errors.append(f"Row {row_num}: Crew with bib number {bib_number} not found")
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")

        # Update all computed properties after processing all rows
        try:
            Crew.update_all_computed_properties()
        except Exception as e:
            errors.append(f"Error updating computed properties: {str(e)}")

        return {
            'created_count': created_count,
            'updated_count': updated_count,
            'errors': errors,
            'total_processed': created_count + updated_count
        }