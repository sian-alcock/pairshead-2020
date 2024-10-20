# Generated by Django 3.2.15 on 2024-10-10 17:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('results', '0003_globalsettings_timing_offset'),
    ]

    operations = [
        migrations.AddField(
            model_name='crew',
            name='timing_offset',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AlterField(
            model_name='globalsettings',
            name='timing_offset',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
    ]
