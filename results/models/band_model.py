from django.db import models

from .event_model import Event
            
class Band(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=30)
    event = models.ForeignKey(Event, related_name='bands',
    on_delete=models.CASCADE)