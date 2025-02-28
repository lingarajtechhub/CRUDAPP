import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="border-b">
            <Link href="/">
              <Button variant="ghost" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Records
              </Button>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {endpoints.map((endpoint) => (
                <SidebarMenuItem key={`${endpoint.method}-${endpoint.path}`}>
                  <SidebarMenuButton
                    onClick={() => handleEndpointChange(endpoint)}
                    isActive={selectedEndpoint.path === endpoint.path}
                    className="w-full justify-start"
                  >
                    <span className={`font-mono px-2 py-1 rounded text-xs ${
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                      endpoint.method === 'PATCH' ? 'bg-yellow-100 text-yellow-700' :
                      endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                      'bg-muted'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="ml-2">{endpoint.path}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">API Explorer</h1>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Full URL:</h3>
                <pre className="p-3 bg-muted rounded-md overflow-x-auto font-mono text-sm whitespace-pre-wrap break-all">
                  {getFullUrl()}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Description:</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEndpoint.description}
                </p>
              </div>

              {selectedEndpoint.path.includes(":id") && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Record ID:</h3>
                  <input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    onChange={(e) => setParams({ ...params, id: e.target.value })}
                    placeholder="Enter record ID"
                    disabled={isOperationInProgress}
                    value={params.id || ''}
                  />
                </div>
              )}

              {selectedEndpoint.path.includes("/search") && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Search Query:</h3>
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    onChange={(e) => setParams({ ...params, q: e.target.value })}
                    placeholder="Enter search term"
                    disabled={isOperationInProgress}
                    value={params.q || ''}
                  />
                </div>
              )}

              {selectedEndpoint.requestBody && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Request Body:</h3>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="font-mono text-sm"
                    rows={10}
                    disabled={isOperationInProgress}
                  />
                </div>
              )}

              {selectedEndpoint.method === "DELETE" ? (
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700"
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
                      <AlertDialogAction onClick={executeDelete}>
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
                    selectedEndpoint.method === 'PATCH' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    selectedEndpoint.method === 'POST' ? 'bg-green-600 hover:bg-green-700' :
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

              {(requestState.response || requestState.error) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Response:</h3>
                  <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 font-mono text-sm whitespace-pre-wrap">
                    {requestState.error ? (
                      <span className="text-red-500">{requestState.error}</span>
                    ) : (
                      JSON.stringify(requestState.response, null, 2)
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}