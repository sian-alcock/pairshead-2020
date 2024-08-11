export type TimeProps = {
  id: number;
  sequence: number;
  tap: 'Start' | 'Finish';
  time_tap: number;
  crew: number;
}
  
export type ClubProps = {
  abbreviation: string;
  blade_image: string;
  colours: string;
  id: number;
  name: string;
  index_code: string;
}
  
export type EventProps = {
  gender: string;
  id: number;
  info: string;
  name: string;
  override_name: string;
  type: string;
}
  
export type CrewProps = {
  id: string;
  name: string;
  bib_number?: string;
  competitor_names: string;
  status: string;
  start_sequence?: number | null;
  finish_sequence?: number | null;
  event_band?: 'string';
  composite_code?: 'string';
  penalty: number;
  start_time?: number | null;
  finish_time?: number | null;
  raw_time?: number | null;
  race_time?: number | null;
  published_time?: number | null;
  manual_override_time?: number | null;
  disqualified?: boolean;
  did_not_start?: boolean;
  did_not_finish?: boolean;
  time_only: string;
  overall_rank: number;
  category_rank: number;
  gender_rank: number;
  event: EventProps;
  masters_adjustment?: number;
  masters_adjusted_time?: number;
  club: ClubProps;
  times: TimeProps[];
  event_original: EventOriginalProps[];
}

export type EventOriginalProps = {
  crew: number;
  event_original: string;
}