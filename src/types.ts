export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;
  name: string;
  country: string; // The team id
  position: Position;
  stats: {
    speed: number;
    shooting: number;
    tackling: number;
  };
  price: number;
}

export interface Team {
  id: string;
  name: string;
  colorPrimary: string;
  colorSecondary: string;
  iso2: string;
}

export interface UserProfile {
  coins: number;
  roster: string[]; // array of player IDs
  multipliers: number;
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  stage: string;
}
