import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  NAME: "Jacob Woliver",
  EMAIL: "jacob@jmw.sh",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Jacob Woliver",
  DESCRIPTION: "Software engineer, project builder, and writer.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Writing about software, projects, and the ideas behind them.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "Useful and non-useful things I have made.",
};

export const ABOUT: Metadata = {
  TITLE: "About",
  DESCRIPTION: "About Jacob Woliver and how to get in touch.",
};

export const SOCIALS: Socials = [
  { NAME: "GitHub", HREF: "https://github.com/jmwoliver" },
];
