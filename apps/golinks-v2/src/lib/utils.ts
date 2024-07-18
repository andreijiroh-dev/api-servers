import { Context, Next } from "hono";

export const PAGE_SIZE = 10;

export function getOffset(page: number): number {
  return Math.max(0, page) * PAGE_SIZE;
}

export function generateSlug(length: number) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

import data from "./old-links.json";
export async function handleOldUrls(c: Context, next: Next) {
  const force_redirect = c.req.query("force_redirect");
  console.log(`[old-link-redirects] data for ${c.req.path}: ${JSON.stringify(data[c.req.path])}`);
  if (data[c.req.path] && !force_redirect) {
    return c.redirect(
      `/landing/deprecated?golink=${c.req.path.replace(/^\/|\/$/g, "")}&reason=${encodeURIComponent(data[c.req.path].reason)}`,
    );
  } else if (data[c.req.path] && force_redirect) {
    return c.redirect(data[c.req.path].url);
  }
  await next();
}
