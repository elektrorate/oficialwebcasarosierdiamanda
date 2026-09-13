import type { ReactNode } from "react";
import "../legacy/blog.css";
import "../../features/blog/components/index/blog-index.css";
import "../../features/blog/components/post/blog-post-editorial.css";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
