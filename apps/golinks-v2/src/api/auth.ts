import { Context } from "hono";

export function checkToken(context: Context) {
  const headerToken = context.req.header("X-Golinks-Admin-Token")
	const apiKey = context.env.ADMIN_TOKEN

  if (headerToken === apiKey) {
	  return true
  } else {
	  return false
  }
}
