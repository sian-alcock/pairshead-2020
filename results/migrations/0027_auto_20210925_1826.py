# Generated by Django 3.2.6 on 2021-09-25 17:26

import computed_property.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('results', '0026_crew_competitor_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='crew',
            name='finish_sequence',
            field=computed_property.fields.ComputedIntegerField(blank=True, compute_from='get_finish_sequence', editable=False, null=True),
        ),
        migrations.AddField(
            model_name='crew',
            name='start_sequence',
            field=computed_property.fields.ComputedIntegerField(blank=True, compute_from='get_start_sequence', editable=False, null=True),
        ),
    ]
