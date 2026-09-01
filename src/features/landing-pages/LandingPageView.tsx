import Image from "next/image";
import Link from "next/link";
import { assetPath, internalHref } from "@/lib/assets";
import type { LandingPage, LandingPageBlock } from "@/lib/cms/types";
import styles from "./landing-page.module.css";

function LandingImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return <Image src={assetPath(src, { width: 1600, quality: 82 })} alt={alt} fill sizes="(max-width: 768px) 100vw, 1200px" className={styles.image} unoptimized />;
}

function Action({ text, href }: { text: string; href: string }) {
  if (!text) return null;
  return <Link className={styles.button} href={internalHref(href || "#contenido")}>{text}</Link>;
}

function Block({ block }: { block: LandingPageBlock }) {
  const content = (
    <div className={styles.blockCopy}>
      {block.title ? <h2>{block.title}</h2> : null}
      {block.text ? <p>{block.text}</p> : null}
      <Action text={block.cta_text} href={block.cta_url} />
    </div>
  );

  if (block.type === "image") {
    return <section className={styles.fullImage}><LandingImage src={block.image_id} alt={block.title || "Imagen de la landing"} /></section>;
  }
  if (block.type === "text_image" || block.type === "gallery") {
    return (
      <section className={styles.split}>
        {content}
        <div className={styles.blockImage}><LandingImage src={block.image_id} alt={block.title || "Imagen de la landing"} /></div>
      </section>
    );
  }
  if (block.type === "cta" || block.type === "promo_banner") {
    return <section className={styles.callout}>{content}</section>;
  }
  if (block.type === "testimonial") {
    return <blockquote className={styles.quote}>{block.text ? `“${block.text}”` : ""}{block.title ? <cite>{block.title}</cite> : null}</blockquote>;
  }
  if (block.type === "custom_html") {
    return <section className={styles.copy}><pre className={styles.safeHtml}>{block.custom_html}</pre></section>;
  }
  return <section className={styles.copy}>{content}</section>;
}

export function LandingPageView({ landing, preview = false }: { landing: LandingPage; preview?: boolean }) {
  const visibleBlocks = [...landing.blocks].filter((block) => block.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  return (
    <article className={`${styles.page} ${preview ? styles.preview : ""}`}>
      <header className={styles.hero}>
        <LandingImage src={landing.hero_image_id} alt={landing.hero_title || landing.title} />
        <div className={styles.overlay} />
        <div className={styles.heroContent}>
          <span>{landing.campaign_type.replaceAll("_", " ")}</span>
          <h1>{landing.hero_title || landing.title}</h1>
          {landing.hero_subtitle ? <p>{landing.hero_subtitle}</p> : null}
          <Action text={landing.cta_text} href={landing.cta_url} />
        </div>
      </header>
      <main id="contenido" className={styles.content}>
        {landing.intro_text ? <section className={styles.intro}><p>{landing.intro_text}</p></section> : null}
        {visibleBlocks.map((block) => <Block key={block.id} block={block} />)}
      </main>
    </article>
  );
}
