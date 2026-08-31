import type { BlogIndexIntroView } from "../../lib/buildBlogIndexIntroView";

export function BlogIndexMasthead({ intro }: { intro: BlogIndexIntroView }) {
  return (
    <section className="blog-index-masthead section py-[clamp(12px,2vw,28px)] pb-[clamp(28px,4vw,48px)] bg-[#f9f8f3]" aria-labelledby="blog-index-masthead-title">
      <div className="blog-index-masthead__container w-[min(100%-40px,720px)] mx-auto text-center">
        <h1 id="blog-index-masthead-title" className="blog-index-masthead__title">
          {intro.heading}
        </h1>
        {intro.kicker ? (
          <p className="blog-index-masthead__kicker">{intro.kicker}</p>
        ) : null}
        {intro.text ? <p className="blog-index-masthead__text">{intro.text}</p> : null}
      </div>
    </section>
  );
}
