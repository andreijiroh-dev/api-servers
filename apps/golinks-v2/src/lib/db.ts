import { GoLink, PrismaClient } from "@prisma/client"
import { PrismaD1 } from "@prisma/adapter-d1"
import { Env, EnvBindings } from "../types"
import { Str } from "chanfana"
const PAGE_SIZE = 10

function getOffset(page: number): number {
	return Math.max(0, page) * PAGE_SIZE
}

/**
 * Generate a slug for use in URLs
 * @param {number} length
 * @returns {string}
 */
export function generateSlug(length: number) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

/**
 * Get a list of golinks in batches of 10 from database.
 * @param db Should point to `c.env.golinks`
 * @param page Paging chores
 * @param isActive Filter by disabled links
 * @returns
 */
export async function getGoLinks(db: EnvBindings<Env>['golinks'], page: number, isActive?: boolean) {
	const adapter = new PrismaD1(db);
	const prisma = new PrismaClient({ adapter }); // Assuming you have a Prisma client instance

	const skip = getOffset(page);
	const take = PAGE_SIZE;

	const result = await prisma.goLink.findMany({
		where: {
			is_active: isActive !== undefined ? isActive : undefined, // Filter by isActive if provided
		},
		orderBy: {
			id: 'asc', // Sort by ID in ascending order (you can change this if needed)
		},
		skip,
		take,
	});
	return result;
}

/**
 *
 * @param db  Always point to `c.env.golinks`
 * @param slug URL slug to query into
 * @returns
 */
export async function getLink(db: EnvBindings<Env>['golinks'], slug: string): Promise<GoLink> | null {
	const adapter = new PrismaD1(db);
	const prisma = new PrismaClient({ adapter });

	const result = prisma.goLink.findUnique({
		where: {
			slug: slug,
		},
	});
	return result;
}

export async function addGoLink(
	db: EnvBindings<Env>["golinks"], slug: string, targetUrl: string, isActive?: boolean): Promise<GoLink> | null {
  const adapter = new PrismaD1(db)
  const prisma = new PrismaClient({ adapter })
  const result = prisma.goLink.create({
		data: {
			slug,
			targetUrl,
			is_active: isActive !== undefined ? isActive : true
		},
	});
	return result
}
