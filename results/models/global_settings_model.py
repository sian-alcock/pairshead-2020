from django.db import models
            
class GlobalSettings(models.Model):
    id = models.AutoField(primary_key=True)
    broe_data_last_update = models.DateTimeField(blank=True, null=True)

    MODE_CHOICES = [
        ('SETUP', 'Setup'),
        ('PRE_RACE', 'Pre-race'),
        ('RACE', 'Race'),
    ]

    race_mode = models.CharField(
        default='race',
        choices=MODE_CHOICES,
        max_length=10
    )
