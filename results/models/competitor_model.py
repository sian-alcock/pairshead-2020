from django.db import models
from .crew_model import *

class Competitor(models.Model):
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=10)
    substitution = models.BooleanField(blank=True, null=True,)
    crew = models.ForeignKey(Crew, related_name='competitors',
    on_delete=models.SET_NULL, blank=True, null=True,)
