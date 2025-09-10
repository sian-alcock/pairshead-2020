export type TimeProps = {
  id: number;
  sequence: number;
  finish_time?: number | null;
  start_time?: number | null;
  synchronized_time: number;
  tap: "Start" | "Finish";
  time_tap: number;
  bib_number?: number;
  crew?: CrewProps | null;
  race?: RaceProps | null;
};

export type ClubProps = {
  abbreviation: string;
  blade_image: string;
  colours: string;
  id: number;
  name: string;
  index_code: string;
};

export type EventProps = {
  gender: string;
  id: number;
  info: string;
  name: string;
  override_name: string;
  type: string;
};

export type BandProps = {
  id: number;
  name: string;
  event: EventProps;
};

export type CrewProps = {
  gender: string;
  race_id_start_override: number | null;
  race_id_finish_override: number | null;
  category_position_time: number;
  id: number;
  name: string;
  bib_number?: string;
  competitor_names: string;
  status: string;
  start_sequence?: number | null;
  finish_sequence?: number | null;
  event_band?: "string";
  composite_code?: "string";
  penalty: number;
  start_time?: number | null;
  finish_time?: number | null;
  raw_time?: number | null;
  race_time?: number | null;
  published_time?: number | null;
  manual_override_minutes: number;
  manual_override_seconds: number;
  manual_override_hundredths_seconds: number;
  manual_override_time?: number | null;
  disqualified?: boolean;
  did_not_start?: boolean;
  did_not_finish?: boolean;
  time_only: string;
  overall_rank: number;
  category_rank: number;
  gender_rank: number;
  band?: BandProps;
  event: EventProps;
  masters_adjustment?: number;
  masters_adjusted_time?: number;
  club: ClubProps;
  times: TimeProps[];
  event_original?: EventOriginalProps[];
  event_order?: number;
  sculling_CRI?: number;
  rowing_CRI?: number;
  draw_start_score?: number;
  calculated_start_order?: number;
  host_club?: {
    name: string;
  };
  number_location?: string;
  marshalling_division?: string;
  requires_ranking_update: boolean;
};

export type CrewFormData = {
  // Basic crew info
  id?: number;
  name?: string;
  bib_number?: string;
  competitor_names?: string;

  // Timing data
  category_position_time?: number;
  penalty?: number;
  manual_override_minutes?: number;
  manual_override_seconds?: number;
  manual_override_hundredths_seconds?: number;
  start_time?: string;
  finish_time?: string;
  raw_time?: string;

  // Status flags
  time_only?: boolean;
  did_not_start?: boolean;
  did_not_finish?: boolean;
  disqualified?: boolean;

  // Band/event info
  band?: {
    id: number;
    value: number;
  };

  // Division/category info
  marshalling_division?: string;
  times: TimeProps[];
  race_id_start_override?: number | null;
  race_id_finish_override?: number | null;
};

export type EventOriginalProps = {
  crew: number;
  event_original: string;
};

export type KeyProps = {
  id: number;
  event_meeting_key: string;
  event_meeting_name: string;
  current_event_meeting: boolean;
};

export type NumberLocationProps = {
  club: string;
  number_location?: string;
  id: number;
};

export type TimingOffsetProps = {
  id?: number;
  reference_race: number;
  target_race: number;
  timing_offset_ms: number;
};

export type RaceInfoProps = {
  id: number;
  broe_data_last_update: string;
  pre_race_mode: boolean;
};

export type RaceProps = {
  is_timing_reference: any;
  race_id: number;
  id: number;
  name: string;
  default_start: boolean;
  default_finish: boolean;
};

export type DataStats = {
  races_count: number;
  total_crews_count: number;
  accepted_crews_count: number;
  race_times_count: number;
  races_with_start_times: number;
  races_with_finish_times: number;
  missing_times_count: number;
  masters_crews_count: number;
  original_event_categories_imported: number;
  event_order_count: number;
  crews_with_start_order_count: number;
  scratched_crews_count: number;
  withdrawn_crews_count: number;
  submitted_crews_count: number;
  marshalling_divisions_count: number;
  number_locations_count: number;
  last_updated: string;
};

export type EventMeetingKey = {
  id?: number;
  event_meeting_key: string;
  event_meeting_name: string;
  current_event_meeting: boolean;
};

export type PaginatedResponse<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};
