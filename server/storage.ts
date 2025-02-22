import { records, type Record, type InsertRecord } from "@shared/schema";

export interface IStorage {
  getRecords(): Promise<Record[]>;
  getRecord(id: number): Promise<Record | undefined>;
  createRecord(record: InsertRecord): Promise<Record>;
  updateRecord(id: number, record: InsertRecord): Promise<Record | undefined>;
  deleteRecord(id: number): Promise<boolean>;
  searchRecords(query: string): Promise<Record[]>;
}

export class MemStorage implements IStorage {
  private records: Map<number, Record>;
  private currentId: number;

  constructor() {
    this.records = new Map();
    this.currentId = 1;
  }

  async getRecords(): Promise<Record[]> {
    return Array.from(this.records.values()).sort((a, b) => b.id - a.id);
  }

  async getRecord(id: number): Promise<Record | undefined> {
    return this.records.get(id);
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    const id = this.currentId++;
    const record: Record = {
      ...insertRecord,
      id,
      createdAt: new Date(),
    };
    this.records.set(id, record);
    return record;
  }

  async updateRecord(id: number, updateRecord: InsertRecord): Promise<Record | undefined> {
    const existing = this.records.get(id);
    if (!existing) return undefined;

    const updated: Record = {
      ...existing,
      ...updateRecord,
    };
    this.records.set(id, updated);
    return updated;
  }

  async deleteRecord(id: number): Promise<boolean> {
    return this.records.delete(id);
  }

  async searchRecords(query: string): Promise<Record[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.records.values()).filter(
      record =>
        record.title.toLowerCase().includes(searchTerm) ||
        record.description.toLowerCase().includes(searchTerm)
    ).sort((a, b) => b.id - a.id);
  }
}

export const storage = new MemStorage();
