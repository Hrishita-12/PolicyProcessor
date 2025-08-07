import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface ProcessingStatusProps {
  documentId: string;
}

export default function ProcessingStatus({ documentId }: ProcessingStatusProps) {
  const { data: statusData, isLoading } = useQuery({
    queryKey: ["/api/processing/status", documentId],
    queryFn: () => ApiClient.getProcessingStatus(documentId),
    refetchInterval: (data) => {
      // Stop polling if all steps are completed
      if (data?.steps?.every(step => step.status === "completed")) {
        return false;
      }
      return 2000; // Continue polling every 2 seconds
    },
    enabled: !!documentId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "processing":
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case "failed":
        return <CheckCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "processing":
        return "bg-blue-50 border-blue-200";
      case "failed":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <Clock className="w-5 h-5 mr-2 text-primary" />
          Processing Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {statusData?.steps?.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-4 p-3 border rounded-lg transition-colors ${getStatusBgColor(step.status)}`}
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                  {getStatusIcon(step.status)}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 capitalize">
                  {step.step.replace('_', ' ')}
                </h4>
                <p className="text-sm text-gray-600">{step.message}</p>
              </div>
              <div className="text-sm text-gray-500">
                {step.duration ? `${step.duration / 1000}s` : step.status === "processing" ? "Processing..." : ""}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
