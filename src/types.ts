export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  name: string;
  d2: (ctx: CanvasRenderingContext2D, size: number) => void;
  pts: (size: number) => Point[];
}

export type GameMode =
  | 'home'
  | 'trace'
  | 'exact'
  | 'findSame'
  | 'findDiff'
  | 'speed'
  | 'sort';

export type Difficulty = 'easy' | 'hard';
