from django.db import models

class EventOrder(models.Model):
    event=models.CharField(max_length=40)
    event_order=models.IntegerField()