const supabaseHostname = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hhxftxxshwgmfxuyrjmz.supabase.co",
    ).hostname;
  } catch {
    return "hhxftxxshwgmfxuyrjmz.supabase.co";
  }
})();

export const imageRemotePatterns = [
  {
    protocol: "https" as const,
    hostname: supabaseHostname,
    port: "",
    pathname: "/storage/v1/object/public/**",
  },
  // Published blog content still references this legacy public bucket.
  {
    protocol: "https" as const,
    hostname: "moqjlaexfclzxuilzglg.supabase.co",
    port: "",
    pathname: "/storage/v1/object/public/make-0ba58e95-uploads/**",
  },
];
