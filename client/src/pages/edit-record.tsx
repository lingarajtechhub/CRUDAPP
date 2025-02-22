import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RecordForm from "@/components/record-form";
import type { Record } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function EditRecord() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  
  const { data: record, isLoading } = useQuery<Record>({
    queryKey: id ? ["/api/records", id] : null,
    enabled: !!id,
  });

  const isNew = !id;

  if (id && isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? "Create Record" : "Edit Record"}
        </h1>
      </div>

      <RecordForm 
        record={record}
        onSuccess={() => setLocation("/")}
      />
    </div>
  );
}
