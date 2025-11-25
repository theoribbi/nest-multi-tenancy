import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),

    schemaName: text("schema_name").notNull().unique(),

    logoUrl: text("logo_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
