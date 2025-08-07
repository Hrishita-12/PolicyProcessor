import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/system/metrics"],
    queryFn: () => ApiClient.getSystemMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tokenUsagePercentage = Math.min((metrics?.totalTokensUsed || 0) / 400000 * 100, 100);
  const vectorDbPercentage = Math.min((metrics?.vectorDbSize || 0) / 2000000 * 100, 100);

  return (
    <Card className="shadow-sm border">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <BarChart3 className="w-5 h-5 mr-2 text-primary" />
          System Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Token Usage</span>
              <span>{metrics?.totalTokensUsed?.toLocaleString() || '0'} / 400K</span>
            </div>
            <Progress value={tokenUsagePercentage} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Vector DB Size</span>
              <span>{(metrics?.vectorDbSize || 0) >= 1000000 
                ? `${((metrics?.vectorDbSize || 0) / 1000000).toFixed(1)}M embeddings`
                : `${(metrics?.vectorDbSize || 0).toLocaleString()} embeddings`}</span>
            </div>
            <Progress value={vectorDbPercentage} className="h-2" />
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Health</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-600">
                  {metrics?.apiHealth === "operational" ? "Operational" : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
