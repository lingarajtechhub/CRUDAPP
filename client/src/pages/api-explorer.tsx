import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "wouter";

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

  const handleEndpointChange = (path: string) => {
    const endpoint = endpoints.find(e => e.path === path)!;
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : "");
    setRequestState({ loading: false });
  };

  const handleSendRequest = async () => {
    setRequestState({ loading: true });
    try {
      let path = selectedEndpoint.path;

      // Replace path parameters
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value);
      });

      // Add query parameters for search
      if (path.includes("/search") && params.q) {
        path = `${path}?q=${encodeURIComponent(params.q)}`;
      }

      const response = await apiRequest(
        selectedEndpoint.method,
        path,
        selectedEndpoint.method !== "GET" && requestBody ? JSON.parse(requestBody) : undefined
      );

      const responseData = response.status === 204 ? null : await response.json();
      setRequestState({
        loading: false,
        response: {
          status: response.status,
          data: responseData
        }
      });
    } catch (error) {
      setRequestState({
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  // Get the full URL for the current endpoint
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">API Explorer</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue={selectedEndpoint.path}
              onValueChange={handleEndpointChange}
              className="w-full"
            >
              <TabsList className="mb-4 w-full flex flex-wrap gap-2">
                {endpoints.map((endpoint) => (
                  <TabsTrigger 
                    key={`${endpoint.method}-${endpoint.path}`}
                    value={endpoint.path}
                    className="flex-1 min-w-[150px] md:min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span className="font-mono">{endpoint.method}</span>
                    <span className="ml-2 truncate hidden md:inline">{endpoint.path}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {endpoints.map((endpoint) => (
                <TabsContent 
                  key={`content-${endpoint.method}-${endpoint.path}`} 
                  value={endpoint.path}
                  className="border rounded-lg p-4"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Full URL:</h3>
                      <pre className="p-3 bg-muted rounded-md overflow-x-auto font-mono text-sm whitespace-pre-wrap break-all">
                        {getFullUrl()}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Description:</h3>
                      <p className="text-sm text-muted-foreground">
                        {endpoint.description}
                      </p>
                    </div>

                    {endpoint.path.includes(":id") && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Record ID:
                        </h3>
                        <input
                          type="number"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          onChange={(e) => setParams({ ...params, id: e.target.value })}
                          placeholder="Enter record ID"
                        />
                      </div>
                    )}

                    {endpoint.path.includes("/search") && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Search Query:
                        </h3>
                        <input
                          type="text"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          onChange={(e) => setParams({ ...params, q: e.target.value })}
                          placeholder="Enter search term"
                        />
                      </div>
                    )}

                    {endpoint.requestBody && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Request Body:
                        </h3>
                        <Textarea
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          className="font-mono text-sm"
                          rows={10}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleSendRequest}
                      disabled={requestState.loading}
                      className="w-full"
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
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}