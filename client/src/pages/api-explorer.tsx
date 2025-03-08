import * as React from "react";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send, Loader2, ChevronDown, FileJson, Plus, PencilLine } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

// Add some basic logging
console.log('ApiExplorer component is rendering');

// Register the JSON language for syntax highlighting
SyntaxHighlighter.registerLanguage('json', json);

interface Endpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: any;
}

const baseUrl = window.location.origin;

// Group endpoints by type
const endpointGroups = {
  read: [
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
  ],
  write: [
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
  ],
  modify: [
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
  ]
};

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

const getOperationIcon = (groupKey: string) => {
  switch (groupKey) {
    case 'read':
      return <FileJson className="h-4 w-4" />;
    case 'write':
      return <Plus className="h-4 w-4" />;
    case 'modify':
      return <PencilLine className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function ApiExplorer() {
  console.log('Starting ApiExplorer render');

  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpointGroups.read[0]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    read: true,
    write: false,
    modify: false
  });
  const [requestBody, setRequestBody] = useState<string>(
    selectedEndpoint?.requestBody ? JSON.stringify(selectedEndpoint.requestBody, null, 2) : ""
  );
  const [requestState, setRequestState] = useState<RequestState>({ loading: false });
  const [params, setParams] = useState<Record<string, string>>({});
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    console.log('ApiExplorer mounted');
  }, []);

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

      setRequestState({
        loading: false,
        response: {
          status: response.status,
          data: { success: true, message: "Record successfully deleted" }
        }
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/records"] });
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

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-screen bg-background" 
          style={{
            "--sidebar-width": "28rem",
            "--sidebar-width-mobile": "30rem",
            "--sidebar-width-icon": "4rem",
          } as React.CSSProperties}
        >
          <Sidebar 
            collapsible="icon" 
            variant="inset"
            className="border-r shadow-lg"
          >
            <SidebarHeader className="border-b bg-card px-8 py-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="justify-start bg-background hover:bg-accent shadow-sm transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-3" />
                      Back
                    </Button>
                  </Link>
                  <SidebarTrigger />
                </div>
                <h2 className="text-sm font-semibold text-muted-foreground tracking-tight mb-4">
                  API ENDPOINTS
                </h2>
              </div>
            </SidebarHeader>
            <SidebarContent className="px-4">
              <SidebarMenu>
                {Object.entries(endpointGroups).map(([groupKey, endpoints], groupIndex) => (
                  <Collapsible
                    key={groupKey}
                    open={openSections[groupKey]}
                    onOpenChange={() => toggleSection(groupKey)}
                    className="mb-4"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                      <span className="flex items-center gap-2">
                        {getOperationIcon(groupKey)}
                        <span className="capitalize">{groupKey} Operations</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        openSections[groupKey] ? 'transform rotate-180' : ''
                      }`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {endpoints.map((endpoint, index) => (
                        <SidebarMenuItem key={`${endpoint.method}-${endpoint.path}`}>
                          <SidebarMenuButton
                            onClick={() => handleEndpointChange(endpoint)}
                            isActive={isEndpointActive(endpoint, selectedEndpoint)}
                            className="w-full justify-start px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg relative"
                            tooltip={`${endpoint.method} ${endpoint.path}`}
                          >
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-bold ring-1 ring-primary/30">
                              {groupIndex + 1}.{index + 1}
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
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
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
          </SidebarInset>
        </div>
      </SidebarProvider>
    </Suspense>
  );
}