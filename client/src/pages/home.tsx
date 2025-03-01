import { Plus, Terminal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RecordsTable from "@/components/records-table";
import SearchBar from "@/components/search-bar";
import { useState } from "react";
import type { Record } from "@shared/schema";

export type SortDirection = "asc" | "desc";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: records, isLoading } = useQuery<Record[]>({
    queryKey: [
      "/api/records",
      searchQuery,
      sortDirection // Add sortDirection to queryKey for proper cache handling
    ],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/records/search?q=${encodeURIComponent(searchQuery)}`
        : "/api/records";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch records");
      const data = await response.json();

      // Create a new array to avoid mutating the original data
      return [...data].sort((a: Record, b: Record) => {
        // Use safe number comparison for sorting
        const comparison = (a.id || 0) - (b.id || 0);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    },
  });

  const handleSort = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

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
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSort}
            className="flex items-center gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground group"
          >
            <ArrowUpDown className={`h-4 w-4 transition-transform duration-200 ${
              sortDirection === "desc" ? "rotate-180" : ""
            }`} />
            <span className="font-medium">
              Sort by ID {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          </Button>
        </div>
        <RecordsTable 
          records={records || []} 
          isLoading={isLoading} 
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>
    </div>
  );
}