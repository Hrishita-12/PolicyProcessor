import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QueryResult {
  queryId: string;
  question: string;
  answer: string;
  confidence: number;
  responseTime: number;
  error?: boolean;
}

interface QueryResultsProps {
  results: QueryResult[];
}

export default function QueryResults({ results }: QueryResultsProps) {
  if (!results || results.length === 0) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <ClipboardList className="w-5 h-5 mr-2 text-primary" />
            Query Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No queries processed yet</p>
            <p className="text-sm text-gray-400">Submit a query to see results here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <ClipboardList className="w-5 h-5 mr-2 text-primary" />
          Query Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-96 w-full">
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={result.queryId || index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">Query #{index + 1}</h4>
                  <Badge 
                    variant={result.error ? "destructive" : "default"}
                    className={result.error ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}
                  >
                    {result.error ? "Failed" : "Success"}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{result.question}</p>
                
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="font-medium text-gray-700 mb-1">Answer:</p>
                  <p className="text-gray-600">{result.answer}</p>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Confidence: {result.confidence}%</span>
                  <span>Response time: {(result.responseTime / 1000).toFixed(1)}s</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
