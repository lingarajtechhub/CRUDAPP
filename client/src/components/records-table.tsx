import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Copy, ArrowUpDown } from "lucide-react";
import { Link } from "wouter";
import type { Record } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { SortDirection } from "@/pages/home";

interface RecordsTableProps {
  records: Record[];
  isLoading: boolean;
  sortDirection: SortDirection;
  onSort: () => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-purple-100 text-purple-800",
};

export default function RecordsTable({ records, isLoading, sortDirection, onSort }: RecordsTableProps) {
  const { toast } = useToast();

  const { mutate: deleteRecord } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      toast({ title: "Record deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyId = async (id: number) => {
    try {
      await navigator.clipboard.writeText(id.toString());
      toast({
        title: "ID copied to clipboard",
        description: `Record ID ${id} has been copied`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy ID",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No records found. Create one to get started!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              onClick={onSort}
              className="flex items-center gap-2 hover:text-accent-foreground transition-colors"
            >
              ID
              <ArrowUpDown className={`h-4 w-4 transition-transform ${
                sortDirection === "desc" ? "rotate-180" : ""
              }`} />
            </button>
          </TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {record.id}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyId(record.id)}
                  className="h-6 w-6"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
            <TableCell>{record.title}</TableCell>
            <TableCell className="max-w-xs truncate">{record.description}</TableCell>
            <TableCell>
              <Badge className={statusColors[record.status]}>
                {record.status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={priorityColors[record.priority]}>
                {record.priority}
              </Badge>
            </TableCell>
            <TableCell>
              {format(new Date(record.createdAt), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Link href={`/records/${record.id}`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
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
                      <Button
                        variant="destructive"
                        onClick={() => deleteRecord(record.id)}
                      >
                        Delete
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}