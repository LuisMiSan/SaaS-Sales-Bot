import { pgTable, serial, text, integer, timestamp, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: doublePrecision("price").notNull(),
  attractiveness: text("attractiveness").notNull().default("normal"),
  km: integer("km").notNull().default(0),
  fuel: text("fuel").notNull().default("Diésel"),
  transmission: text("transmission").notNull().default("Manual"),
  location: text("location").notNull().default("Madrid"),
  imageUrl: text("image_url"),
  photos: text("photos").array(),
  videoUrl: text("video_url"),
  depositCents: integer("deposit_cents").notNull().default(20000),
  status: text("status").notNull().default("open"),
  // Extended specs
  description: text("description"),
  horsepower: integer("horsepower"),
  doors: integer("doors"),
  seats: integer("seats"),
  color: text("color"),
  bodyType: text("body_type"),
  engineCc: integer("engine_cc"),
  co2: integer("co2"),
  consumptionUrban: doublePrecision("consumption_urban"),
  consumptionHighway: doublePrecision("consumption_highway"),
  consumptionMixed: doublePrecision("consumption_mixed"),
  // Timestamps & meta
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  availableUntil: timestamp("available_until", { withTimezone: true }).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  viewersNow: integer("viewers_now").notNull().default(0),
  notes: text("notes"),
  marketPriceMin: integer("market_price_min"),
  marketPriceMax: integer("market_price_max"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Car = typeof carsTable.$inferSelect;
export type InsertCar = typeof carsTable.$inferInsert;

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  carId: integer("car_id").notNull(),
  stage: text("stage").notNull().default("new"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  unreadCount: integer("unread_count").notNull().default(0),
  avatarColor: text("avatar_color").notNull().default("#7c3aed"),
  publicToken: text("public_token").notNull().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Lead = typeof leadsTable.$inferSelect;

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  direction: text("direction").notNull(),
  content: text("content").notNull(),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  intent: text("intent"),
  waMessageId: text("wa_message_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Message = typeof messagesTable.$inferSelect;

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  text: text("text").notNull(),
  leadName: text("lead_name"),
  carLabel: text("car_label"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;

export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Setting = typeof settingsTable.$inferSelect;
