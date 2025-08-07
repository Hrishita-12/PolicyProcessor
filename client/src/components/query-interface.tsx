import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, Search, Save, Plus, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface QueryInterfaceProps {
  documentId: string | null;
  onQueriesSubmitted: (results: any[]) => void;
}

export default function QueryInterface({ documentId, onQueriesSubmitted }: QueryInterfaceProps) {
  const [currentQuery, setCurrentQuery] = useState("Does this policy cover knee surgery, and what are the conditions?");
  const [batchQueries, setBatchQueries] = useState([
    "What is the grace period for premium payment?",
    "What is the waiting period for pre-existing diseases?",
  ]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: ApiClient.submitQueries,
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Processed ${data.results.length} queries successfully!`,
      });
      onQueriesSubmitted(data.results);
      
      // Invalidate stats to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process queries",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allQueries = currentQuery.trim() 
      ? [currentQuery, ...batchQueries]
      : batchQueries;

    if (allQueries.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one query",
        variant: "destructive",
      });
      return;
    }

    if (!documentId) {
      toast({
        title: "Error",
        description: "Please process a document first",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      documentId,
      queries: allQueries,
    });
  };

  const addQuery = () => {
    if (currentQuery.trim()) {
      setBatchQueries([...batchQueries, currentQuery.trim()]);
      setCurrentQuery("");
    }
  };

  const removeQuery = (index: number) => {
    setBatchQueries(batchQueries.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <HelpCircle className="w-5 h-5 mr-2 text-primary" />
          Query Interface
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Ask natural language questions about your documents</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="query-input" className="text-sm font-medium text-gray-700 mb-2 block">
              Your Query
            </Label>
            <Textarea
              id="query-input"
              rows={3}
              placeholder="Does this policy cover knee surgery, and what are the conditions?"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={submitMutation.isPending}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700">Batch Queries</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuery}
                disabled={!currentQuery.trim() || submitMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Query
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {batchQueries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No batch queries added</p>
              ) : (
                batchQueries.map((query, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 flex-1">{query}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuery(index)}
                      disabled={submitMutation.isPending}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-white hover:bg-primary/90 transition-colors"
              disabled={submitMutation.isPending || !documentId}
            >
              <Search className={`w-4 h-4 mr-2 ${submitMutation.isPending ? 'animate-spin' : ''}`} />
              {submitMutation.isPending ? 'Processing...' : 'Submit Query'}
            </Button>
            <Button type="button" variant="outline" disabled={submitMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
