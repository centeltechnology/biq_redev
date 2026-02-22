const BLOCKED_HOSTS = ["replit.dev", "localhost", "127.0.0.1", "0.0.0.0"];

export function getCanonicalAppUrl(): string {
  const envUrl = process.env.APP_CANONICAL_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production" || process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS;
    if (domains) {
      return `https://${domains.split(",")[0]}`;
    }
    console.error("[URL] APP_CANONICAL_URL not set and no REPLIT_DOMAINS found in production");
    return "https://bakeriq.app";
  }

  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    return `https://${devDomain}`;
  }

  return "https://bakeriq.app";
}

export function buildAppUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getCanonicalAppUrl()}${normalizedPath}`;
}

export function validateEmailUrls(
  html: string,
  templateName: string
): { valid: boolean; offendingUrls: string[] } {
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  const urls = html.match(urlRegex) || [];
  const offendingUrls: string[] = [];

  const canonicalHost = (() => {
    try {
      return new URL(getCanonicalAppUrl()).host;
    } catch {
      return "bakeriq.app";
    }
  })();

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const host = parsed.host.toLowerCase();

      if (BLOCKED_HOSTS.some(blocked => host.includes(blocked))) {
        offendingUrls.push(url);
        continue;
      }

      if (host !== canonicalHost && host !== "bakeriq.app") {
        continue;
      }
    } catch {
      continue;
    }
  }

  if (offendingUrls.length > 0) {
    console.error(`[Email Validator] Template "${templateName}" contains blocked URLs:`, offendingUrls);
  }

  return { valid: offendingUrls.length === 0, offendingUrls };
}
