import { OpenAI } from "openai";

export class LLMService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key";
    this.openai = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
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

      // Extract confidence and decision logic from the structured response
      const { answer: cleanAnswer, confidence, decisionLogic } = this.parseStructuredResponse(answer);

      return {
        answer: cleanAnswer,
        confidence,
        tokensUsed,
        decisionLogic,
      };
    } catch (error) {
      console.error('Error generating answer:', error);
      throw new Error('Failed to generate answer');
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
}

export const llmService = new LLMService();
