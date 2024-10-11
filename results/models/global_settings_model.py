from django.db import models
            
class GlobalSettings(models.Model):
    id = models.AutoField(primary_key=True)
    timing_offset_hours = models.IntegerField(blank=True, null=True, default=0)
    timing_offset_minutes = models.IntegerField(blank=True, null=True, default=0)
    timing_offset_seconds = models.IntegerField(blank=True, null=True, default=0)
    timing_offset_hundredths_seconds = models.IntegerField(blank=True, null=True, default=0)
    timing_offset_positive = models.BooleanField(blank=True, null=True, default=True)
    broe_data_last_update = models.DateTimeField(blank=True, null=True)
    timing_offset = models.IntegerField(blank=True, null=True, default=0)

    def save(self, *args, **kwargs):
        self.timing_offset = self.sum_timing_offset()
        super(GlobalSettings, self).save(*args, **kwargs)

    def sum_timing_offset(self):
        time = (self.timing_offset_hours*60*60*1000) + (self.timing_offset_minutes*60*1000) + (self.timing_offset_seconds*1000) + (self.timing_offset_hundredths_seconds*10)
        return time