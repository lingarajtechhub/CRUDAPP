import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: any;
}

// Get the base URL for displaying absolute URLs
const baseUrl = window.location.origin;

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/records",
    description: "List all records",
  },
  {
    method: "GET",
    path: "/api/records/search",
    description: "Search records",
  },
  {
    method: "POST",
    path: "/api/records",
    description: "Create a new record",
    requestBody: {
      title: "Sample Title",
      description: "Sample Description",
      status: "todo",
      priority: "medium"
    }
  },
  {
    method: "PATCH",
    path: "/api/records/:id",
    description: "Update a record",
    requestBody: {
      title: "Updated Title",
      description: "Updated Description",
      status: "in_progress",
      priority: "high"
    }
  },
  {
    method: "DELETE",
    path: "/api/records/:id",
    description: "Delete a record"
  }
];

interface RequestState {
  loading: boolean;
  response?: any;
  error?: string;
}

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(
    selectedEndpoint.requestBody ? JSON.stringify(selectedEndpoint.requestBody, null, 2) : ""
  );
  const [requestState, setRequestState] = useState<RequestState>({ loading: false });
  const [params, setParams] = useState<Record<string, string>>({});
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEndpointChange = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : "");
    setRequestState({ loading: false });
    setParams({});
    setIsOperationInProgress(false);
    setShowDeleteConfirm(false);
  };

  const executeDelete = async () => {
    if (!params.id) {
      setRequestState({
        loading: false,
        error: "Please provide a record ID"
      });
      return;
    }

    setRequestState({ loading: true });
    try {
      const response = await apiRequest(
        "DELETE",
        `/api/records/${params.id}`
      );

      if (response.status === 204) {
        setRequestState({
          loading: false,
          response: {
            status: 204,
            data: { success: true, message: "Record successfully deleted" }
          }
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      } else {
        const errorData = await response.json();
        setRequestState({
          loading: false,
          error: errorData.message || "Failed to delete record"
        });
      }
    } catch (error) {
      setRequestState({
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const handleSendRequest = async () => {
    if (isOperationInProgress) {
      return;
    }

    if (selectedEndpoint.method === "DELETE") {
      setShowDeleteConfirm(true);
      return;
    }

    setIsOperationInProgress(true);
    setRequestState({ loading: true });

    try {
      let path = selectedEndpoint.path;

      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value);
      });

      if (path.includes("/search") && params.q) {
        path = `${path}?q=${encodeURIComponent(params.q)}`;
      }

      const response = await apiRequest(
        selectedEndpoint.method,
        path,
        selectedEndpoint.method !== "GET" && requestBody ? JSON.parse(requestBody) : undefined
      );

      if (selectedEndpoint.method === "PATCH") {
        const responseData = await response.json();
        setRequestState({
          loading: false,
          response: {
            status: response.status,
            data: {
              success: true,
              message: "Record updated successfully",
              data: responseData.data
            }
          }
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/records"] });
        return;
      }

      const responseData = await response.json();
      setRequestState({
        loading: false,
        response: {
          status: response.status,
          data: responseData
        }
      });

      if (selectedEndpoint.method !== "GET") {
        await queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      }

    } catch (error) {
      setRequestState({
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const getFullUrl = () => {
    let url = baseUrl + selectedEndpoint.path;
    if (url.includes(":id") && params.id) {
      url = url.replace(":id", params.id);
    }
    if (selectedEndpoint.path.includes("/search") && params.q) {
      url += `?q=${encodeURIComponent(params.q)}`;
    }
    return url;
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b px-6 py-4">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Records
              </Button>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <div className="px-6 py-4">
              <h2 className="text-sm font-semibold text-muted-foreground">API ENDPOINTS</h2>
            </div>
            <SidebarMenu>
              {endpoints.map((endpoint) => (
                <SidebarMenuItem key={`${endpoint.method}-${endpoint.path}`}>
                  <SidebarMenuButton
                    onClick={() => handleEndpointChange(endpoint)}
                    isActive={selectedEndpoint.path === endpoint.path}
                    className="w-full justify-start px-6 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono px-2 py-1 rounded text-xs whitespace-nowrap ${
                        endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                        endpoint.method === 'PATCH' ? 'bg-yellow-100 text-yellow-700' :
                        endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {endpoint.method}
                      </span>
                      <span className="truncate text-sm">{endpoint.path}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          {/* Jumbotron Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
            <div className="container max-w-4xl mx-auto px-8 py-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">API Explorer</h1>
              <p className="text-lg text-muted-foreground">
                {selectedEndpoint.description}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="container max-w-4xl mx-auto px-8 py-8">
            <div className="space-y-8">
              {/* Request URL Section */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-sm font-medium mb-3">Request URL</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto font-mono text-sm">
                  {getFullUrl()}
                </pre>
              </div>

              {/* Parameters Section */}
              <div className="space-y-6">
                {selectedEndpoint.path.includes(":id") && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Record ID</h3>
                    <input
                      type="number"
                      className="w-full rounded-md border border-input bg-card px-4 py-2"
                      onChange={(e) => setParams({ ...params, id: e.target.value })}
                      placeholder="Enter record ID"
                      disabled={isOperationInProgress}
                      value={params.id || ''}
                    />
                  </div>
                )}

                {selectedEndpoint.path.includes("/search") && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Search Query</h3>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-card px-4 py-2"
                      onChange={(e) => setParams({ ...params, q: e.target.value })}
                      placeholder="Enter search term"
                      disabled={isOperationInProgress}
                      value={params.q || ''}
                    />
                  </div>
                )}

                {selectedEndpoint.requestBody && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Request Body</h3>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="font-mono text-sm min-h-[200px] bg-card"
                      disabled={isOperationInProgress}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {selectedEndpoint.method === "DELETE" ? (
                  <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={requestState.loading || isOperationInProgress}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Delete Record
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this record? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={executeDelete}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    onClick={handleSendRequest}
                    disabled={requestState.loading || isOperationInProgress}
                    className={`w-full ${
                      selectedEndpoint.method === 'PATCH' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                      selectedEndpoint.method === 'POST' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      ''
                    }`}
                  >
                    {requestState.loading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                )}

                {/* Response Section */}
                {(requestState.response || requestState.error) && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium mb-3">Response</h3>
                    <pre className={`p-6 rounded-lg overflow-auto max-h-96 font-mono text-sm ${
                      requestState.error ? 'bg-red-50 text-red-700' : 'bg-muted'
                    }`}>
                      {requestState.error ? (
                        requestState.error
                      ) : (
                        JSON.stringify(requestState.response, null, 2)
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}