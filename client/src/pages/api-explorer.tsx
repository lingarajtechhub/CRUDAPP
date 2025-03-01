import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

// Register the JSON language for syntax highlighting
SyntaxHighlighter.registerLanguage('json', json);

interface Endpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: any;
}

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

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border dark:border-blue-800';
    case 'POST':
      return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border dark:border-green-800';
    case 'PATCH':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border dark:border-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:border dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 dark:border dark:border-gray-800';
  }
};

const isEndpointActive = (endpoint: Endpoint, selectedEndpoint: Endpoint): boolean => {
  if (!endpoint || !selectedEndpoint) return false;
  return endpoint.method === selectedEndpoint.method && endpoint.path === selectedEndpoint.path;
};

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [requestBody, setRequestBody] = useState<string>(
    selectedEndpoint?.requestBody ? JSON.stringify(selectedEndpoint.requestBody, null, 2) : ""
  );
  const [requestState, setRequestState] = useState<RequestState>({ loading: false });
  const [params, setParams] = useState<Record<string, string>>({});
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEndpointChange = (endpoint: Endpoint) => {
    if (!endpoint) return;
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
        <Sidebar className="border-r shadow-lg">
          <SidebarHeader className="border-b bg-card px-8 py-6">
            <div className="space-y-6">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-background hover:bg-accent shadow-sm transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-3" />
                  Back to Records
                </Button>
              </Link>
              <h2 className="text-sm font-semibold text-muted-foreground tracking-tight">
                API ENDPOINTS
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4">
            <SidebarMenu>
              {endpoints.map((endpoint, index) => (
                <SidebarMenuItem key={`${endpoint.method}-${endpoint.path}`}>
                  <SidebarMenuButton
                    onClick={() => handleEndpointChange(endpoint)}
                    isActive={isEndpointActive(endpoint, selectedEndpoint)}
                    className="w-full justify-start px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg relative"
                  >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-accent/10 text-accent-foreground ring-1 ring-accent/20 font-mono text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-4 ml-8">
                      <span className={`font-mono px-3 py-1.5 rounded text-xs whitespace-nowrap shadow-sm transition-colors ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <span className="truncate text-sm font-medium">{endpoint.path}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b shadow-sm">
            <div className="container max-w-4xl mx-auto px-8 py-10">
              <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">API Explorer</h1>
              <p className="text-lg text-muted-foreground">
                {selectedEndpoint.description}
              </p>
            </div>
          </div>

          <div className="container max-w-4xl mx-auto p-8">
            <div className="space-y-8">
              <Card className="shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="px-8 pt-8">
                  <CardTitle>Request Details</CardTitle>
                  <CardDescription>
                    Endpoint URL and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Request URL</h3>
                      <div className="bg-muted rounded-lg p-6 border shadow-inner">
                        <code className="text-sm">{getFullUrl()}</code>
                      </div>
                    </div>

                    {selectedEndpoint.path.includes(":id") && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Record ID</h3>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-input bg-background px-4 py-3 shadow-sm transition-colors focus:ring-2 focus:ring-ring"
                          onChange={(e) => setParams({ ...params, id: e.target.value })}
                          placeholder="Enter record ID"
                          disabled={isOperationInProgress}
                          value={params.id || ''}
                        />
                      </div>
                    )}

                    {selectedEndpoint.path.includes("/search") && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Search Query</h3>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-input bg-background px-4 py-3 shadow-sm transition-colors focus:ring-2 focus:ring-ring"
                          onChange={(e) => setParams({ ...params, q: e.target.value })}
                          placeholder="Enter search term"
                          disabled={isOperationInProgress}
                          value={params.q || ''}
                        />
                      </div>
                    )}

                    {selectedEndpoint.requestBody && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Request Body</h3>
                        <Textarea
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          className="font-mono text-sm min-h-[200px] bg-background shadow-inner rounded-lg px-4 py-3"
                          disabled={isOperationInProgress}
                          placeholder="Enter request body as JSON"
                        />
                      </div>
                    )}

                    <div className="pt-4">
                      {selectedEndpoint.method === "DELETE" ? (
                        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all duration-200 py-6"
                              disabled={requestState.loading || isOperationInProgress}
                            >
                              {requestState.loading ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                              ) : (
                                <Send className="w-5 h-5 mr-3" />
                              )}
                              Delete Record
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-[425px]">
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
                          className={`w-full shadow-sm transition-all duration-200 py-6 ${
                            selectedEndpoint.method === 'PATCH' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                              selectedEndpoint.method === 'POST' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                ''
                          }`}
                        >
                          {requestState.loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-3" />
                              Send Request
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(requestState.response || requestState.error) && (
                <Card className="shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="px-8 pt-8">
                    <CardTitle>Response</CardTitle>
                    <CardDescription>
                      {requestState.error ? 'Error details' : 'Response details'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <div className={`rounded-lg overflow-hidden shadow-inner ${
                      requestState.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'
                    }`}>
                      {requestState.error ? (
                        <div className="p-6 text-red-700 dark:text-red-300">
                          {requestState.error}
                        </div>
                      ) : (
                        <SyntaxHighlighter
                          language="json"
                          style={vs2015}
                          customStyle={{
                            margin: 0,
                            padding: '1.5rem',
                            background: 'transparent',
                          }}
                        >
                          {JSON.stringify(requestState.response, null, 2)}
                        </SyntaxHighlighter>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}