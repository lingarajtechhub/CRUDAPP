import { Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RecordsTable from "@/components/records-table";
import SearchBar from "@/components/search-bar";
import { useState } from "react";
import type { Record } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: records, isLoading } = useQuery<Record[]>({
    queryKey: searchQuery ? ["/api/records/search", searchQuery] : ["/api/records"],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/records/search?q=${encodeURIComponent(searchQuery)}`
        : "/api/records";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch records");
      return response.json();
    },
  });

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Records</h1>
        <div className="flex gap-2">
          <Link href="/api-explorer">
            <Button variant="outline">
              <Terminal className="w-4 h-4 mr-2" />
              API Explorer
            </Button>
          </Link>
          <Link href="/records/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Record
            </Button>
          </Link>
        </div>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div className="mt-6">
        <RecordsTable records={records || []} isLoading={isLoading} />
      </div>
    </div>
  );
}