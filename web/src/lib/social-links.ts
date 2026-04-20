type SocialLinks = {
  whatsapp?: string;
  website?: string;
  email?: string;
};

function normalizeWebsite(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

function normalizeWhatsapp(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const phone = value.replace(/[^\d+]/g, "");
  if (!phone) {
    return undefined;
  }

  return `https://wa.me/${phone.replace("+", "")}`;
}

export function parseSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  const whatsappRaw = record.whatsapp ?? record.WhatsApp;
  const websiteRaw = record.website ?? record.site;
  const emailRaw = record.email;

  const whatsapp = typeof whatsappRaw === "string" ? normalizeWhatsapp(whatsappRaw.trim()) : undefined;
  const website = typeof websiteRaw === "string" ? normalizeWebsite(websiteRaw.trim()) : undefined;
  const email = typeof emailRaw === "string" && emailRaw.includes("@") ? emailRaw.trim().toLowerCase() : undefined;

  return { whatsapp, website, email };
}
