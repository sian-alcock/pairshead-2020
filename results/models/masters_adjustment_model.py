from django.db import models

class MastersAdjustment(models.Model):
    standard_time_label = models.CharField(max_length=5)
    standard_time_ms = models.BigIntegerField()
    master_category = models.CharField(max_length=4)
    master_time_adjustment_ms = models.BigIntegerField()