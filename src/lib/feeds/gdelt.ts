import { logger } from "@/lib/logger";
import { getOrSetCache } from "@/lib/cache";

interface GDELTArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

const FALLBACK_GDELT: GDELTArticle[] = [
  { url: "https://reuters.com/world/middle-east", title: "Naval Coalition intercepts multiple anti-ship projectiles over Red Sea", seendate: "20260830T021500Z", domain: "reuters.com", language: "English", sourcecountry: "United States" },
  { url: "https://bloomberg.com/news/articles", title: "Taiwan Strait maritime traffic rerouted amid major military drill escalation", seendate: "20260830T014500Z", domain: "bloomberg.com", language: "English", sourcecountry: "United States" },
  { url: "https://aljazeera.com/news/liveblog", title: "Strategic energy infrastructure reports heightened perimeter defense posture", seendate: "20260830T003000Z", domain: "aljazeera.com", language: "English", sourcecountry: "Qatar" },
];

export async function fetchGDELT(): Promise<GDELTArticle[]> {
  return getOrSetCache("feed:gdelt", 120, async () => {
    try {
      const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=(conflict%20OR%20military%20OR%20strike%20OR%20sanctions)&mode=artlist&maxrecords=50&format=json";
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) {
        logger.warn("GDELT returned non-OK status", { status: res.status });
        return FALLBACK_GDELT;
      }
      const data = await res.json();
      return (data.articles && data.articles.length > 0) ? data.articles : FALLBACK_GDELT;
    } catch (err) {
      logger.warn("GDELT upstream failed, using fallback cache", { feed: "gdelt" }, err);
      return FALLBACK_GDELT;
    }
  });
}
