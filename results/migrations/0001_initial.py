# Generated by Django 2.2.6 on 2019-11-02 08:10

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Band',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=30)),
            ],
        ),
        migrations.CreateModel(
            name='Club',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=50)),
                ('abbreviation', models.CharField(blank=True, max_length=50, null=True)),
                ('index_code', models.CharField(blank=True, max_length=20, null=True)),
                ('colours', models.CharField(blank=True, max_length=100, null=True)),
                ('blade_image', models.CharField(blank=True, max_length=200, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Crew',
            fields=[
                ('name', models.CharField(max_length=50)),
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('composite_code', models.CharField(blank=True, max_length=10, null=True)),
                ('rowing_CRI', models.IntegerField(blank=True, null=True)),
                ('rowing_CRI_max', models.IntegerField(blank=True, null=True)),
                ('sculling_CRI', models.IntegerField(blank=True, null=True)),
                ('sculling_CRI_max', models.IntegerField(blank=True, null=True)),
                ('status', models.CharField(max_length=20)),
                ('penalty', models.IntegerField(default=0)),
                ('masters_adjust_minutes', models.IntegerField(default=0)),
                ('masters_adjust_seconds', models.IntegerField(default=0)),
                ('manual_override_minutes', models.IntegerField(default=0)),
                ('manual_override_seconds', models.IntegerField(default=0)),
                ('manual_override_hundredths_seconds', models.IntegerField(default=0)),
                ('bib_number', models.IntegerField(blank=True, null=True)),
                ('time_only', models.BooleanField(default=False)),
                ('did_not_start', models.BooleanField(default=False)),
                ('did_not_finish', models.BooleanField(default=False)),
                ('event_band', models.CharField(max_length=20, null=True)),
                ('band', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='bands', to='results.Band')),
                ('club', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crews', to='results.Club')),
            ],
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=30)),
                ('override_name', models.CharField(blank=True, max_length=30, null=True)),
                ('info', models.CharField(blank=True, max_length=30, null=True)),
                ('type', models.CharField(blank=True, max_length=30, null=True)),
                ('gender', models.CharField(blank=True, max_length=20, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='RaceTime',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sequence', models.IntegerField()),
                ('bib_number', models.IntegerField(blank=True, null=True)),
                ('tap', models.CharField(max_length=10)),
                ('time_tap', models.BigIntegerField()),
                ('crew', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='times', to='results.Crew')),
            ],
        ),
        migrations.AddField(
            model_name='crew',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crews', to='results.Event'),
        ),
        migrations.CreateModel(
            name='Competitor',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_name', models.CharField(max_length=50)),
                ('gender', models.CharField(max_length=10)),
                ('substitution', models.BooleanField(blank=True, null=True)),
                ('crew', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='competitors', to='results.Crew')),
            ],
        ),
        migrations.AddField(
            model_name='band',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bands', to='results.Event'),
        ),
    ]
