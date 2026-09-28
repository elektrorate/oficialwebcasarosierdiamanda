import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSiteLanguage,
  isSupportedSiteLanguage,
  siteHtmlLang,
  siteOpenGraphLocale,
  siteIntlLocale,
} from "../src/lib/seo/site-language.ts";

test("normaliza tags de idioma", () => {
  assert.equal(normalizeSiteLanguage("es"), "es");
  assert.equal(normalizeSiteLanguage("ES"), "es");
  assert.equal(normalizeSiteLanguage("es-ES"), "es");
  assert.equal(normalizeSiteLanguage("en-US"), "en");
});

test("rechaza idiomas no admitidos", () => {
  assert.equal(isSupportedSiteLanguage("klingon"), false);
  assert.equal(isSupportedSiteLanguage(""), false);
  assert.equal(isSupportedSiteLanguage(42), false);
});

test("siteHtmlLang devuelve el código de idioma", () => {
  assert.equal(siteHtmlLang("es"), "es");
  assert.equal(siteHtmlLang("en"), "en");
});

test("siteOpenGraphLocale devuelve idioma_REGION", () => {
  assert.equal(siteOpenGraphLocale("es"), "es_ES");
  assert.equal(siteOpenGraphLocale("en"), "en_GB");
});

test("siteIntlLocale devuelve el locale para Intl", () => {
  assert.equal(siteIntlLocale("es"), "es-ES");
  assert.equal(siteIntlLocale("en"), "en-GB");
});

test("valores no string se resuelven al idioma por defecto", () => {
  assert.equal(normalizeSiteLanguage(null), "es");
  assert.equal(normalizeSiteLanguage(undefined), "es");
  assert.equal(normalizeSiteLanguage(123), "es");
});
