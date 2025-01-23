import { generateSlug } from "../src/lib/utils";
import { env } from "process";

const tokenPrefix = "goprod_";
const username = env.GITHUB_USERNAME || "ajhalili2006";
const token = generateSlug(48);

console.log(`${tokenPrefix}${username}-${token}`);
