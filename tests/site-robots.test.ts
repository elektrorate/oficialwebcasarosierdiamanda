import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteRobots, robotsContent, resolveRobotsMetadata } from "../src/lib/seo/site-robots.ts";

test("index y follow verdaderos devuelven null (sin restricción)", () => {
  assert.equal(resolveRobotsMetadata({ robots_index: true, robots_follow: true }), null);
});

test("robots_index false añade noindex pero no afecta follow", () => {
  const robots = resolveRobotsMetadata({ robots_index: false, robots_follow: true });
  assert.equal(robots?.index, false);
  assert.equal(robots?.follow, true);
  assert.equal(robotsContent(robots!), "noindex");
});

test("robots_follow false añadenofollow de forma independiente", () => {
  const robots = resolveRobotsMetadata({ robots_index: true, robots_follow: false });
  assert.equal(robots?.index, true);
  assert.equal(robots?.follow, false);
  assert.equal(robotsContent(robots!), "nofollow");
});

test("ambos false genera noindex, nofollow", () => {
  const robots = resolveRobotsMetadata({ robots_index: false, robots_follow: false });
  assert.equal(robots?.index, false);
  assert.equal(robots?.follow, false);
  assert.equal(robotsContent(robots!), "noindex, nofollow");
});

test("valores booleanos se normalizan correctamente", () => {
  const robots = resolveSiteRobots({ robots_index: false, robots_follow: true });
  assert.equal(robots.index, false);
  assert.equal(robots.follow, true);
});

test("index true, follow false no se trata como noindex", () => {
  const robots = resolveSiteRobots({ robots_index: true, robots_follow: false });
  assert.equal(robots.index, true);
  assert.equal(robots.follow, false);
});

test("resolveRobotsMetadata devuelve null cuando ambos son true (equivalente a index+follow)", () => {
  assert.equal(resolveRobotsMetadata({ robots_index: true, robots_follow: true }), null);
});
