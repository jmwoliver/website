import type { GameStorage } from "./types";

export class LocalGameStorage implements GameStorage {
  readonly #prefix: string;

  constructor(gameSlug: string) {
    this.#prefix = `jmw.games.${gameSlug}.`;
  }

  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(this.#prefix + key);
      return value === null ? fallback : (JSON.parse(value) as T);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T) {
    try {
      localStorage.setItem(this.#prefix + key, JSON.stringify(value));
    } catch {
      // Storage is an enhancement, not a requirement for play.
    }
  }

  remove(key: string) {
    try {
      localStorage.removeItem(this.#prefix + key);
    } catch {
      // Ignore blocked storage.
    }
  }
}
