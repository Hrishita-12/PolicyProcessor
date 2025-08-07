import { apiRequest } from "./queryClient";

export interface ProcessDocumentRequest {
  url: string;
  filename?: string;
  type?: string;
}

export interface ProcessDocumentResponse {
  success: boolean;
  documentId: string;
  message: string;
  chunksCreated: number;
}

export interface SubmitQueriesRequest {
  documentId?: string;
  queries: string[];
}

export interface QueryResult {
  queryId: string;
  question: string;
  answer: string;
  confidence: number;
  responseTime: number;
  relevantClauses?: Array<{
    section: string;
    content: string;
    similarity: number;
  }>;
  decisionLogic?: string[];
  error?: boolean;
}

export interface SubmitQueriesResponse {
  success: boolean;
  results: QueryResult[];
}

export interface SystemMetrics {
  id: string;
  documentsProcessed: number;
  queriesProcessed: number;
  avgResponseTime: string;
  accuracyRate: string;
  totalTokensUsed: number;
  vectorDbSize: number;
  lastUpdated: Date;
}

export interface ProcessingStep {
  step: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  duration?: number;
}

export interface ProcessingStatusResponse {
  steps: ProcessingStep[];
}

export class ApiClient {
  static async processDocument(data: ProcessDocumentRequest): Promise<ProcessDocumentResponse> {
    const response = await apiRequest("POST", "/api/documents/process", data);
    return await response.json();
  }

  static async submitQueries(data: SubmitQueriesRequest): Promise<SubmitQueriesResponse> {
    const response = await apiRequest("POST", "/api/queries/submit", data);
    return await response.json();
  }

  static async getDashboardStats(): Promise<SystemMetrics> {
    const response = await apiRequest("GET", "/api/dashboard/stats");
    return await response.json();
  }

  static async getProcessingStatus(documentId: string): Promise<ProcessingStatusResponse> {
    const response = await apiRequest("GET", `/api/processing/status/${documentId}`);
    return await response.json();
  }

  static async getRecentQueries(limit = 10) {
    const response = await apiRequest("GET", `/api/queries/recent?limit=${limit}`);
    return await response.json();
  }

  static async getDocuments() {
    const response = await apiRequest("GET", "/api/documents");
    return await response.json();
  }

  static async getSystemMetrics() {
    const response = await apiRequest("GET", "/api/system/metrics");
    return await response.json();
  }

  static async checkHealth() {
    const response = await apiRequest("GET", "/api/health");
    return await response.json();
  }
}
