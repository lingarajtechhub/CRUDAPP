import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EditRecord from "@/pages/edit-record";
import ApiExplorer from "@/pages/api-explorer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/records/new" component={EditRecord} />
      <Route path="/records/:id" component={EditRecord} />
      <Route path="/api-explorer" component={ApiExplorer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;