import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentActivity() {
  const { data: recentQueries, isLoading } = useQuery({
    queryKey: ["/api/queries/recent"],
    queryFn: () => ApiClient.getRecentQueries(10),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card className="shadow-sm border">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <History className="w-5 h-5 mr-2 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Query</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card className="shadow-sm border">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <History className="w-5 h-5 mr-2 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Query</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!recentQueries || recentQueries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No recent activity</p>
                      <p className="text-sm">Process some queries to see activity here</p>
                    </td>
                  </tr>
                ) : (
                  recentQueries.map((query: any) => (
                    <tr key={query.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {new Date(query.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {query.documentId ? query.documentId.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-900 max-w-xs truncate">
                        {query.question}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={query.status === "completed" ? "default" : query.status === "failed" ? "destructive" : "secondary"}
                          className={query.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                        >
                          {query.status === "completed" ? "Success" : query.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {query.responseTime ? `${(query.responseTime / 1000).toFixed(1)}s` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
