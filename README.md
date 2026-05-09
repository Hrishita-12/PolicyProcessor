# PolicyProcessor - LLM Document Query System

## Overview

This is an AI-powered document processing and query system designed for handling insurance, legal, HR, and compliance documents. The system uses advanced LLM capabilities combined with vector search to provide intelligent document analysis and natural language querying. It processes documents (PDF, DOCX, email), extracts structured information, creates semantic embeddings, and provides explainable AI responses to user queries.

## Recent Changes (August 7, 2025)

- **Fixed Document Processing Pipeline**: Resolved infinite polling loop by implementing proper completion status
- **Demo Mode Implementation**: Added intelligent mock responses for insurance policy queries when API keys are unavailable
- **HackRX Competition Endpoint**: Created `/api/v1/hackrx/run` endpoint for competition submissions
- **Improved Error Handling**: Added fallback mechanisms for API failures with realistic mock data
- **Document Upload Flow**: Fixed processing status updates and polling termination

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern component-based UI using functional components and hooks
- **Vite**: Development server and build tool for fast hot module replacement
- **TailwindCSS + Shadcn/ui**: Utility-first styling with pre-built accessible component library
- **Tanstack Query**: Server state management with automatic caching and background updates
- **Wouter**: Lightweight client-side routing

### Backend Architecture
- **Express.js**: RESTful API server with middleware for logging and error handling
- **TypeScript**: Full type safety across the entire backend
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **In-Memory Storage**: Current implementation uses memory storage with interface for database migration
- **Service Layer Pattern**: Separated business logic into dedicated services (document processor, LLM service, vector service)

### Database Design
- **PostgreSQL**: Primary database with Drizzle schema definitions
- **Tables**: documents, queries, vector_embeddings, system_metrics
- **Vector Storage**: Embeddings stored as JSON arrays in PostgreSQL with semantic search capabilities

### AI/ML Integration
- **OpenAI GPT-4**: Primary LLM for text generation and document analysis
- **OpenAI Embeddings API**: Text-embedding-3-small model for semantic vector creation
- **Vector Search**: Cosine similarity search for finding relevant document chunks
- **Chunking Strategy**: Documents split into semantic chunks for better retrieval accuracy

### Document Processing Pipeline
1. **Document Ingestion**: URL-based document input with support for PDF, DOCX, and email formats
2. **Content Extraction**: Text extraction from various document formats
3. **Semantic Chunking**: Intelligent text segmentation for optimal embedding quality
4. **Vector Generation**: OpenAI embeddings for each chunk
5. **Storage**: Persistent storage of documents, chunks, and embeddings

### Query Processing Workflow
1. **Query Embedding**: Convert natural language query to vector representation
2. **Semantic Search**: Find most relevant document chunks using vector similarity
3. **Context Assembly**: Compile relevant chunks for LLM context
4. **LLM Processing**: Generate answers with confidence scores and decision rationale
5. **Response Formatting**: Structure output with explainable AI components

### Real-time Features
- **Live Dashboard**: Real-time metrics and system status updates
- **Processing Status**: Live updates on document processing progress
- **Activity Monitoring**: Recent query history and performance metrics

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4 for text generation, text-embedding-3-small for vector embeddings
- **Environment Variables**: OPENAI_API_KEY for authentication

### Database
- **Neon Database**: Serverless PostgreSQL with @neondatabase/serverless driver
- **Connection**: DATABASE_URL environment variable for connection string

### Document Processing
- **PDF Processing**: Built-in PDF text extraction capabilities
- **DOCX Processing**: docx-parser library for Word document handling
- **Email Processing**: Planned support for email document analysis

### Development Tools
- **ESBuild**: Fast bundling for production builds
- **TSX**: TypeScript execution for development server
- **Replit Integration**: Development environment with vite-plugin-runtime-error-modal

### UI Components
- **Radix UI**: Headless components for accessibility (@radix-ui/react-*)
- **Lucide Icons**: Consistent iconography throughout the application
- **Date Handling**: date-fns for date manipulation and formatting

### Monitoring & Analytics
- **Health Checks**: API endpoint monitoring and system status tracking
- **Performance Metrics**: Response time tracking, token usage, and accuracy measurements
- **Error Handling**: Comprehensive error boundary and logging system

  
## Environment setup

Create a `.env` file in the `PolicyProcessor` directory with the following variables:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_key_here
# Or for Gemini
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=AIzaYour_Gemini_key_here

# Optional
PORT=5000
```

The server now loads `.env` automatically via `dotenv/config`.




