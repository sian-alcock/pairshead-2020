# Generated by Django 3.0.4 on 2020-03-16 19:18

import computed_property.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('results', '0002_auto_20191102_1423'),
    ]

    operations = [
        migrations.AddField(
            model_name='crew',
            name='raw_time',
            field=computed_property.fields.ComputedIntegerField(blank=True, compute_from='calc_raw_time', editable=False, null=True),
        ),
    ]
