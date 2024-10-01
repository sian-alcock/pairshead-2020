from django.db.models import Min
from django.db import models, transaction

class MarshallingDivision(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    bottom_range=models.IntegerField()
    top_range=models.IntegerField()

    # # Calculate the bottom range
    # def save(self, *args, **kwargs):
    #     self.bottom_range = self.calc_bottom_range()
    #     super(MarshallingDivision, self).save(*args, **kwargs)
        
    # def calc_bottom_range(self):
    #     previous_division = MarshallingDivision.objects.filter(id__lt=self.id).order_by('-id').first()
    #     print('running the calc bottom range function')
    #     print('this is the id ')
    #     print(self.id)
    #     if previous_division is None:
    #         return 1
    #     else:
    #         return previous_division.top_range + 1
        

    
        
