import type { BlogPost } from "@/data/types";
import { resolveBlogCardExcerpt } from "./resolveBlogCardExcerpt";

/** Rich introductory content shown under the article title. */
export function resolveBlogPostIntro(post: BlogPost) {
  const intro = post.excerpt?.trim();
  if (intro) return intro;

  return resolveBlogCardExcerpt(post);
}
