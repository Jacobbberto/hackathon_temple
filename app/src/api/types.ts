/** Response shapes served by the PhillyPulse backend (see backend/pulse/views.py). */

export type SourceStatus = 'live' | 'cached' | 'sample' | 'off';

export type SourceMeta = {
  status: SourceStatus;
  updated_at: number | null;
  note: string | null;
};

export type Sources = Record<string, SourceMeta>;

export type DailyForecast = {
  date: string;
  high_f: number | null;
  low_f: number | null;
  condition: string;
  icon: string;
  precip_chance: number | null;
};

export type Weather = {
  observed_at: string | null;
  temp_f: number | null;
  feels_like_f: number | null;
  humidity: number | null;
  wind_mph: number | null;
  is_day: boolean;
  condition: string;
  icon: string;
  high_f: number | null;
  low_f: number | null;
  precip_chance: number | null;
  sunrise: string | null;
  sunset: string | null;
  outlook: DailyForecast[];
};

export type Headline = {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  published_at: number | null;
  image_url: string | null;
};

export type Broadcast = { name: string; url: string | null };

export type GameState = 'pre' | 'in' | 'post';

export type Game = {
  id: string;
  team: string;
  team_name: string;
  league: string;
  opponent: { name: string; short_name: string; abbr: string };
  is_home: boolean;
  start_time: string;
  state: GameState;
  detail: string;
  team_score: number | null;
  opponent_score: number | null;
  result: 'W' | 'L' | 'T' | null;
  venue: string | null;
  broadcasts: Broadcast[];
  broadcast_is_typical: boolean;
  game_url: string | null;
  recap_url: string | null;
};

export type Team = {
  key: string;
  name: string;
  full_name: string;
  primary: string;
  secondary: string;
  leagues: string;
};

export type EventCategory = 'parades_festivals' | 'races_runs' | 'civic' | 'concerts_shows';

export type PulseEvent = {
  id: string;
  title: string;
  category: EventCategory;
  start: string;
  end: string | null;
  all_day: boolean;
  location: string | null;
  url: string | null;
  description: string | null;
  closure: string | null;
  date_note: string | null;
  source: string;
  ongoing?: boolean;
};

export type Hearing = {
  id: string;
  body: string;
  kind: 'Session' | 'Hearing';
  title: string;
  details: string | null;
  start: string;
  time_tbd: boolean;
  location: string;
  url: string;
  agenda_url: string | null;
};

export type Bill = {
  id: string;
  number: string;
  title: string;
  summary: string;
  type: string;
  status: string;
  stage: 'Introduced' | 'Passed';
  introduced: string | null;
  passed: string | null;
  url: string;
  source: string;
};

export type Election = {
  name: string;
  date: string;
  days_until: number;
  is_primary: boolean;
  note: string | null;
  key_dates: { label: string; date: string; note: string; passed: boolean; days_until: number }[];
  links: { label: string; url: string }[];
};

export type HomeResponse = {
  generated_at: string;
  weather: Weather;
  sports_today: Game[];
  headlines: Headline[];
  upcoming_events: PulseEvent[];
  sources: Sources;
};

export type EventsResponse = {
  generated_at: string;
  range: { start: string; end: string };
  categories: { key: EventCategory; label: string }[];
  days: { date: string; events: PulseEvent[] }[];
  later: PulseEvent[];
  sources: Sources;
};

export type SportsResponse = {
  generated_at: string;
  live: Game[];
  upcoming: Game[];
  recent: Game[];
  today: Game[];
  teams: Team[];
  sources: Sources;
};

export type PoliticsResponse = {
  generated_at: string;
  election: Election;
  hearings: Hearing[];
  bills: Bill[];
  sources: Sources;
};
