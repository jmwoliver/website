import { describe, expect, it } from "vitest";
import { GAME_CATALOG, findGame } from "./catalog";

describe("game catalog", () => {
  it("has unique, route-safe slugs", () => {
    const slugs = GAME_CATALOG.map((game) => game.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((slug) => expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));
  });

  it("describes a valid display", () => {
    for (const game of GAME_CATALOG) {
      expect(game.resolution.width).toBeGreaterThan(0);
      expect(game.resolution.height).toBeGreaterThan(0);
      expect(findGame(game.slug)).toBe(game);
    }
  });

  it("loads every registered cartridge lazily", async () => {
    for (const game of GAME_CATALOG) {
      const module = await game.load();
      expect(module.createGame).toBeTypeOf("function");
    }
  });
});
