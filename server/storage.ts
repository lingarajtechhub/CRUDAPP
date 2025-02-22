import { records, type Record, type InsertRecord } from "@shared/schema";
import { db } from "./db";
import { eq, like } from "drizzle-orm";

export interface IStorage {
  getRecords(): Promise<Record[]>;
  getRecord(id: number): Promise<Record | undefined>;
  createRecord(record: InsertRecord): Promise<Record>;
  updateRecord(id: number, record: InsertRecord): Promise<Record | undefined>;
  deleteRecord(id: number): Promise<boolean>;
  searchRecords(query: string): Promise<Record[]>;
}

export class DatabaseStorage implements IStorage {
  async getRecords(): Promise<Record[]> {
    return await db.select().from(records).orderBy(records.id);
  }

  async getRecord(id: number): Promise<Record | undefined> {
    const [record] = await db.select().from(records).where(eq(records.id, id));
    return record;
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    const [record] = await db
      .insert(records)
      .values({
        ...insertRecord,
        createdAt: new Date(),
      })
      .returning();
    return record;
  }

  async updateRecord(id: number, updateRecord: InsertRecord): Promise<Record | undefined> {
    // Use transaction to ensure atomic update
    return await db.transaction(async (tx) => {
      // Check if record exists within transaction
      const [existing] = await tx.select().from(records).where(eq(records.id, id));
      if (!existing) {
        return undefined;
      }

      // Perform update within same transaction
      const [updated] = await tx
        .update(records)
        .set(updateRecord)
        .where(eq(records.id, id))
        .returning();

      return updated;
    });
  }

  async deleteRecord(id: number): Promise<boolean> {
    // Use transaction to ensure atomic delete
    return await db.transaction(async (tx) => {
      // Check if record exists within transaction
      const [existing] = await tx.select().from(records).where(eq(records.id, id));
      if (!existing) {
        return false;
      }

      // Perform delete within same transaction
      const [deleted] = await tx
        .delete(records)
        .where(eq(records.id, id))
        .returning();

      return !!deleted;
    });
  }

  async searchRecords(query: string): Promise<Record[]> {
    if (!query) {
      return this.getRecords();
    }

    return await db
      .select()
      .from(records)
      .where(
        like(records.title, `%${query}%`)
      )
      .orderBy(records.id);
  }
}

export const storage = new DatabaseStorage();