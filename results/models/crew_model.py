from django.db import models
from django.db.models import Min

from .club_model import Club
from .band_model import Band
from .event_model import Event
from .masters_adjustment_model import MastersAdjustment
from .event_order_model import EventOrder
from .marshalling_division_model import MarshallingDivision
from .number_location_model import NumberLocation
from .global_settings_model import GlobalSettings

class Crew(models.Model):
    created = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated = models.DateTimeField(auto_now=True, blank=True, null=True)
    name = models.CharField(max_length=50)
    id = models.IntegerField(primary_key=True)
    composite_code = models.CharField(max_length=10, blank=True, null=True)
    club = models.ForeignKey(Club, related_name='crews',
    on_delete=models.CASCADE)
    host_club = models.ForeignKey(Club, related_name='hosted_crews',
    on_delete=models.SET_NULL, blank=True, null=True, default=None)
    rowing_CRI = models.IntegerField(blank=True, null=True)
    sculling_CRI = models.IntegerField(blank=True, null=True)
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

    # The following fields are only populated to run the On the day contact report
    # Importing for the results will set these to null
    otd_contact = models.CharField(max_length=50, blank=True, null=True)
    otd_home_phone = models.CharField(max_length=20, blank=True, null=True)
    otd_mobile_phone = models.CharField(max_length=20, blank=True, null=True)
    otd_work_phone = models.CharField(max_length=20, blank=True, null=True)


    # Calculated fields
    event_band = models.CharField(max_length=40, null=True)
    raw_time = models.IntegerField(blank=True, null=True)
    race_time = models.IntegerField(blank=True, null=True)
    published_time = models.IntegerField(blank=True, null=True)
    start_time = models.IntegerField(blank=True, null=True)
    finish_time = models.IntegerField(blank=True, null=True)
    overall_rank = models.IntegerField(blank=True, null=True)
    gender_rank = models.IntegerField(blank=True, null=True)
    category_position_time = models.IntegerField(blank=True, null=True)
    category_rank = models.IntegerField(blank=True, null=True)
    masters_adjustment = models.IntegerField(blank=True, null=True)
    invalid_time = models.IntegerField(blank=True, null=True)
    start_sequence = models.IntegerField(blank=True, null=True)
    finish_sequence = models.IntegerField(blank=True, null=True)
    draw_start_score = models.DecimalField(blank=True, null=True, max_digits=9, decimal_places=4)
    calculated_start_order = models.IntegerField(blank=True, null=True)
    crew_timing_offset = models.IntegerField(blank=True, null=True, default=0)


    def __str__(self):
        return self.name
    
    # Get offset if there is one
    def save(self, *args, **kwargs):
        self.crew_timing_offset = self.calc_crew_timing_offset()
        super(Crew, self).save(*args, **kwargs)
    
    def calc_crew_timing_offset(self):
        settings = GlobalSettings.objects.all()
        for setting in settings:
            setting.save()

        if GlobalSettings.objects.filter(timing_offset__gt=0).exists():
            offset_record = GlobalSettings.objects.filter(timing_offset__gt=0)[0]
            if offset_record.timing_offset_positive:
                offset = offset_record.timing_offset
            else:
                offset = 0 - offset_record.timing_offset
        else: 
            offset = 0

        return offset
        
    # Event band
    def save(self, *args, **kwargs):
        self.event_band = self.calc_event_band()
        super(Crew, self).save(*args, **kwargs)
    
    def calc_event_band(self):
        return str(self.event.override_name) + ' ' + str(self.band.name) if self.band else self.event.override_name
    

    # Raw time
    def save(self, *args, **kwargs):
        self.raw_time = self.calc_raw_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_raw_time(self):

        try:
            if len(self.times.filter(tap='Start')) > 1 or len(self.times.filter(tap='Finish')) > 1:
                return 0

            if self.did_not_start or self.did_not_finish or self.disqualified:
                return 0

            start = self.times.get(tap='Start').time_tap
            end = self.times.get(tap='Finish').time_tap

            if self.crew_timing_offset:
                end = end + self.crew_timing_offset

            return end - start
        
        except RaceTime.DoesNotExist:
            return 0
    
    # Race time
    def save(self, *args, **kwargs):
        self.race_time = self.calc_race_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_race_time(self):
        try:
            # The race time can include the penalty as by default it is 0
            return self.raw_time + self.penalty*1000
        except RaceTime.DoesNotExist:
            return 0
    
    # Published time
    def save(self, *args, **kwargs):
        self.published_time = self.calc_published_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_published_time(self):
        # If overall time has been overriden - use the override time + penalty otherwise use race_time
        if self.manual_override_time > 0:
            return self.manual_override_time + self.penalty*1000
        return self.race_time

    # Start time
    def save(self, *args, **kwargs):
        self.start_time = self.calc_start_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_start_time(self):
        try:
            if len(self.times.filter(tap='Start')) > 1:
                return 0

            start = self.times.get(tap='Start').time_tap
            return start
        except RaceTime.DoesNotExist:
            return 0
    
    # Finish time
    def save(self, *args, **kwargs):
        self.finish_time = self.calc_finish_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_finish_time(self):
        try:
            if len(self.times.filter(tap='Finish')) > 1:
                return 0
            finish = self.times.get(tap='Finish').time_tap
            return finish
        except RaceTime.DoesNotExist:
            return 0
    
    # Overall rank
    def save(self, *args, **kwargs):
        self.overall_rank = self.calc_overall_rank()
        super(Crew, self).save(*args, **kwargs)

    def calc_overall_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', published_time__gt=0, published_time__lt=self.published_time)
        return len(crews) + 1

    # Gender rank
    def save(self, *args, **kwargs):
        self.gender_rank = self.calc_gender_rank()
        super(Crew, self).save(*args, **kwargs)

    def calc_gender_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', event__gender__exact=self.event.gender, published_time__gt=0, published_time__lt=self.published_time)
        return len(crews) + 1

    # Category position time
    def save(self, *args, **kwargs):
        self.category_position_time = self.calc_category_position_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_category_position_time(self):
        # This property created purely for use when calculating position in category ranking.  It uses the published time or masters adjusted time if one exists.
        if self.masters_adjusted_time is not None and self.masters_adjusted_time > 0:
            return self.masters_adjusted_time + self.penalty*1000
        return self.published_time
    
    # Category rank
    def save(self, *args, **kwargs):
        self.category_rank = self.calc_category_rank()
        super(Crew, self).save(*args, **kwargs)

    def calc_category_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', time_only__exact=False, event_band__exact=self.event_band, published_time__gt=0, category_position_time__lt=self.category_position_time)
        if self.time_only:
            return 0

        return len(crews) + 1
    
    # Invalid time
    def save(self, *args, **kwargs):
        self.invalid_time = self.calc_invalid_time()
        super(Crew, self).save(*args, **kwargs)

    def calc_invalid_time(self):
        if len(self.times.filter(tap='Start')) > 1:
            return 1
        if len(self.times.filter(tap='Finish')) > 1:
            return 1

    # Start sequence
    def save(self, *args, **kwargs):
        self.start_sequence = self.calc_start_sequence()
        super(Crew, self).save(*args, **kwargs)

    def calc_start_sequence(self):
        try:
            if len(self.times.filter(tap='Start')) > 1:
                return 0
            sequence = self.times.get(tap='Start').sequence
            return sequence
        except RaceTime.DoesNotExist:
            return 0
    
    # Finish sequence
    def save(self, *args, **kwargs):
        self.finish_sequence = self.calc_finish_sequence()
        super(Crew, self).save(*args, **kwargs)

    def calc_finish_sequence(self):
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
    @property
    def competitor_names(self):
        if not self.competitors:
            return 0

        competitor_list = list(map(lambda competitor: competitor.last_name, self.competitors.all()))
        value = ' / '.join(competitor_list)
        return value

