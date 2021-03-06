# Generated by Django 3.0.4 on 2020-03-16 19:54

import computed_property.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('results', '0003_crew_raw_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='crew',
            name='published_time',
            field=computed_property.fields.ComputedIntegerField(blank=True, compute_from='calc_published_time', editable=False, null=True),
        ),
        migrations.AddField(
            model_name='crew',
            name='race_time',
            field=computed_property.fields.ComputedIntegerField(blank=True, compute_from='calc_race_time', editable=False, null=True),
        ),
    ]
