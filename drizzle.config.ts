import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    // Keep default in sync with src/lib/constants.ts (drizzle-kit runs outside
    // the app bundle, so it can't import that file)
    url: process.env.DB_PATH ?? "./data/claydate.db",
  },
} satisfies Config;
