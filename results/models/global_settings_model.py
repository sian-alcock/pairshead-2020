from django.db import models

class GlobalSettings(models.Model):
    id = models.AutoField(primary_key=True)
    broe_data_last_update = models.DateTimeField(blank=True, null=True)

    MODE_CHOICES = [
        ('SETUP', 'Setup'),
        ('PRE_RACE', 'Pre-race'),
        ('RACE', 'Race'),
    ]

    race_mode = models.CharField(
        default='SETUP',
        choices=MODE_CHOICES,
        max_length=10
    )

    class Meta:
        verbose_name = "Global Settings"
        verbose_name_plural = "Global Settings"

    @classmethod
    def get_instance(cls):
        """Get the singleton GlobalSettings instance, create if it doesn't exist"""
        instance, created = cls.objects.get_or_create(
            id=1,
            defaults={
                'race_mode': 'SETUP',
                'broe_data_last_update': None
            }
        )
        if created:
            print("Created new GlobalSettings instance")
        return instance

    def save(self, *args, **kwargs):
        # Force this to always be the singleton instance
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Prevent deletion of the singleton
        pass

    def __str__(self):
        return f"Global Settings (Mode: {self.race_mode})"