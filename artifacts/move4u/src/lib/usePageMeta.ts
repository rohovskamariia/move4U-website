import { useEffect } from "react";

// Canonical (production) origin used for <link rel="canonical">. We pin
// the apex domain here so every page reports a single canonical URL to
// Google, even when accessed via www, the Replit preview, or a staging
// deployment. If the chosen canonical domain ever changes, edit it in
// this one place.
const SITE_ORIGIN = "https://move4u.uk";

interface PageMeta {
  /** Full <title> for the tab + Google SERP. Append " | Move4U" for consistency. */
  title: string;
  /** ~150–160 char description used by Google + social previews. */
  description: string;
  /** Canonical path for this page, starting with "/". e.g. "/pricing". */
  path: string;
}

/**
 * Lightweight per-route SEO helper for our SPA. React-helmet/Next would be
 * overkill here — we just imperatively keep `<title>`, the description
 * meta, and the canonical link in sync with the active route. Robots,
 * Open Graph, Twitter, and JSON-LD live in index.html and don't need
 * per-page updates for our use case.
 */
export function usePageMeta({ title, description, path }: PageMeta): void {
  useEffect(() => {
    document.title = title;

    // <meta name="description"> — create on demand if missing.
    let descTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", description);

    // <link rel="canonical"> — same idea.
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    canonical.setAttribute("href", `${SITE_ORIGIN}${cleanPath}`);

    // OG + Twitter — update per route so social shares reflect the current page.
    // We only update existing tags (all are statically present in index.html).
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", `${SITE_ORIGIN}${cleanPath}`);
    const twTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", title);
    const twDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", description);
  }, [title, description, path]);
}

/**
 * Mark the current page as noindex,nofollow for the lifetime of the
 * component. Used by admin and transactional flows (admin bookings,
 * secure-booking, payment success) so they never appear in search even
 * if a link leaks. Cleans the tag on unmount so other pages are not
 * accidentally hidden from Google.
 */
export function useNoIndex(): void {
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.setAttribute("name", "robots");
    tag.setAttribute("content", "noindex, nofollow");
    document.head.appendChild(tag);
    return () => {
      tag.remove();
    };
  }, []);
}
