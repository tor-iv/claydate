import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DB_PATH ?? "./data/claydate.db",
  },
} satisfies Config;