# Calculate masters adjusted time - only applies to categories that have a mix of different masters categories
# Denoted by a '/' in the event.override_name
# Masters adjustments are looked up from the MastersAdjustment table (imported)
# Need to calculate the fastest time in race type
    
    # Masters adjustment
    def save(self, *args, **kwargs):
        self.masters_adjustment = self.calc_masters_adjustment()
        super(Crew, self).save(*args, **kwargs)
        
    def calc_masters_adjustment(self):

        if not OriginalEventCategory.objects.filter(event_original='2x').exists():
            return 0

        elif self.event_band is not None and '/' in str(self.event_band) and self.event.type == 'Master' and self.raw_time > 0:
            fastest_men_scull = Crew.objects.all().filter(event_band__startswith='Op', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_men_sweep = Crew.objects.all().filter(event_band__startswith='Op', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_female_scull = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_female_sweep = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_mixed_scull = Crew.objects.all().filter(event_band__startswith='Mx', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            # print('Fastest men scull')
            # print(fastest_men_scull)
            # print('Fastest men sweep')
            # print(fastest_men_sweep)
            # print('Fastest female scull')
            # print(fastest_female_scull)
            # print('Fastest female sweep')
            # print(fastest_female_sweep)
            # print('Fastest mixed scull')
            # print(fastest_mixed_scull)

            # Mens 2x (scull)
            if fastest_men_scull['raw_time__min'] is not None and self.event.gender == 'Open' and '2x' in self.event_original.first().event_original:
                master_category = self.event_original.first().event_original[:4]
                
                try:
                    adjustment = MastersAdjustment.objects.get(master_category=master_category, standard_time_ms=round(int(fastest_men_scull['raw_time__min']), -3)).master_time_adjustment_ms
                except MastersAdjustment.DoesNotExist:
                    adjustment = 0
                return adjustment
            # Mens 2- (sweep)
            elif fastest_men_sweep['raw_time__min'] is not None and self.event.gender == 'Open' and '2-' in self.event_original.first().event_original:
                master_category = self.event_original.first().event_original[:4]
                
                try:
                    adjustment = MastersAdjustment.objects.get(master_category=master_category, standard_time_ms=round(int(fastest_men_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                except MastersAdjustment.DoesNotExist:
                    adjustment = 0
                return adjustment
            # Female 2x (scull)
            elif fastest_female_scull['raw_time__min'] is not None and self.event.gender == 'Female' and '2x' in self.event_original.first().event_original:
                master_category = self.event_original.first().event_original[2:6]
                
                try:
                    adjustment = MastersAdjustment.objects.get(master_category=master_category, standard_time_ms=round(int(fastest_female_scull['raw_time__min']), -3)).master_time_adjustment_ms
                except MastersAdjustment.DoesNotExist:
                    adjustment = 0
                return adjustment
            # Female 2- (sweep)
            elif fastest_female_sweep['raw_time__min'] is not None and self.event.gender == 'Female' and '2-' in self.event_original.first().event_original:
                master_category = self.event_original.first().event_original[2:6]
                
                try:
                    adjustment = MastersAdjustment.objects.get(master_category=master_category, standard_time_ms=round(int(fastest_female_sweep['raw_time__min']), -3)).master_time_adjustment_ms
                except MastersAdjustment.DoesNotExist:
                    adjustment = 0
                return adjustment
            # Mixed 2x (scull)
            elif fastest_mixed_scull['raw_time__min'] is not None and self.event.gender == 'Mixed' and '2x' in self.event_original.first().event_original:
                master_category = self.event_original.first().event_original[3:7]
                
                try:
                    adjustment = MastersAdjustment.objects.get(master_category=master_category, standard_time_ms=round(int(fastest_mixed_scull['raw_time__min']), -3)).master_time_adjustment_ms
                except MastersAdjustment.DoesNotExist:
                    adjustment = 0
                return adjustment

        else:
            return 0
        
# Calculate the draw start score (event order plus rowing / sculling CRI as appropriate)

    def save(self, *args, **kwargs):
        self.draw_start_score = self.calc_draw_start_score()
        super(Crew, self).save(*args, **kwargs)
    
    def calc_draw_start_score(self):
        if not EventOrder.objects.filter(event_order=1).exists():
            return None
        if not self.event_band:
            return None
        if '2x' in self.event_band:
            crewsWithHigherScullingCRIInCategory = Crew.objects.all().filter(status__exact='Accepted', event_band__exact=self.event_band, sculling_CRI__gt=self.sculling_CRI)
            row_score = (len(crewsWithHigherScullingCRIInCategory) + 1) / 1000
        elif '2-' in self.event_band:
            crewsWithHigherRowingCRIInCategory = Crew.objects.all().filter(status__exact='Accepted', event_band__exact=self.event_band, rowing_CRI__gt=self.rowing_CRI)
            row_score = (len(crewsWithHigherRowingCRIInCategory) + 1) / 1000
            
        try:
            draw_start_score = EventOrder.objects.get(event=self.event_band).event_order + row_score
        except EventOrder.DoesNotExist:
            draw_start_score = 0
        return draw_start_score
    
# Calculate the draw start order
    def save(self, *args, **kwargs):
        self.calculated_start_order = self.calc_calculated_start_order()
        super(Crew, self).save(*args, **kwargs)
    
    def calc_calculated_start_order(self):
        if not self.draw_start_score or self.draw_start_score == 0 or self.draw_start_score == None:
            return 9999999

        crews_with_lower_score = Crew.objects.all().filter(status__exact='Accepted', draw_start_score__gt=0, draw_start_score__lt=self.draw_start_score)
        crews_with_same_score = Crew.objects.all().filter(status__exact='Accepted', draw_start_score__gt=0, draw_start_score=self.draw_start_score).order_by('name')
        
        if crews_with_same_score.exists() and len(crews_with_same_score) > 1:
            position = len(crews_with_lower_score) + 1 + list(crews_with_same_score).index(self)
        else:
            position = len(crews_with_lower_score) + 1
        
        return position

# Look up the event order number
    @property
    def event_order(self):
        return EventOrder.objects.get(event=self.event_band).event_order

# Add the masters adjusted time into adjusted time
    @property
    def masters_adjusted_time(self):
        if self.masters_adjustment == 0 or self.masters_adjustment is None:
            return 0

        adjusted_time = self.race_time - self.masters_adjustment
        return adjusted_time

# Look up marshalling division
    @property
    def marshalling_division(self):
        bib = self.bib_number
        if bib:
            return MarshallingDivision.objects.get(bottom_range__lte=bib, top_range__gte=bib).name
        elif self.calculated_start_order:
            return MarshallingDivision.objects.get(bottom_range__lte=self.calculated_start_order, top_range__gte=self.calculated_start_order).name

# Look up number location
    @property
    def number_location(self):
        club_name = self.host_club.name
        try:
            number_location = NumberLocation.objects.get(club__exact=club_name).number_location
        except NumberLocation.DoesNotExist:
            number_location = None
        return number_location


class RaceTime(models.Model):
    sequence = models.IntegerField()
    bib_number = models.IntegerField(blank=True, null=True,)
    tap = models.CharField(max_length=10)
    time_tap = models.BigIntegerField()
    crew = models.ForeignKey(Crew, related_name='times',
    on_delete=models.SET_NULL, blank=True, null=True,)

class OriginalEventCategory(models.Model):
    crew = models.ForeignKey(Crew, related_name='event_original',
    on_delete=models.SET_NULL, blank=True, null=True,)
    event_original = models.CharField(max_length=30)