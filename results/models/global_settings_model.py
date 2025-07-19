from django.db import models
            
class GlobalSettings(models.Model):
    id = models.AutoField(primary_key=True)
    broe_data_last_update = models.DateTimeField(blank=True, null=True)
    pre_race_mode = models.BooleanField(default=False)
