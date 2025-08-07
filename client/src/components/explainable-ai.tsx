import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CheckCircle, AlertTriangle } from "lucide-react";

interface QueryResult {
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
}

interface ExplainableAIProps {
  results: QueryResult[];
}

export default function ExplainableAI({ results }: ExplainableAIProps) {
  // Use the latest result for explanation
  const latestResult = results && results.length > 0 ? results[0] : null;

  if (!latestResult) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <Lightbulb className="w-5 h-5 mr-2 text-primary" />
            Decision Rationale
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No query results to explain</p>
            <p className="text-sm text-gray-400">Process queries to see decision rationale</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <Lightbulb className="w-5 h-5 mr-2 text-primary" />
          Decision Rationale
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Relevant Clauses */}
          {latestResult.relevantClauses && latestResult.relevantClauses.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Relevant Clauses Found</h4>
              <div className="space-y-2">
                {latestResult.relevantClauses.map((clause, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-blue-900">{clause.section}</span>
                      <span className="text-xs text-blue-700">
                        {Math.round(clause.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{clause.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Logic */}
          {latestResult.decisionLogic && latestResult.decisionLogic.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Decision Logic</h4>
              <div className="space-y-2 text-sm">
                {latestResult.decisionLogic.map((logic, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{logic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default explanation if no specific data */}
          {(!latestResult.relevantClauses || latestResult.relevantClauses.length === 0) &&
           (!latestResult.decisionLogic || latestResult.decisionLogic.length === 0) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Decision Logic</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Query processed using semantic search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Relevant document sections identified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Answer based on available document context</span>
                </div>
              </div>
            </div>
          )}

          {/* Confidence indicator */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Confidence</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-600">{latestResult.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
