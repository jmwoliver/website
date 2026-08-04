export function readingTime(markdown: string) {
  const textOnly = markdown.replace(/<[^>]+>/g, "");
  const words = textOnly.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export function entrySlug(id: string) {
  return id.replace(/\/index\.(md|mdx)$/, "").replace(/\.(md|mdx)$/, "");
}
