import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  type: text("type").notNull(), // 'pdf', 'docx', 'email'
  category: text("category"), // 'insurance', 'legal', 'hr', 'compliance'
  content: text("content"),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  question: text("question").notNull(),
  answer: text("answer"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  responseTime: integer("response_time"), // milliseconds
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  relevantClauses: jsonb("relevant_clauses"),
  decisionLogic: jsonb("decision_logic"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vectorEmbeddings = pgTable("vector_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embedding: jsonb("embedding"), // Store as JSON array
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentsProcessed: integer("documents_processed").default(0),
  queriesProcessed: integer("queries_processed").default(0),
  avgResponseTime: decimal("avg_response_time", { precision: 5, scale: 2 }).default(sql`0`),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }).default(sql`0`),
  totalTokensUsed: integer("total_tokens_used").default(0),
  vectorDbSize: integer("vector_db_size").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
});

export const insertVectorEmbeddingSchema = createInsertSchema(vectorEmbeddings).omit({
  id: true,
  createdAt: true,
});

// Query request schema for API
export const queryRequestSchema = z.object({
  documents: z.string().url(),
  questions: z.array(z.string()),
});

// Query response schema
export const queryResponseSchema = z.object({
  answers: z.array(z.string()),
});

// Types
export type Document = typeof documents.$inferSelect;
export type Query = typeof queries.$inferSelect;
export type VectorEmbedding = typeof vectorEmbeddings.$inferSelect;
export type SystemMetrics = typeof systemMetrics.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type InsertVectorEmbedding = z.infer<typeof insertVectorEmbeddingSchema>;

export type QueryRequest = z.infer<typeof queryRequestSchema>;
export type QueryResponse = z.infer<typeof queryResponseSchema>;

// Processing pipeline status
export const ProcessingStep = z.enum([
  "document_parsing",
  "embedding_generation", 
  "semantic_search",
  "llm_processing",
  "completed"
]);

export type ProcessingStep = z.infer<typeof ProcessingStep>;

export interface ProcessingStatus {
  step: ProcessingStep;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  duration?: number;
}
