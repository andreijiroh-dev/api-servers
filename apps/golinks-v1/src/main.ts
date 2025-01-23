export default {
  async fetch(request, env, ctx): Promise<Response> {
    const linksDb = env.links;
    const wikilinks = env.wikilinks;

    function rmTrailingSlashes(str) {
      let i = str.length;
      while (str[--i] === "/");
      return str.slice(0, i + 1);
    }

    // parse URL for detection
    const url = new URL(request.url);
    console.log(`request URL - ${url}`);
    const { pathname, hostname, search } = url;

    if (hostname == "wiki.andreijiroh.xyz" || (hostname == "andreijiroh.xyz" && pathname.startsWith("/go/"))) {
      const wikiLinkNoTrailingSlash = rmTrailingSlashes(pathname);
      const wikiLinkRegExp = new RegExp("\\/go\\/", "gm");
      const resultingRedirect = await wikilinks.get(wikiLinkNoTrailingSlash.replace(wikiLinkRegExp, ""));
      if (resultingRedirect === null) {
        return new Response("golink does not exist on database", {
          status: 404,
        });
      }
      console.log(`[wikilinks] redirecting to ${resultingRedirect}`);
      return Response.redirect(resultingRedirect, 301);
    } else {
      const redirectUrl = await linksDb.get(pathname);
      if (redirectUrl === null) {
        console.log(`golink doesn't exist for ${pathname}, redirecting to landing page instead`);
        return Response.redirect(`https://wiki.andreijiroh.xyz/garden/golinks`, 301);
      }
      console.log(`[go] redirecting to ${redirectUrl}`);
      return Response.redirect(redirectUrl, 301);
    }
  },
};
