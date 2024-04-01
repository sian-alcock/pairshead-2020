from django.db import models

class NumberLocation(models.Model):
    club = models.CharField(max_length=50)
    number_location=models.CharField(max_length=50)