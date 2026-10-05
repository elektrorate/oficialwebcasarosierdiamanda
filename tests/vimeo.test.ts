import assert from "node:assert/strict";
import test from "node:test";
import { vimeoEmbedUrl, isDirectVideoUrl } from "../src/lib/vimeo.ts";

test("preserves unlisted video hashes from sharing and player URLs", () => {
  for (const source of ["https://vimeo.com/123456/abc123", "https://player.vimeo.com/video/123456?h=abc123"]) {
    const embed = new URL(vimeoEmbedUrl(source, { autoplay: "1" }));
    assert.equal(embed.pathname, "/video/123456");
    assert.equal(embed.searchParams.get("h"), "abc123");
    assert.equal(embed.searchParams.get("autoplay"), "1");
  }
});

test("management and unrelated URLs cannot become public video embeds", () => {
  for (const source of ["https://vimeo.com/manage/videos/123456", "https://vimeo.com.evil.test/123456", "ftp://vimeo.com/123456", "bad-url"]) {
    assert.equal(vimeoEmbedUrl(source, {}), "");
    assert.equal(isDirectVideoUrl(source), false);
  }
  assert.equal(isDirectVideoUrl("https://cdn.example/video.mp4?token=abc"), true);
  assert.equal(isDirectVideoUrl("/video.webm"), true);
});
