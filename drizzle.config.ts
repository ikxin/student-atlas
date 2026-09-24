import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./lib/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: "47f01f8326b145d7b59da93a0e00f46e",
		databaseId: "e76bbbbf-e97b-42be-a348-33c35052b48f",
		token: process.env.CLOUDFLARE_D1_TOKEN!,
	},
});
