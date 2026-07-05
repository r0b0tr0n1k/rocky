import { posts, type Post } from "../.velite.js";

/**
 * Get all published posts sorted by date (newest first)
 */
export function getAllPosts(): Post[] {
  return posts
    .filter((post: Post) => post.published)
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single post by its slug path
 * @param slug - The slug path (e.g., "example" or "blog/getting-started")
 */
export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post: Post) => post.slug === slug);
}

/**
 * Get all posts from a specific directory/prefix
 * @param prefix - The directory prefix (e.g., "blog", "docs")
 */
export function getPostsByPrefix(prefix: string): Post[] {
  return posts
    .filter((post: Post) => post.published && post.slug.startsWith(prefix))
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get all unique tags from published posts
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  posts.forEach((post: Post) => {
    if (post.published && post.tags) {
      post.tags.forEach((tag: string) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): Post[] {
  return posts
    .filter((post: Post) => post.published && post.tags?.includes(tag))
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
