import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Settings } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onDocumentProcessed: (documentId: string) => void;
}

export default function DocumentUpload({ onDocumentProcessed }: DocumentUploadProps) {
  const [sourceType, setSourceType] = useState("url");
  const [documentUrl, setDocumentUrl] = useState("https://hackrx.blob.core.windows.net/assets/policy.pdf?sv=2023-01-03...");
  const [documentType, setDocumentType] = useState("auto-detect");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: ApiClient.processDocument,
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Document processed successfully! Created ${data.chunksCreated} text chunks.`,
      });
      onDocumentProcessed(data.documentId);
      
      // Invalidate stats to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid document URL",
        variant: "destructive",
      });
      return;
    }

    processMutation.mutate({
      url: documentUrl,
      type: documentType === "auto-detect" ? undefined : documentType,
    });
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <Upload className="w-5 h-5 mr-2 text-primary" />
          Document Processing
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Upload and process PDF, DOCX, and email documents</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Document Source</Label>
            <RadioGroup value={sourceType} onValueChange={setSourceType} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="url" />
                <Label htmlFor="url" className="text-sm">Blob URL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="upload" />
                <Label htmlFor="upload" className="text-sm">File Upload</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="document-url" className="text-sm font-medium text-gray-700 mb-2 block">
              Document URL
            </Label>
            <Input
              id="document-url"
              type="url"
              placeholder="https://hackrx.blob.core.windows.net/assets/policy.pdf..."
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={processMutation.isPending}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-detect">Auto-detect</SelectItem>
                <SelectItem value="insurance">Insurance Policy</SelectItem>
                <SelectItem value="legal">Legal Contract</SelectItem>
                <SelectItem value="hr">HR Document</SelectItem>
                <SelectItem value="compliance">Compliance Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-white hover:bg-primary/90 transition-colors"
            disabled={processMutation.isPending}
          >
            <Settings className={`w-4 h-4 mr-2 ${processMutation.isPending ? 'animate-spin' : ''}`} />
            {processMutation.isPending ? 'Processing Document...' : 'Process Document'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
