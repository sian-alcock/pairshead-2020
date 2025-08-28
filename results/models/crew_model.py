from django.db import models, transaction
from django.db.models.signals import post_save, post_delete
from django.db.models import Min, Avg
from django.dispatch import receiver

from .club_model import Club
from .band_model import Band
from .event_model import Event
from .masters_adjustment_model import MastersAdjustment
from .event_order_model import EventOrder
from .marshalling_division_model import MarshallingDivision
from .number_location_model import NumberLocation
from .global_settings_model import GlobalSettings
from .race_model import Race, RaceTimingSync

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
    race_id_start_override = models.ForeignKey(Race, related_name='crew_override_start',
    on_delete=models.SET_NULL, blank=True, null=True)
    race_id_finish_override = models.ForeignKey(Race, related_name='crew_override_finish',
    on_delete=models.SET_NULL, blank=True, null=True)

    # The following fields are only populated to run the On the day contact report
    # Importing for the results will set these to null
    otd_contact = models.CharField(max_length=50, blank=True, null=True)
    otd_home_phone = models.CharField(max_length=20, blank=True, null=True)
    otd_mobile_phone = models.CharField(max_length=20, blank=True, null=True)
    otd_work_phone = models.CharField(max_length=20, blank=True, null=True)
    submitting_administrator_email = models.CharField(max_length=50, blank=True, null=True)


    # Calculated fields - start
    draw_start_score = models.DecimalField(blank=True, null=True, max_digits=9, decimal_places=4)
    calculated_start_order = models.IntegerField(blank=True, null=True)
    
    # Calculated fields - calculated on import
    event_band = models.CharField(max_length=40, null=True)
    competitor_names = models.CharField(max_length=60, blank=True, null=True)

    # Calculated fields - results (need updating when data changes)
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
    start_sequence = models.IntegerField(blank=True, null=True)
    finish_sequence = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return self.name

    # Save calculated fields
    def save(self, *args, **kwargs):
        """
        Combined save method that calculates all computed fields
        """
        # Calculate all the computed fields
        self.event_band = self.calc_event_band()
    
        # Call the parent save method
        super(Crew, self).save(*args, **kwargs)

    def update_computed_properties(self, save=True):
        """Update all computed properties for this crew."""
        self.raw_time = self.calc_raw_time()
        self.race_time = self.calc_race_time()
        self.published_time = self.calc_published_time()
        self.start_time = self.calc_start_time()
        self.finish_time = self.calc_finish_time()
        self.overall_rank = self.calc_overall_rank()
        self.gender_rank = self.calc_gender_rank()
        self.category_position_time = self.calc_category_position_time()
        self.category_rank = self.calc_category_rank()
        self.start_sequence = self.calc_start_sequence()
        self.finish_sequence = self.calc_finish_sequence()
        self.masters_adjustment = self.calc_masters_adjustment()
        
        if save:
            self.save()
    
    @classmethod
    def update_all_computed_properties(cls):
        """Update computed properties for all crews."""
        for crew in cls.objects.all():
            crew.update_computed_properties()

    
    # Event band
    def calc_event_band(self):
        return str(self.event.override_name) + ' ' + str(self.band.name) if self.band else self.event.override_name
    

    def calc_raw_time(self):
        """
        Calculate raw time (finish - start) with proper timing synchronization.
        Returns time in milliseconds.
        """
        try:
            # Get the default start and finish races
            race_default_start = Race.objects.get(default_start=True)
            race_default_finish = Race.objects.get(default_finish=True)
        except Race.DoesNotExist:
            # If no default races are set, return 0
            return 0

        try:
            if self.did_not_start or self.did_not_finish or self.disqualified:
                return 0

            # Get start and finish times for this crew from the appropriate races
            if self.race_id_start_override:
                start_time_record = self.times.get(tap="Start", race=self.race_id_start_override)
            else:
                start_time_record = self.times.get(tap='Start', race=race_default_start)

            if self.race_id_finish_override:
                finish_time_record = self.times.get(tap="Finish", race=self.race_id_finish_override)
            else:
                finish_time_record = self.times.get(tap='Finish', race=race_default_finish)

            # Get the races for timing synchronization
            start_race = start_time_record.race
            finish_race = finish_time_record.race

            # Get synchronized times
            synchronized_start = self._get_synchronized_time(start_time_record.time_tap, start_race)
            synchronized_finish = self._get_synchronized_time(finish_time_record.time_tap, finish_race)

            return synchronized_finish - synchronized_start
        
        except RaceTime.DoesNotExist:
            # Return 0 if start or finish time records don't exist
            return 0

    def _get_synchronized_time(self, raw_time_ms, source_race):
        """
        Helper method to get synchronized time for a given race.
        If the race is the timing reference, return the raw time.
        Otherwise, apply the timing offset.
        """
        # If this race is the timing reference, no adjustment needed
        if source_race.is_timing_reference:
            return raw_time_ms
        
        try:
            # Look for a sync record where this race is the target
            sync_record = RaceTimingSync.objects.get(target_race=source_race)
            synchronized_time = raw_time_ms + sync_record.timing_offset_ms
            return synchronized_time
        except RaceTimingSync.DoesNotExist:
            # If no sync record exists, treat this race as already synchronized
            # This handles the case where races are already in sync or no sync is needed
            return raw_time_ms
        
        # Race time
    def calc_race_time(self):
        try:
            # The race time can include the penalty as by default it is 0
            return self.raw_time + self.penalty*1000
        except RaceTime.DoesNotExist:
            return 0
    
    # Published time
    def calc_published_time(self):
        # If overall time has been overriden - use the override time + penalty otherwise use race_time
        if self.manual_override_time > 0:
            return self.manual_override_time + self.penalty*1000
        return self.race_time

    # Start time
    def calc_start_time(self):
        try:
            race_default_start = Race.objects.get(default_start=True)
            start_time_record = self.times.get(tap='Start', race=race_default_start)
            return start_time_record.time_tap
        except (Race.DoesNotExist, RaceTime.DoesNotExist):
            return 0
    
    # Finish time
    def calc_finish_time(self):
        try:
            race_default_finish = Race.objects.get(default_finish=True)
            finish_time_record = self.times.get(tap='Finish', race=race_default_finish)
            return finish_time_record.time_tap
        except (Race.DoesNotExist, RaceTime.DoesNotExist):
            return 0
    
    # Overall rank
    def calc_overall_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', published_time__gt=0, published_time__lt=self.published_time)
        return len(crews) + 1

    # Gender rank
    def calc_gender_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', event__gender__exact=self.event.gender, published_time__gt=0, published_time__lt=self.published_time)
        return len(crews) + 1

    # Category position time
    def calc_category_position_time(self):
        # This property created purely for use when calculating position in category ranking.  It uses the published time or masters adjusted time if one exists.
        if self.masters_adjusted_time is not None and self.masters_adjusted_time > 0:
            return self.masters_adjusted_time + self.penalty*1000
        return self.published_time
    
    # Category rank
    def calc_category_rank(self):
        crews = Crew.objects.all().filter(status__exact='Accepted', time_only__exact=False, event_band__exact=self.event_band, published_time__gt=0, category_position_time__lt=self.category_position_time)
        if self.time_only:
            return 0

        return len(crews) + 1

    # Start sequence
    def calc_start_sequence(self):
        race_default_start = Race.objects.filter(default_start=True).first()
        if not race_default_start:
            return 0
        
        sequence_record = self.times.filter(tap='Start', race=race_default_start).first()
        return sequence_record.sequence if sequence_record else 0
    
    # Finish sequence
    def calc_finish_sequence(self):
        race_default_finish = Race.objects.filter(default_finish=True).first()
        if not race_default_finish:
            return 0
        
        sequence_record = self.times.filter(tap='Finish', race=race_default_finish).first()
        return sequence_record.sequence if sequence_record else 0
        
    # Competitor names
    def get_competitor_names(self):
        if not self.competitors:
            return 0

        competitor_list = list(map(lambda competitor: competitor.last_name, self.competitors.all()))
        value = ' / '.join(competitor_list)
        return value

