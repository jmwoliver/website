export const GAME_ACTIONS = ["up", "down", "left", "right", "primary", "secondary"] as const;

export type GameAction = (typeof GAME_ACTIONS)[number];

export type GameCatalogEntry = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  resolution: Readonly<{ width: number; height: number }>;
  load: () => Promise<GameModule>;
};

export type ToneOptions = {
  frequency: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
  endFrequency?: number;
};

export interface GameAudio {
  unlock(): Promise<void>;
  tone(options: ToneOptions): void;
  noise(duration?: number, volume?: number): void;
}

export interface GameInput {
  isDown(action: GameAction): boolean;
  consumePressed(action: GameAction): boolean;
}

export interface GameStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export type GameContext = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  input: GameInput;
  audio: GameAudio;
  storage: GameStorage;
  signal: AbortSignal;
  resolution: Readonly<{ width: number; height: number }>;
};

export interface GameInstance {
  update(deltaSeconds: number): void;
  render(interpolation: number): void;
  pause?(): void;
  resume?(): void;
  reset?(): void;
  destroy?(): void;
}

export interface GameModule {
  createGame(context: GameContext): GameInstance | Promise<GameInstance>;
}
