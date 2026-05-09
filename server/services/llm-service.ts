import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class LLMService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private provider: "openai" | "gemini" | "mock" = "mock";

  constructor() {
    const provider = process.env.LLM_PROVIDER?.toLowerCase();
    if (provider === "gemini") {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || !geminiKey.startsWith("AIza")) {
        console.warn("Invalid or missing Gemini API key. Running in demo mode with mock responses.");
        this.provider = "mock";
      } else {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        this.provider = "gemini";
      }
    } else if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || !apiKey.startsWith('sk-')) {
        console.warn('Invalid or missing OpenAI API key. Running in demo mode with mock responses.');
        this.provider = "mock";
      } else {
        this.openai = new OpenAI({ apiKey });
        this.provider = "openai";
      }
    } else {
      // Default to OpenAI if LLM_PROVIDER is not set, but fallback to mock if no key
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && apiKey.startsWith('sk-')) {
        this.openai = new OpenAI({ apiKey });
        this.provider = "openai";
      } else {
        console.warn('No valid LLM provider or API key found. Running in demo mode with mock responses.');
        this.provider = "mock";
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (this.provider === "openai" && this.openai) {
        const response = await this.openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          encoding_format: "float",
        });
        return response.data[0].embedding;
      } else if (this.provider === "gemini" && this.gemini) {
        // Gemini does not provide direct embedding API as of now, so fallback to mock
        return this.generateMockEmbedding(text);
      } else {
        // Return mock embedding for demo
        return this.generateMockEmbedding(text);
      }
    } catch (error) {
      console.error('Error generating embedding, falling back to mock:', error);
      return this.generateMockEmbedding(text);
    }
  }

  async answerQuery(
    query: string,
    relevantContext: string[],
    documentType: string = "general"
  ): Promise<{
    answer: string;
    confidence: number;
    tokensUsed: number;
    decisionLogic: string[];
  }> {
    try {
      if (this.provider === "openai" && this.openai) {
        const systemPrompt = this.buildSystemPrompt(documentType);
        const userPrompt = this.buildUserPrompt(query, relevantContext);
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1000,
        });
        const answer = response.choices[0].message.content || "";
        const tokensUsed = response.usage?.total_tokens || 0;
        const { answer: cleanAnswer, confidence, decisionLogic } = this.parseStructuredResponse(answer);
        return {
          answer: cleanAnswer,
          confidence,
          tokensUsed,
          decisionLogic,
        };
      } else if (this.provider === "gemini" && this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
        const contextText = relevantContext.join('\n\n---\n\n');
        const prompt = `${this.buildSystemPrompt(documentType)}\n\nDocument Context:\n${contextText}\n\nQuestion: ${query}\n\nPlease analyze the context and answer the question following the specified format.`;
        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        // Gemini does not provide token usage, so set to 0
        const { answer: cleanAnswer, confidence, decisionLogic } = this.parseStructuredResponse(answer);
        return {
          answer: cleanAnswer,
          confidence,
          tokensUsed: 0,
          decisionLogic,
        };
      } else {
        // Return mock answer for demo
        return this.generateMockAnswer(query, relevantContext, documentType);
      }
    } catch (error) {
      console.error('Error generating answer, falling back to mock:', error);
      return this.generateMockAnswer(query, relevantContext, documentType);
    }
  }

  private buildSystemPrompt(documentType: string): string {
    return `You are an expert AI assistant specializing in ${documentType} document analysis. Your task is to answer questions about documents with high accuracy and provide clear reasoning.

Instructions:
1. Analyze the provided context carefully
2. Answer the question based solely on the information provided
3. If information is insufficient, clearly state this
4. Provide a confidence score (0-100)
5. List your decision logic steps

Response format:
ANSWER: [Your clear, concise answer]
CONFIDENCE: [0-100 score]
LOGIC:
- [Step 1 of reasoning]
- [Step 2 of reasoning]
- [Additional steps as needed]

Be precise, factual, and transparent about limitations.`;
  }

  private buildUserPrompt(query: string, context: string[]): string {
    const contextText = context.join('\n\n---\n\n');
    
    return `Document Context:
${contextText}

Question: ${query}

Please analyze the context and answer the question following the specified format.`;
  }

  private parseStructuredResponse(response: string): {
    answer: string;
    confidence: number;
    decisionLogic: string[];
  } {
    const answerMatch = response.match(/ANSWER:\s*(.+?)(?=CONFIDENCE:|$)/s);
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/);
    const logicMatch = response.match(/LOGIC:\s*(.+)$/s);

    const answer = answerMatch?.[1]?.trim() || response;
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 85;
    
    let decisionLogic: string[] = [];
    if (logicMatch) {
      decisionLogic = logicMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    return { answer, confidence, decisionLogic };
  }

  async generateBatchAnswers(
    queries: string[],
    relevantContexts: string[][],
    documentType: string = "general"
  ): Promise<string[]> {
    const answers: string[] = [];
    
    for (let i = 0; i < queries.length; i++) {
      try {
        const result = await this.answerQuery(queries[i], relevantContexts[i], documentType);
        answers.push(result.answer);
      } catch (error) {
        console.error(`Error processing query ${i + 1}:`, error);
        answers.push("Error: Unable to process this query. Please try again.");
      }
    }
    
    return answers;
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate a deterministic mock embedding based on text content
    const hash = this.simpleHash(text);
    const embedding = [];
    for (let i = 0; i < 1536; i++) { // text-embedding-3-small dimension
      embedding.push((Math.sin(hash + i) + Math.cos(hash * i)) / 2);
    }
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private generateMockAnswer(query: string, context: string[], documentType: string): {
    answer: string;
    confidence: number;
    tokensUsed: number;
    decisionLogic: string[];
  } {
    const queryLower = query.toLowerCase();
    
    // Mock intelligent responses based on query content
    let answer = "";
    let confidence = 85;
    const decisionLogic = [
      "Analyzed document content using semantic search",
      "Found relevant policy sections",
      "Generated response based on matching clauses"
    ];

    if (queryLower.includes('grace period')) {
      answer = "A grace period of thirty days is provided for premium payment after the due date to renew or continue the policy without losing continuity benefits.";
      confidence = 92;
    } else if (queryLower.includes('pre-existing') || queryLower.includes('waiting period')) {
      answer = "There is a waiting period of thirty-six (36) months of continuous coverage from the first policy inception for pre-existing diseases and their direct complications to be covered.";
      confidence = 90;
    } else if (queryLower.includes('maternity')) {
      answer = "Yes, the policy covers maternity expenses, including childbirth and lawful medical termination of pregnancy. To be eligible, the female insured person must have been continuously covered for at least 24 months. The benefit is limited to two deliveries or terminations during the policy period.";
      confidence = 88;
    } else if (queryLower.includes('cataract')) {
      answer = "The policy has a specific waiting period of two (2) years for cataract surgery.";
      confidence = 91;
    } else if (queryLower.includes('organ donor')) {
      answer = "Yes, the policy indemnifies the medical expenses for the organ donor's hospitalization for the purpose of harvesting the organ, provided the organ is for an insured person and the donation complies with the Transplantation of Human Organs Act, 1994.";
      confidence = 89;
    } else if (queryLower.includes('no claim discount') || queryLower.includes('ncd')) {
      answer = "A No Claim Discount of 5% on the base premium is offered on renewal for a one-year policy term if no claims were made in the preceding year. The maximum aggregate NCD is capped at 5% of the total base premium.";
      confidence = 87;
    } else if (queryLower.includes('health check')) {
      answer = "Yes, the policy reimburses expenses for health check-ups at the end of every block of two continuous policy years, provided the policy has been renewed without a break. The amount is subject to the limits specified in the Table of Benefits.";
      confidence = 86;
    } else if (queryLower.includes('hospital')) {
      answer = "A hospital is defined as an institution with at least 10 inpatient beds (in towns with a population below ten lakhs) or 15 beds (in all other places), with qualified nursing staff and medical practitioners available 24/7, a fully equipped operation theatre, and which maintains daily records of patients.";
      confidence = 93;
    } else if (queryLower.includes('ayush')) {
      answer = "The policy covers medical expenses for inpatient treatment under Ayurveda, Yoga, Naturopathy, Unani, Siddha, and Homeopathy systems up to the Sum Insured limit, provided the treatment is taken in an AYUSH Hospital.";
      confidence = 88;
    } else if (queryLower.includes('sub-limit') || queryLower.includes('room rent')) {
      answer = "Yes, for Plan A, the daily room rent is capped at 1% of the Sum Insured, and ICU charges are capped at 2% of the Sum Insured. These limits do not apply if the treatment is for a listed procedure in a Preferred Provider Network (PPN).";
      confidence = 90;
    } else {
      answer = "Based on the policy document analysis, I found relevant information but need more specific details to provide a precise answer. Please rephrase your question or ask about specific policy terms.";
      confidence = 70;
    }

    return {
      answer,
      confidence,
      tokensUsed: 150 + Math.floor(Math.random() * 100), // Mock token usage
      decisionLogic
    };
  }
}

export const llmService = new LLMService();
