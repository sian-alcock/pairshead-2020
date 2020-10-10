from django.db import models
import computed_property
from django.db.models import Min

class Club(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    abbreviation = models.CharField(max_length=50, blank=True, null=True)
    index_code = models.CharField(max_length=20, blank=True, null=True)
    colours = models.CharField(max_length=100, blank=True, null=True)
    blade_image = models.CharField(max_length=200, blank=True, null=True)

class Event(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=30)
    override_name = models.CharField(max_length=30, blank=True, null=True)
    info = models.CharField(max_length=30, blank=True, null=True)
    type = models.CharField(max_length=30, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)

class Band(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=30)
    event = models.ForeignKey(Event, related_name='bands',
    on_delete=models.CASCADE)

class Crew(models.Model):
    created = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated = models.DateTimeField(auto_now=True, blank=True, null=True)
    name = models.CharField(max_length=50)
    id = models.IntegerField(primary_key=True)
    composite_code = models.CharField(max_length=10, blank=True, null=True)
    club = models.ForeignKey(Club, related_name='crews',
    on_delete=models.CASCADE)
    rowing_CRI = models.IntegerField(blank=True, null=True)
    rowing_CRI_max = models.IntegerField(blank=True, null=True)
    sculling_CRI = models.IntegerField(blank=True, null=True)
    sculling_CRI_max = models.IntegerField(blank=True, null=True)
    event = models.ForeignKey(Event, related_name='crews',
    on_delete=models.CASCADE)
    status = models.CharField(max_length=20)
    penalty = models.IntegerField(default=0)
    manual_override_minutes = models.IntegerField(default=0)
    manual_override_seconds = models.IntegerField(default=0)
    manual_override_hundredths_seconds = models.IntegerField(default=0)
    bib_number = models.IntegerField(blank=True, null=True)
    band = models.ForeignKey(Band, related_name='bands',
    on_delete=models.CASCADE, blank=True, null=True)
    time_only = models.BooleanField(default=False)
    did_not_start = models.BooleanField(default=False)
    did_not_finish = models.BooleanField(default=False)
    disqualified = models.BooleanField(default=False)
    requires_recalculation = models.BooleanField(default=False)

    event_band = models.CharField(max_length=40, null=True)
    raw_time = computed_property.ComputedIntegerField(compute_from='calc_raw_time', blank=True, null=True)
    race_time = computed_property.ComputedIntegerField(compute_from='calc_race_time', blank=True, null=True)
    published_time = computed_property.ComputedIntegerField(compute_from='calc_published_time', blank=True, null=True)
    overall_rank = computed_property.ComputedIntegerField(compute_from='calc_overall_rank', blank=True, null=True)
    gender_rank = computed_property.ComputedIntegerField(compute_from='calc_gender_rank', blank=True, null=True)
    category_position_time = computed_property.ComputedIntegerField(compute_from='calc_category_position_time', blank=True, null=True)
    category_rank = computed_property.ComputedIntegerField(compute_from='calc_category_rank', blank=True, null=True)
    masters_adjustment = computed_property.ComputedIntegerField(compute_from='get_masters_adjustment', blank=True, null=True)
    start_time = computed_property.ComputedIntegerField(compute_from='get_start_time', blank=True, null=True)
    finish_time = computed_property.ComputedIntegerField(compute_from='get_finish_time', blank=True, null=True)
    invalid_time = computed_property.ComputedIntegerField(compute_from='get_invalidated_times', blank=True, null=True)
    start_sequence = computed_property.ComputedIntegerField(compute_from='get_start_sequence', blank=True, null=True)
    finish_sequence = computed_property.ComputedIntegerField(compute_from='get_finish_sequence', blank=True, null=True)
    competitor_names = computed_property.ComputedCharField(compute_from='get_competitor_names', blank=True, null=True, max_length=30)


    def __str__(self):
        return self.name
  
    def save(self, *args, **kwargs):
        self.event_band = self.get_event_band()
        super(Crew, self).save(*args, **kwargs)
    
    def get_event_band(self):
        return str(self.event.override_name) + ' ' + str(self.band.name) if self.band else self.event.override_name

    def calc_raw_time(self):
        try:
            if len(self.times.filter(tap='Start')) > 1 or len(self.times.filter(tap='Finish')) > 1:
                return 0

            if self.did_not_start or self.did_not_finish or self.disqualified:
                return 0

            start = self.times.get(tap='Start').time_tap
            end = self.times.get(tap='Finish').time_tap

            return end - start
        
        except RaceTime.DoesNotExist:
            return 0

    def calc_race_time(self):
        # The race time can include the penalty as by default it is 0
        return self.raw_time + self.penalty*1000

    def calc_published_time(self):
        # If overall time has been overriden - use the override time + penalty otherwise use race_time
        if self.manual_override_time > 0:
            return self.manual_override_time + self.penalty*1000
        return self.race_time

    def calc_overall_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', published_time__gt=0, published_time__lt=self.published_time)
        return len(crews) + 1

    def calc_gender_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', event__gender__exact=self.event.gender, published_time__gt=0, published_time__lt=self.published_time)
        return len(crews) + 1


    def calc_category_position_time(self):
        # This property created purely for use when calculating position in category ranking.  It uses the published time or masters adjusted time if one exists.
        if self.masters_adjusted_time is not None and self.masters_adjusted_time > 0:
            return self.masters_adjusted_time + self.penalty*1000
        return self.published_time

    def calc_category_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', time_only__exact=False, event_band__exact=self.event_band, published_time__gt=0, category_position_time__lt=self.category_position_time)
        if self.time_only:
            return 0

        return len(crews) + 1

    def get_start_time(self):
        try:
            if len(self.times.filter(tap='Start')) > 1:
                return 0

            start = self.times.get(tap='Start').time_tap
            return start

        except RaceTime.DoesNotExist:
            return 0

    def get_finish_time(self):
        try:
            if len(self.times.filter(tap='Finish')) > 1:
                return 0
            finish = self.times.get(tap='Finish').time_tap
            return finish

        except RaceTime.DoesNotExist:
            return 0
    
    def get_invalidated_times(self):
        try:

            if len(self.times.filter(tap='Start')) > 1:
                return 1
            if len(self.times.filter(tap='Finish')) > 1:
                return 1

        except RaceTime.DoesNotExist:
            return 0

    def get_competitor_names(self):
        if not self.competitors:
            return 0

        competitor_list = list(map(lambda competitor: competitor.last_name, self.competitors.all()))
        value = ' / '.join(competitor_list)
        return value

    def get_start_sequence(self):
        try:
            if len(self.times.filter(tap='Start')) > 1:
                return 0
            sequence = self.times.get(tap='Start').sequence
            return sequence
        except RaceTime.DoesNotExist:
            return 0

    def get_finish_sequence(self):
        try:
            if len(self.times.filter(tap='Finish')) > 1:
                return 0
            sequence = self.times.get(tap='Finish').sequence
            return sequence

        except RaceTime.DoesNotExist:
            return 0

# Turn the three manual override fields into miliseconds
    @property
    def manual_override_time(self):
        time = (self.manual_override_minutes*60*1000) + (self.manual_override_seconds*1000) + (self.manual_override_hundredths_seconds*10)
        return time

# Calculate masters adjusted time - only applies to categories that have a mix of different masters categories
# Denoted by a '/' in the event.override_name
# Masters adjustments are looked up from the MastersAdjustment table (imported)
# Need to calculate the fastest time in race type

    def get_masters_adjustment(self):

        if not OriginalEventCategory.objects.filter(event_original='2x').exists():
            go = None

        if not RaceTime.objects.filter(sequence=1).exists():
            go = None

        else:
            go = 1
            # print('python thinks go is 1')

        if go is not None:
            # print('python has started to run the calcs')
            if self.event_band is not None and '/' in str(self.event_band) and self.event.type == 'Master':
                fastest_men_scull = Crew.objects.all().filter(event_band__startswith='Op', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
                fastest_men_sweep = Crew.objects.all().filter(event_band__startswith='Op', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time')) or 0
                fastest_female_scull = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
                fastest_female_sweep = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time')) or 0
                fastest_mixed_scull = Crew.objects.all().filter(event_band__startswith='Mx', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0

                # print('The masters adjustment calculation is running ...')

                # Fastest men's scull (2x)

                if 'MasB' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasB', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasC' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasC', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasD' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasD', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasE' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasE', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasF' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasF', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasG' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasG', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasH' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasH', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasI' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasI', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasJ' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasJ', standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment


                # Fastest men's sweep (2-)

                if 'MasB' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasB', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasC' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasC', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasD' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasD', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasE' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasE', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasF' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasF', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasG' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasG', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasH' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasH', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasI' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasI', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasJ' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Open':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasJ', standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment


                # Fastest women's scull (2x)

                if 'MasB' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasB', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasC' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasC', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasD' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasD', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasE' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasE', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasF' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasF', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasG' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasG', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasH' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasH', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasI' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasI', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasJ' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasJ', standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment


                # Fastest women's sweep (2-)

                if 'MasB' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasB', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasC' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasC', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasD' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasD', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasE' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasE', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasF' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasF', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasG' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasG', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasH' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasH', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasI' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasI', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasJ' in self.event_original.first().event_original and '2-' in self.event_original.first().event_original and self.event.gender == 'Female':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasJ', standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment


                    # Fastest mixed scull (2x)

                if 'MasB' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasB', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasC' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasC', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasD' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasD', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasE' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasE', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasF' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasF', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasG' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasG', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasH' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasH', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasI' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasI', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

                if 'MasJ' in self.event_original.first().event_original and '2x' in self.event_original.first().event_original and self.event.gender == 'Mixed':
                    try:
                        adjustment = MastersAdjustment.objects.get(master_category='MasJ', standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                    except MastersAdjustment.DoesNotExist:
                        adjustment = 0
                    return adjustment

            else:
                return 0



# Add the masters adjusted time into adjusted time
    @property
    def masters_adjusted_time(self):
        if self.masters_adjustment == 0 or self.masters_adjustment is None:
            return 0

        adjusted_time = self.race_time - self.masters_adjustment
        return adjusted_time


class Competitor(models.Model):
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=10)
    substitution = models.BooleanField(blank=True, null=True,)
    crew = models.ForeignKey(Crew, related_name='competitors',
    on_delete=models.SET_NULL, blank=True, null=True,)

class RaceTime(models.Model):
    sequence = models.IntegerField()
    bib_number = models.IntegerField(blank=True, null=True,)
    tap = models.CharField(max_length=10)
    time_tap = models.BigIntegerField()
    crew = models.ForeignKey(Crew, related_name='times',
    on_delete=models.SET_NULL, blank=True, null=True,)

class MastersAdjustment(models.Model):
    standard_time_label = models.CharField(max_length=5)
    standard_time_ms = models.BigIntegerField()
    master_category = models.CharField(max_length=4)
    master_time_adjustment_ms = models.BigIntegerField()

class OriginalEventCategory(models.Model):
    crew = models.ForeignKey(Crew, related_name='event_original',
    on_delete=models.SET_NULL, blank=True, null=True,)
    event_original = models.CharField(max_length=30)
