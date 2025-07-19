from django.db import models, transaction

class Race(models.Model):
    race_id = models.CharField(max_length=15, default='')
    name = models.CharField(max_length=30)
    default_start = models.BooleanField(default=False)
    default_finish = models.BooleanField(default=False)
    is_timing_reference = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.default_start:
            with transaction.atomic():
                Race.objects.filter(default_start=True).update(default_start=False)
        
        if self.default_finish:
            with transaction.atomic():
                Race.objects.filter(default_finish=True).update(default_finish=False)

        if self.is_timing_reference:
            with transaction.atomic():
                Race.objects.filter(is_timing_reference=True).update(is_timing_reference=False)

        super(Race, self).save(*args, **kwargs)

    def get_synchronized_time(self, raw_time_ms):
        """
        Convert a raw time from this race to the reference timing system.
        """
        try:
            sync_record = RaceTimingSync.objects.get(target_race=self)
            return raw_time_ms + sync_record.timing_offset_ms
        except RaceTimingSync.DoesNotExist:
            # This race is either the reference or not synchronized
            return raw_time_ms

class RaceTimingSync(models.Model):
    """
    Manages timing synchronization between pairs of races.
    One race is designated as the reference (offset = 0), 
    others store their offset relative to the reference.
    """
    reference_race = models.ForeignKey(Race, related_name='sync_as_reference', on_delete=models.CASCADE)
    target_race = models.ForeignKey(Race, related_name='sync_as_target', on_delete=models.CASCADE)
    timing_offset_ms = models.IntegerField(
        help_text="Offset in milliseconds to add to target_race times to align with reference_race"
    )
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['reference_race', 'target_race']
        
    def __str__(self):
        return f"Sync: {self.target_race.name} -> {self.reference_race.name} ({self.timing_offset_ms}ms)"