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
    try {
      return await db.select().from(records).orderBy(records.id);
    } catch (error) {
      console.error('Error fetching records:', error);
      throw new Error('Failed to fetch records from database');
    }
  }

  async getRecord(id: number): Promise<Record | undefined> {
    try {
      const [record] = await db.select().from(records).where(eq(records.id, id));
      return record;
    } catch (error) {
      console.error(`Error fetching record ${id}:`, error);
      throw new Error('Failed to fetch record from database');
    }
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    try {
      const [record] = await db
        .insert(records)
        .values({
          ...insertRecord,
          createdAt: new Date(),
        })
        .returning();
      return record;
    } catch (error) {
      console.error('Error creating record:', error);
      throw new Error('Failed to create record in database');
    }
  }

  async updateRecord(id: number, updateRecord: InsertRecord): Promise<Record | undefined> {
    try {
      return await db.transaction(async (tx) => {
        const [existing] = await tx.select().from(records).where(eq(records.id, id));
        if (!existing) {
          return undefined;
        }

        const [updated] = await tx
          .update(records)
          .set(updateRecord)
          .where(eq(records.id, id))
          .returning();

        return updated;
      });
    } catch (error) {
      console.error(`Error updating record ${id}:`, error);
      throw new Error('Failed to update record in database');
    }
  }

  async deleteRecord(id: number): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        const [existing] = await tx.select().from(records).where(eq(records.id, id));
        if (!existing) {
          return false;
        }

        const [deleted] = await tx
          .delete(records)
          .where(eq(records.id, id))
          .returning();

        return !!deleted;
      });
    } catch (error) {
      console.error(`Error deleting record ${id}:`, error);
      throw new Error('Failed to delete record from database');
    }
  }

  async searchRecords(query: string): Promise<Record[]> {
    try {
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
    } catch (error) {
      console.error('Error searching records:', error);
      throw new Error('Failed to search records in database');
    }
  }
}

export const storage = new DatabaseStorage();