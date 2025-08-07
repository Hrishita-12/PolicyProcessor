import { Brain, Cog } from "lucide-react";
import DashboardStats from "@/components/dashboard-stats";
import DocumentUpload from "@/components/document-upload";
import QueryInterface from "@/components/query-interface";
import ProcessingStatus from "@/components/processing-status";
import QueryResults from "@/components/query-results";
import ExplainableAI from "@/components/explainable-ai";
import SystemMetrics from "@/components/system-metrics";
import RecentActivity from "@/components/recent-activity";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Dashboard() {
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<any[]>([]);

  // Check API health
  const { data: healthStatus } = useQuery({
    queryKey: ["/api/health"],
    queryFn: () => ApiClient.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  const isApiOnline = healthStatus?.status === "healthy";

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Brain className="text-2xl w-6 h-6" />
              <h1 className="text-xl font-bold">LLM Document Query System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isApiOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>API {isApiOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white">
                <Cog className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Statistics */}
        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Document Processing */}
          <div className="lg:col-span-2 space-y-8">
            <DocumentUpload onDocumentProcessed={setCurrentDocumentId} />
            <QueryInterface 
              documentId={currentDocumentId} 
              onQueriesSubmitted={setCurrentResults}
            />
            {currentDocumentId && (
              <ProcessingStatus documentId={currentDocumentId} />
            )}
          </div>

          {/* Right Column - Results & Analytics */}
          <div className="space-y-8">
            <QueryResults results={currentResults} />
            <ExplainableAI results={currentResults} />
            <SystemMetrics />
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600">
              © 2024 LLM Document Query System. Built with FastAPI, GPT-4, and FAISS.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>API Version:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">v1.0.0</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Uptime:</span>
                <span className="text-green-600">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
