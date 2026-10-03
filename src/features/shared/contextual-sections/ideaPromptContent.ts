import type { SocialGalleryPost } from "@/components/home/SocialGallery";

export type IdeaPromptContext =
  | "home"
  | "experience-list"
  | "experience-detail"
  | "blog"
  | "blog-post"
  | "studio";

export interface IdeaPromptContent {
  id: string;
  title: string;
  subtitle: string;
  posts: readonly SocialGalleryPost[];
  ariaLabel: string;
  sourceHref: string;
}

const emptyIdeaPromptContent: IdeaPromptContent = {
  id: "galeria-social",
  title: "",
  subtitle: "",
  posts: [],
  ariaLabel: "Galeria continua de Instagram",
  sourceHref: ""
};

export function getIdeaPromptContent(
  context: IdeaPromptContext
): IdeaPromptContent {
  void context;
  return emptyIdeaPromptContent;
}
