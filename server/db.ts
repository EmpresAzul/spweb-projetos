import { and, count, desc, eq, gt, gte, inArray, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { adminSessions, InsertUser, leads, NewLead, rateLimitBuckets, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createLead(row: NewLead): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(leads).values(row);
}

export async function countLeads(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [row] = await db.select({ value: count() }).from(leads);
  return Number(row?.value ?? 0);
}

export async function searchLeads(input: { page: number; pageSize: number; query?: string; revenueBand?: string; from?: Date; toExclusive?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const predicates = [];
  if (input.query) {
    const pattern = `%${input.query.replace(/[\\%_]/g, "\\$&")}%`;
    predicates.push(or(like(leads.name, pattern), like(leads.company, pattern), like(leads.email, pattern))!);
  }
  if (input.revenueBand) predicates.push(eq(leads.revenueBand, input.revenueBand));
  if (input.from) predicates.push(gte(leads.createdAt, input.from));
  if (input.toExclusive) predicates.push(lt(leads.createdAt, input.toExclusive));
  const where = predicates.length ? and(...predicates) : undefined;
  const rows = await db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
  const [total] = await db.select({ value: count() }).from(leads).where(where);
  return { items: rows, total: Number(total?.value ?? 0) };
}

export async function allLeads(input: { query?: string; revenueBand?: string; from?: Date; toExclusive?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const predicates = [];
  if (input.query) {
    const pattern = `%${input.query.replace(/[\\%_]/g, "\\$&")}%`;
    predicates.push(or(like(leads.name, pattern), like(leads.company, pattern), like(leads.email, pattern))!);
  }
  if (input.revenueBand) predicates.push(eq(leads.revenueBand, input.revenueBand));
  if (input.from) predicates.push(gte(leads.createdAt, input.from));
  if (input.toExclusive) predicates.push(lt(leads.createdAt, input.toExclusive));
  return db.select().from(leads).where(predicates.length ? and(...predicates) : undefined).orderBy(desc(leads.createdAt));
}

export async function deleteLeadsByIds(ids: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (ids.length) await db.delete(leads).where(inArray(leads.id, ids));
}

export async function storeAdminSession(row: typeof adminSessions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(adminSessions).values(row);
}

export async function findAdminSession(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(adminSessions).where(and(eq(adminSessions.tokenHash, tokenHash), gt(adminSessions.expiresAt, new Date()))).limit(1);
  return rows[0];
}

export async function removeAdminSession(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
}

export async function consumeRateLimitSlot(bucketKey: string, windowMs: number, max: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const now = new Date();
    await tx.insert(rateLimitBuckets).values({
      bucketKey, count: 0, windowStartedAt: now, expiresAt: new Date(now.getTime() + windowMs),
    }).onDuplicateKeyUpdate({ set: { bucketKey: sql`bucketKey` } });
    const [bucket] = await tx.select().from(rateLimitBuckets)
      .where(eq(rateLimitBuckets.bucketKey, bucketKey)).limit(1).for("update");
    if (!bucket) throw new Error("Rate limit bucket was not created");
    if (bucket.windowStartedAt.getTime() + windowMs <= now.getTime()) {
      await tx.update(rateLimitBuckets).set({ count: 1, windowStartedAt: now, expiresAt: new Date(now.getTime() + windowMs) })
        .where(eq(rateLimitBuckets.bucketKey, bucketKey));
      return true;
    }
    if (bucket.count >= max) return false;
    await tx.update(rateLimitBuckets).set({ count: bucket.count + 1 })
      .where(eq(rateLimitBuckets.bucketKey, bucketKey));
    return true;
  });
}

export async function deleteExpiredRateLimitBuckets(retentionMs = 24 * 60 * 60 * 1000): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.expiresAt, new Date(Date.now() - retentionMs)));
}