# Turn the three manual override fields into miliseconds
    @property
    def manual_override_time(self):
        time = (self.manual_override_minutes*60*1000) + (self.manual_override_seconds*1000) + (self.manual_override_hundredths_seconds*10)
        return time


# Calculate masters adjusted time - only applies to categories that have a mix of different masters categories
# Denoted by a '/' in the event.override_name
# Masters adjustments are looked up from the MastersAdjustment table (imported)
# Need to calculate the fastest time in race type
    
    # Masters adjustment
    def calc_masters_adjustment(self):

        if not OriginalEventCategory.objects.filter(event_original='2x').exists():
            return 0

        elif self.event_band is not None and '/' in str(self.event_band) and self.event.type == 'Master' and self.raw_time > 0:
            fastest_men_scull = Crew.objects.all().filter(event_band__startswith='Op', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_men_sweep = Crew.objects.all().filter(event_band__startswith='Op', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_female_scull = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_female_sweep = Crew.objects.all().filter(event_band__startswith='W', event_band__contains='2-', raw_time__gt=0).aggregate(Min('raw_time')) or 0
            fastest_mixed_scull = Crew.objects.all().filter(event_band__startswith='Mx', event_band__contains='2x', raw_time__gt=0).aggregate(Min('raw_time')) or 0
 

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
    
    def calc_draw_start_score(self):
        # Check if EventOrder data exists
        if not EventOrder.objects.exists():
            print(f"No EventOrder data found for crew {self.id}")
            return None
            
        if not self.event_band:
            print(f"No event_band for crew {self.id}")
            return None
        
        row_score = 0  # Default value
        
        try:
            # Calculate the rowing/sculling ranking component
            if '2x' in self.event_band:
                if self.sculling_CRI is not None:
                    crews_with_higher_cri = Crew.objects.filter(
                        status__exact='Accepted', 
                        event_band__exact=self.event_band, 
                        sculling_CRI__gt=self.sculling_CRI
                    )
                    row_score = (crews_with_higher_cri.count() + 1) / 1000
                else:
                    print(f"No sculling_CRI for crew {self.id}")
                    return None
                    
            elif '2-' in self.event_band:
                if self.rowing_CRI is not None:
                    crews_with_higher_cri = Crew.objects.filter(
                        status__exact='Accepted', 
                        event_band__exact=self.event_band, 
                        rowing_CRI__gt=self.rowing_CRI
                    )
                    row_score = (crews_with_higher_cri.count() + 1) / 1000
                else:
                    print(f"No rowing_CRI for crew {self.id}")
                    return None
            else:
                # Event band doesn't match expected patterns
                print(f"Unrecognized event_band pattern for crew {self.id}: {self.event_band}")
                row_score = 0.001  # Small default value
            
            # Get the event order base score
            try:
                event_order_obj = EventOrder.objects.get(event=self.event_band)
                draw_start_score = event_order_obj.event_order + row_score
                print(f"Crew {self.id}: event_order={event_order_obj.event_order}, row_score={row_score}, total={draw_start_score}")
                return draw_start_score
            except EventOrder.DoesNotExist:
                print(f"No EventOrder found for event_band: {self.event_band}")
                return None
                
        except Exception as e:
            print(f"Error calculating draw_start_score for crew {self.id}: {e}")
            return None
    
    @classmethod
    def update_start_order_calcs(cls):
        """Update draw_start_score and calculated_start_order for all accepted crews"""
        crews = cls.objects.filter(status__exact='Accepted')
        
        print(f"Found {crews.count()} accepted crews to update")
        
        # Step 1: Calculate draw_start_score for all crews
        crew_scores = []
        for crew in crews:
            draw_score = crew.calc_draw_start_score()
            crew.draw_start_score = draw_score
            crew_scores.append((crew, draw_score))
        
        # Step 2: Sort crews by draw_start_score (lower scores = better start position)
        crew_scores.sort(key=lambda x: (x[1] is None, x[1] if x[1] is not None else float('inf'), x[0].name))
        
        # Step 3: Assign calculated_start_order based on sorted position
        for position, (crew, score) in enumerate(crew_scores, start=1):
            if score is None or score == 0:
                crew.calculated_start_order = 9999999
            else:
                crew.calculated_start_order = position
        
        # Step 4: Save all updates
        crews_to_update = [crew for crew, _ in crew_scores]
        cls.objects.bulk_update(crews_to_update, ['draw_start_score', 'calculated_start_order'])
        
        print(f"Updated start orders for {len(crews_to_update)} crews")
        return len(crews_to_update)


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
    race = models.ForeignKey(Race, related_name='race_times', on_delete=models.CASCADE, blank=True, null=True,)
    
    @property
    def synchronized_time(self):
        """
        Get the time synchronized to the reference timing system.
        """
        if self.race:
            return self.race.get_synchronized_time(self.time_tap)
        return self.time_tap

class OriginalEventCategory(models.Model):
    crew = models.ForeignKey(Crew, related_name='event_original',
    on_delete=models.SET_NULL, blank=True, null=True,)
    event_original = models.CharField(max_length=30)