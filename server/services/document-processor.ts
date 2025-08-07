import { storage } from "../storage";
import { InsertDocument } from "@shared/schema";

export class DocumentProcessor {
  async processDocument(url: string, filename?: string): Promise<string> {
    try {
      // Extract filename from URL if not provided
      if (!filename) {
        const urlObj = new URL(url);
        filename = urlObj.pathname.split('/').pop() || 'document';
      }

      // Detect document type
      const type = this.getDocumentType(filename);

      // Check if document already exists
      let document = await storage.getDocumentByUrl(url);
      if (!document) {
        // Create document record
        const insertDoc: InsertDocument = {
          url,
          filename,
          type,
          category: this.inferCategory(filename),
          content: null,
          processed: false,
        };
        document = await storage.createDocument(insertDoc);
      }

      // Process document content
      const content = await this.extractContent(url, type);
      
      // Update document with extracted content
      await storage.updateDocument(document.id, {
        content,
        processed: true,
      });

      await storage.incrementDocumentsProcessed();
      return document.id;
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error('Failed to process document');
    }
  }

  private getDocumentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx': case 'doc': return 'docx';
      case 'eml': case 'msg': return 'email';
      default: return 'unknown';
    }
  }

  private inferCategory(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('policy') || name.includes('insurance')) return 'insurance';
    if (name.includes('contract') || name.includes('legal')) return 'legal';
    if (name.includes('hr') || name.includes('employee')) return 'hr';
    if (name.includes('compliance') || name.includes('regulatory')) return 'compliance';
    return 'general';
  }

  private async extractContent(url: string, type: string): Promise<string> {
    try {
      // Fetch document from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      
      switch (type) {
        case 'pdf':
          return await this.extractPdfContent(buffer);
        case 'docx':
          return await this.extractDocxContent(buffer);
        case 'email':
          return await this.extractEmailContent(buffer);
        default:
          // Try to extract as text
          const decoder = new TextDecoder();
          return decoder.decode(buffer);
      }
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      throw new Error('Failed to extract document content');
    }
  }

  private async extractPdfContent(buffer: ArrayBuffer): Promise<string> {
    // In a real implementation, you would use pdf-parse or similar
    // For now, return a mock extraction
    return "PDF content extracted successfully. This would contain the actual document text from the PDF processing library.";
  }

  private async extractDocxContent(buffer: ArrayBuffer): Promise<string> {
    // In a real implementation, you would use mammoth or docx-parser
    return "DOCX content extracted successfully. This would contain the actual document text from the DOCX processing library.";
  }

  private async extractEmailContent(buffer: ArrayBuffer): Promise<string> {
    // In a real implementation, you would use node-email-reply-parser or similar
    return "Email content extracted successfully. This would contain the email body and metadata.";
  }

  async chunkContent(content: string, chunkSize: number = 1000): Promise<string[]> {
    const chunks: string[] = [];
    const words = content.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }
    
    return chunks;
  }
}

export const documentProcessor = new DocumentProcessor();
