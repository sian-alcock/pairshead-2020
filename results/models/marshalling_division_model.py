from django.db import models

class MarshallingDivision(models.Model):
    name = models.CharField(max_length=50)
    bottom_range=models.IntegerField()
    top_range=models.IntegerField()