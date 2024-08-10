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

import data from "../data/old-links.json";
export async function handleOldUrls(c: Context, next: Next) {
  const force_redirect = c.req.query("force_redirect");
  if (data[c.req.path] && !force_redirect) {
    console.log(`[old-link-redirects] data for ${c.req.path}: ${JSON.stringify(data[c.req.path])}`);
    return c.redirect(
      `/landing/deprecated?golink=${c.req.path.replace(/^\/|\/$/g, "")}&reason=${encodeURIComponent(data[c.req.path].reason)}`,
    );
  } else if (data[c.req.path] && force_redirect) {
    console.log(`[old-link-redirects] data for ${c.req.path}: ${JSON.stringify(data[c.req.path])}`);
    return c.redirect(data[c.req.path].url);
  }
  return await next();
}

export function generateNewIssueUrl(type: string, prefix: "golinks" | "wikilinks", url?: string) {
  const templateUrl = new URL(
    "https://github.com/andreijiroh-dev/wiki/issues/new?assignees=ajhalili2006&labels=&projects=&template=golink-feedback.yml&title=%5Bgolinks%5D+",
  );

  templateUrl.searchParams.append("issueType", type);
  if (prefix == "wikilinks") {
    templateUrl.searchParams.append("prefix", "wiki.andreijiroh.xyz/go/");
  } else {
    templateUrl.searchParams.append("prefix", "go.andreijiroh.xyz/");
  }
  if (url) {
    templateUrl.searchParams.append("url", url);
  }
  return templateUrl.toString();
}
