from django.db import models, transaction

class EventMeetingKey(models.Model):
    id = models.AutoField(primary_key=True)
    event_meeting_key = models.CharField(max_length=50)
    event_meeting_name = models.CharField(max_length=50)
    current_event_meeting=models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.current_event_meeting:
            return super(EventMeetingKey, self).save(*args, **kwargs)
        with transaction.atomic():
            EventMeetingKey.objects.filter(
                current_event_meeting=True).update(current_event_meeting=False)
            return super(EventMeetingKey, self).save(*args, **kwargs)