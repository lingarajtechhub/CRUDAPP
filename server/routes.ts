import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertRecordSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express) {
  app.get("/api/records", async (_req, res) => {
    const records = await storage.getRecords();
    res.json(records);
  });

  app.get("/api/records/search", async (req, res) => {
    const query = req.query.q as string || "";
    const records = await storage.searchRecords(query);
    res.json(records);
  });

  // Helper function to validate ID parameter
  function validateId(id: string): number | null {
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId.toString() !== id) {
      return null;
    }
    return parsedId;
  }

  app.get("/api/records/:id", async (req, res) => {
    const id = validateId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Invalid record ID. Please provide a valid number." });
    }

    const record = await storage.getRecord(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(record);
  });

  app.post("/api/records", async (req, res) => {
    try {
      const data = insertRecordSchema.parse(req.body);
      const record = await storage.createRecord(data);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      throw error;
    }
  });

  app.patch("/api/records/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "Invalid record ID. Please provide a valid number." });
      }

      const data = insertRecordSchema.parse(req.body);
      const record = await storage.updateRecord(id, data);

      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.json({ 
        success: true,
        message: "Record updated successfully",
        data: record 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating record:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/records/:id", async (req, res) => {
    try {
      const id = validateId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "Invalid record ID. Please provide a valid number." });
      }

      const success = await storage.deleteRecord(id);
      if (!success) {
        return res.status(404).json({ message: "Record not found" });
      }

      // Return 204 No Content as per API documentation
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting record:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return createServer(app);
}