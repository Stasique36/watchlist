import { defineConfig } from "drizzle-kit";

process.loadEnvFile(".env.local");

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema/*",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
