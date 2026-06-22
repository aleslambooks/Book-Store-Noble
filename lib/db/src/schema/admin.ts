import { pgTable, serial, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "manager", "support"]);

export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("manager"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: serial("admin_id").references(() => adminUsersTable.id),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  adminId: serial("admin_id"),
  adminName: text("admin_name").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull().default(""),
  ipAddress: text("ip_address").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AdminUser = typeof adminUsersTable.$inferSelect;
export type AdminSession = typeof adminSessionsTable.$inferSelect;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type SiteSetting = typeof siteSettingsTable.$inferSelect;
