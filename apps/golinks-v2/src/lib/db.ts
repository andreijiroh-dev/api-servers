import { DiscordInviteLink, GoLink, Prisma, PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { Env, EnvBindings } from "../types";
import { Str } from "chanfana";
import { getOffset, PAGE_SIZE } from "./utils";

/**
 * Get a list of golinks in batches of 10 from database.
 * @param db Should point to `c.env.golinks`
 * @param page Paging chores
 * @param isActive Filter by disabled links
 * @returns
 */
export async function getGoLinks(db: EnvBindings<Env>["golinks"], page: number, isActive?: boolean, type?: "golinks" | "wikilinks" | null) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter }); // Assuming you have a Prisma client instance

  const skip = getOffset(page);
  const take = PAGE_SIZE;

  try {
    if (type == "wikilinks") {
      const result = await prisma.wikiLinks.findMany({
        where: {
          is_active: isActive !== undefined ? isActive : undefined, // Filter by isActive if provided
        },
        orderBy: {
          id: "desc", // Sort by newer IDs
        },
        skip,
        take,
      });
      return result;
    } else {
      const result = await prisma.goLink.findMany({
        where: {
          is_active: isActive !== undefined ? isActive : undefined, // Filter by isActive if provided
        },
        orderBy: {
          id: "desc", // Sort by newer IDs
        },
        skip,
        take,
      });
      return result;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}

/**
 *
 * @param db  Always point to `c.env.golinks`
 * @param slug URL slug to query into
 * @param slug Either `golinks` or `wikilinks`, used for handling DB queries.
 * @returns
 */
export async function getLink(
  db: EnvBindings<Env>["golinks"],
  slug: string,
  type?: "golinks" | "wikilinks" | null,
): Promise<GoLink> | null {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  try {
    if (type == "wikilinks") {
      const result = prisma.wikiLinks.findUnique({
        where: {
          slug: slug,
        },
      });
      return result;
    } else {
      const result = prisma.goLink.findUnique({
        where: {
          slug: slug,
        },
      });
      return result;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}

export async function addGoLink(
  db: EnvBindings<Env>["golinks"],
  slug: string,
  targetUrl: string,
  type?: "golinks" | "wikilinks" | null,
): Promise<GoLink> | null {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  try {
    if (type == "wikilinks") {
      const result = prisma.wikiLinks.create({
        data: {
          slug,
          targetUrl,
        },
      });
      return result;
    } else {
      const result = prisma.goLink.create({
        data: {
          slug,
          targetUrl,
        },
      });
      return result;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      if (error.code === "P2002") {
        return Promise.reject(new Error("A Discord invite code with that slug already exists."));
      }

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}

/**
 * Get a list of Discord invite codes in batches of 10 from database.
 * @param db Always point to `c.env.golinks`
 * @param page
 * @param isActive
 * @param isNsfw
 * @returns
 */
export async function getDiscordInvites(db: EnvBindings<Env>["golinks"], page: number, isActive?: boolean, isNsfw?: boolean) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter }); // Assuming you have a Prisma client instance

  const skip = getOffset(page);
  const take = PAGE_SIZE;

  const result = await prisma.discordInviteLink.findMany({
    where: {
      is_active: isActive !== undefined ? isActive : undefined, // Filter by isActive if provided
      nsfw: isNsfw !== undefined ? isNsfw : false, // Hide NSFW servers for safety by default.
    },
    orderBy: {
      id: "desc", // Sort by newer IDs
    },
    skip,
    take,
  });
  return result;
}

export async function getDiscordInvite(db: EnvBindings<Env>["golinks"], slug: string): Promise<DiscordInviteLink> | null {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.discordInviteLink.findUnique({
      where: {
        slug,
      },
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      if (error.code === "P2002") {
        return Promise.reject(new Error("A Discord invite code with that slug already exists."));
      }

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}

export async function addDiscordInvite(
  db: EnvBindings<Env>["golinks"],
  slug: string,
  inviteCode: string,
  name: string,
  description: string,
  is_active?: boolean,
  nsfw?: boolean,
) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  try {
    const result = prisma.discordInviteLink.create({
      data: {
        slug,
        inviteCode,
        name,
        description,
        is_active: is_active !== undefined ? is_active : true,
        nsfw: nsfw !== undefined ? nsfw : false,
      },
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      if (error.code === "P2002") {
        return Promise.reject(new Error("A Discord invite code with that slug already exists."));
      }

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}

export async function updateDiscordLink(
  db: EnvBindings<Env>["golinks"],
  slug: string,
  inviteCode: string,
  name?: string,
  description?: string,
) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  try {
    const existingData = await prisma.discordInviteLink.findUnique({
      where: { slug },
    });

    if (existingData) {
      const result = await prisma.discordInviteLink.update({
        where: {
          slug,
        },
        data: {
          inviteCode,
          name: name !== undefined ? name : existingData.name,
          description: description !== undefined ? description : existingData.description,
        },
      });
      return result;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      if (error.code === "P2002") {
        return Promise.reject(new Error("A Discord invite code with that slug already exists."));
      }

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}

export async function deleteDiscordLink(db: EnvBindings<Env>["golinks"], slug: string) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = prisma.discordInviteLink.delete({
      where: { slug },
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[prisma-client] known client error: ${error.code} - ${error.message}`);

      if (error.code === "P2002") {
        return Promise.reject(new Error("A Discord invite code with that slug already exists."));
      }

      return Promise.reject(new Error("A error occurred while querying the database."));
    } else {
      console.error(`[prisma-client]- Unexpected error`, error);
      return Promise.reject(new Error("An unexpected error occurred."));
    }
  }
}
