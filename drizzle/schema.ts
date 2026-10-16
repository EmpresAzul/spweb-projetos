import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Users managed by the supplied Manus OAuth starter. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const leads = mysqlTable("spweb_leads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  company: varchar("company", { length: 180 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 24 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  revenueBand: varchar("revenueBand", { length: 40 }).notNull(),
  businessModel: varchar("businessModel", { length: 300 }).notNull(),
  investmentCapability: varchar("investmentCapability", { length: 10 }).notNull(),
  message: text("message"),
  consent: int("consent").notNull().default(1),
  consentAt: timestamp("consentAt").notNull(),
  source: varchar("source", { length: 100 }),
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  ipHash: varchar("ipHash", { length: 64 }).notNull(),
  userAgentSummary: varchar("userAgentSummary", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export const adminSessions = mysqlTable("spweb_admin_sessions", {
  tokenHash: varchar("tokenHash", { length: 64 }).primaryKey(),
  csrfHash: varchar("csrfHash", { length: 64 }).notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminSession = typeof adminSessions.$inferSelect;

/** Stores only HMAC-derived bucket keys, never client IP addresses. */
export const rateLimitBuckets = mysqlTable("spweb_rate_limit_buckets", {
  bucketKey: varchar("bucketKey", { length: 64 }).primaryKey(),
  count: int("count").notNull().default(0),
  windowStartedAt: timestamp("windowStartedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, table => ({ expiresAtIndex: index("spweb_rate_limit_expires_idx").on(table.expiresAt) }));
