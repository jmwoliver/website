# jmw.sh

Jacob Woliver's blog and project archive, migrated from Hugo to Astro. The structure starts from
AstroNano's minimal approach, with the old desktop/CRT presentation removed.

## Develop

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Run the production checks with:

```sh
npm run build
npm run check:links
```

## Content

- Blog posts live in `src/content/blog/<slug>/index.md`.
- Projects live in `src/content/projects/<slug>/index.md`.
- Shared images and downloads live in `static/` and are referenced from the site root.
- Set `draft: true` in frontmatter to keep an entry out of indexes, routes, and RSS.

The content schemas are defined in `src/content.config.ts`. The old Hugo shortcodes have been
replaced with standard HTML, so all content now renders directly through Astro.

## Deploy

Netlify builds the site with `npm run build` and publishes `dist/`. Historical Hugo-era paths are
redirected to their current `/blog/` routes in `netlify.toml`.
