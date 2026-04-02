/**
 * Result type for Server Actions.
 * Never throw from a server action — always return one of these.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type BlogCategory = "project" | "findings";

export const BLOG_CATEGORIES: BlogCategory[] = ["project", "findings"];
