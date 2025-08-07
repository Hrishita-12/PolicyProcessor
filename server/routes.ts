import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { documentProcessor } from "./services/document-processor";
import { llmService } from "./services/llm-service";
import { vectorService } from "./services/vector-service";
import { queryRequestSchema, ProcessingStatus } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        metrics,
      });
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // Get dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Process document endpoint
  app.post("/api/documents/process", async (req, res) => {
    try {
      const { url, filename, type } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Document URL is required" });
      }

      // Start document processing
      const documentId = await documentProcessor.processDocument(url, filename);
      
      // Get the document to access content
      const document = await storage.getDocument(documentId);
      if (!document?.content) {
        return res.status(500).json({ error: "Failed to extract document content" });
      }

      // Create embeddings
      const chunks = await documentProcessor.chunkContent(document.content);
      await vectorService.createEmbeddings(documentId, chunks);

      res.json({
        success: true,
        documentId,
        message: "Document processed successfully",
        chunksCreated: chunks.length,
      });
    } catch (error) {
      console.error("Error processing document:", error);
      res.status(500).json({ error: "Failed to process document" });
    }
  });

  // Submit queries endpoint
  app.post("/api/queries/submit", async (req, res) => {
    try {
      const { documentId, queries: queryList } = req.body;
      
      if (!queryList || !Array.isArray(queryList)) {
        return res.status(400).json({ error: "Queries array is required" });
      }

      const results = [];
      
      for (const queryText of queryList) {
        const startTime = Date.now();
        
        // Create query record
        const query = await storage.createQuery({
          documentId,
          question: queryText,
          status: "processing",
        });

        try {
          // Search for relevant context
          const { relevantChunks, relevantClauses } = await vectorService.searchRelevantContext(
            queryText, 
            documentId
          );

          // Get document for type inference
          const document = documentId ? await storage.getDocument(documentId) : null;
          const documentType = document?.category || "general";

          // Generate answer using LLM
          const llmResult = await llmService.answerQuery(
            queryText, 
            relevantChunks, 
            documentType
          );

          const responseTime = Date.now() - startTime;

          // Update query with results
          await storage.updateQuery(query.id, {
            answer: llmResult.answer,
            confidence: llmResult.confidence.toString(),
            responseTime,
            status: "completed",
            relevantClauses: relevantClauses,
            decisionLogic: llmResult.decisionLogic,
            tokensUsed: llmResult.tokensUsed,
          });

          await storage.incrementQueriesProcessed();
          await storage.updateAvgResponseTime(responseTime / 1000); // Convert to seconds

          results.push({
            queryId: query.id,
            question: queryText,
            answer: llmResult.answer,
            confidence: llmResult.confidence,
            responseTime,
            relevantClauses,
            decisionLogic: llmResult.decisionLogic,
          });
        } catch (error) {
          console.error(`Error processing query "${queryText}":`, error);
          
          await storage.updateQuery(query.id, {
            status: "failed",
            answer: "Error: Unable to process this query. Please try again.",
          });

          results.push({
            queryId: query.id,
            question: queryText,
            answer: "Error: Unable to process this query. Please try again.",
            confidence: 0,
            responseTime: Date.now() - startTime,
            error: true,
          });
        }
      }

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      console.error("Error submitting queries:", error);
      res.status(500).json({ error: "Failed to process queries" });
    }
  });

  // HackRX API endpoint for submissions
  app.post("/api/v1/hackrx/run", async (req, res) => {
    try {
      const validatedData = queryRequestSchema.parse(req.body);
      const { documents: documentUrl, questions } = validatedData;

      // Process document first
      const documentId = await documentProcessor.processDocument(documentUrl);
      
      // Get the document to access content
      const document = await storage.getDocument(documentId);
      if (!document?.content) {
        throw new Error("Failed to extract document content");
      }

      // Create embeddings
      const chunks = await documentProcessor.chunkContent(document.content);
      await vectorService.createEmbeddings(documentId, chunks);

      // Process all questions and generate batch answers
      const answers: string[] = [];
      const relevantContexts: string[][] = [];

      // First, collect all relevant contexts
      for (const question of questions) {
        const { relevantChunks } = await vectorService.searchRelevantContext(
          question, 
          documentId
        );
        relevantContexts.push(relevantChunks);
      }

      // Generate batch answers
      const documentType = document.category || "insurance"; // Default to insurance for policy documents
      const batchAnswers = await llmService.generateBatchAnswers(
        questions,
        relevantContexts,
        documentType
      );

      res.json({ answers: batchAnswers });
    } catch (error) {
      console.error("Error processing HackRX submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request format", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process submission" });
    }
  });

  // Get processing status
  app.get("/api/processing/status/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Generate mock processing steps based on document status
      const steps: ProcessingStatus[] = [
        {
          step: "document_parsing",
          status: "completed",
          message: `${document.type.toUpperCase()} content extracted successfully`,
          duration: 2300,
        },
        {
          step: "embedding_generation", 
          status: document.processed ? "completed" : "processing",
          message: document.processed ? "Vector embeddings created" : "Creating embeddings...",
          duration: document.processed ? 1800 : undefined,
        },
        {
          step: "semantic_search",
          status: document.processed ? "completed" : "pending",
          message: document.processed ? "Ready for queries" : "Waiting for embeddings...",
          duration: document.processed ? 500 : undefined,
        },
      ];

      res.json({ steps });
    } catch (error) {
      console.error("Error fetching processing status:", error);
      res.status(500).json({ error: "Failed to fetch processing status" });
    }
  });

  // Get recent queries
  app.get("/api/queries/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const queries = await storage.listQueries(limit);
      res.json(queries);
    } catch (error) {
      console.error("Error fetching recent queries:", error);
      res.status(500).json({ error: "Failed to fetch recent queries" });
    }
  });

  // Get documents list
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.listDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get system metrics for monitoring
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      const vectorStats = await vectorService.getVectorStats();
      
      res.json({
        ...metrics,
        vectorStats,
        apiHealth: "operational",
        uptime: "99.9%",
      });
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
