# Generated by Django 2.2.5 on 2019-09-08 09:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('results', '0020_remove_event_event_bands'),
    ]

    operations = [
        migrations.AlterField(
            model_name='crew',
            name='composite_code',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
    ]