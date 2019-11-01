# Generated by Django 2.2.6 on 2019-11-01 15:55

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('results', '0002_crew_event_band'),
    ]

    operations = [
        migrations.AlterField(
            model_name='band',
            name='event',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='bands', to='results.Event'),
        ),
    ]
