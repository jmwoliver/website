import type { GameCatalogEntry } from "./runtime/types";

export const GAME_CATALOG = [
  {
    slug: "golf",
    title: "Golf",
    description: "Three holes of pocket-sized arcade golf.",
    icon: "/games/golf-icon.svg",
    resolution: { width: 320, height: 240 },
    load: () => import("./golf"),
  },
] as const satisfies readonly GameCatalogEntry[];

export type GameSlug = (typeof GAME_CATALOG)[number]["slug"];

export function findGame(slug: string | undefined) {
  return GAME_CATALOG.find((game) => game.slug === slug);
}
