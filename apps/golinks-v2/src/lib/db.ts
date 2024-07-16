import { PrismaClient } from "@prisma/client"
import { PrismaD1 } from "@prisma/adapter-d1"
import { Env } from "../types"
import { Str } from "chanfana"
const PAGE_SIZE = 10

function getOffset(page: number): number {
	return Math.max(0, page) * PAGE_SIZE
}

/**
 *
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

export async function getGoLinks(db: Env["golinks"], page: number, isActive?: boolean) {
  const adapter = new PrismaD1(db)
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

export async function getLink(db: Env["golinks"], slug: string) {
  const adapter = new PrismaD1(db)
  const prisma = new PrismaClient({ adapter });

  const result = prisma.goLink.findFirst({
		where: {
			slug
		}
  })
  return result
}

export async function addGoLink(db: Env["golinks"], slug: string, targetUrl: string, isActive?: boolean) {
  const adapter = new PrismaD1(db)
  const prisma = new PrismaClient({ adapter })

  const result = prisma.goLink.create({
		data: {
			slug,
			targetUrl,
			is_active: isActive !== undefined ? isActive : true,
			created_on: Date.now().toString(),
			updated_on: Date.now().toString(),
		},
	});
	return result
}
