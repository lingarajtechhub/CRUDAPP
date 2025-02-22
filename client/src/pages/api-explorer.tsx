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
            >
              <TabsList className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {endpoints.map((endpoint) => (
                  <TabsTrigger 
                    key={endpoint.path}
                    value={endpoint.path}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {endpoint.method} {endpoint.path}
                  </TabsTrigger>
                ))}
              </TabsList>

              {endpoints.map((endpoint) => (
                <TabsContent key={endpoint.path} value={endpoint.path}>
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </p>

                    {endpoint.path.includes(":id") && (
                      <div>
                        <label className="text-sm font-medium">
                          Record ID:
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                          onChange={(e) => setParams({ ...params, id: e.target.value })}
                          placeholder="Enter record ID"
                        />
                      </div>
                    )}

                    {endpoint.path.includes("/search") && (
                      <div>
                        <label className="text-sm font-medium">
                          Search Query:
                        </label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                          onChange={(e) => setParams({ ...params, q: e.target.value })}
                          placeholder="Enter search term"
                        />
                      </div>
                    )}

                    {endpoint.requestBody && (
                      <div>
                        <label className="text-sm font-medium">
                          Request Body:
                        </label>
                        <Textarea
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          className="font-mono text-sm mt-1"
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
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Response:</h3>
                        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
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
