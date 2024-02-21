from django.db import models

class MarshallingDivision(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    bottom_range=models.IntegerField()
    top_range=models.IntegerField()