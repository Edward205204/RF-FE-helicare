import React, { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "../components/ui/dialog";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../components/ui/table";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";

import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "../components/ui/select";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../components/ui/form";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ---------------- TYPES ----------------
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  contraindications: string;
  category: string;
}

// Mock Data
const mockMedications: Medication[] = [
  {
    id: "1",
    name: "Aspirin",
    dosage: "100mg",
    frequency: "Once daily",
    contraindications: "Allergy to NSAIDs",
    category: "Pain Relief",
  },
  {
    id: "2",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    contraindications: "Kidney disease",
    category: "Diabetes",
  },
];

const categories = [
  "Pain Relief",
  "Diabetes",
  "Blood Pressure",
  "Antibiotics",
  "Supplements",
  "Others",
];

// Validation
const medicationSchema = z.object({
  name: z.string().min(1, "Required"),
  dosage: z.string().min(1, "Required"),
  frequency: z.string().min(1, "Required"),
  contraindications: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
});

// ================= MAIN COMPONENT ================
const AdminMedicationCatalog: React.FC = () => {
  const [medications, setMedications] = useState(mockMedications);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<Medication | null>(null);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // FORM
  const medForm = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      contraindications: "",
      category: "",
    },
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    medForm.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (med: Medication) => {
    setEditingItem(med);
    medForm.reset(med);
    setDialogOpen(true);
  };

  const requestSave = (data: any) => {
    setPendingSaveData(data);
    setSaveDialogOpen(true);
  };

  const confirmSave = () => {
    if (editingItem) {
      setMedications(
        medications.map((m) =>
          m.id === editingItem.id ? { ...pendingSaveData, id: m.id } : m
        )
      );
    } else {
      setMedications([
        ...medications,
        { ...pendingSaveData, id: Date.now().toString() },
      ]);
    }

    setPendingSaveData(null);
    setSaveDialogOpen(false);
    setDialogOpen(false);
  };

  const requestDelete = (id: string) => {
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      setMedications(medications.filter((m) => m.id !== deleteItemId));
    }
    setDeleteDialogOpen(false);
  };

  // FILTER + SEARCH
  const filteredData = useMemo(() => {
    let data = medications;

    if (search.trim() !== "") {
      data = data.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterCategory !== "All") {
      data = data.filter((m) => m.category === filterCategory);
    }

    return data;
  }, [medications, search, filterCategory]);

  // PAGINATION
  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">Medication Catalog</h1>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle></CardTitle>
            <Button className="text-white bg-blue-500 hover:bg-blue-600" onClick={openCreateDialog}>Add Medication</Button>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* SEARCH + FILTER */}
            <div className="flex gap-4">
              <Input
                placeholder="Search medications..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

              <Select
                onValueChange={(v) => {
                  setFilterCategory(v);
                  setPage(1);
                }}
                defaultValue="All"
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TABLE */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold text-base">Name</TableHead>
                  <TableHead className="text-center font-bold text-base">Dosage</TableHead>
                  <TableHead className="text-center font-bold text-base">Frequency</TableHead>
                  <TableHead className="text-center font-bold text-base">Category</TableHead>
                  <TableHead className="text-center font-bold text-base">Contraindications</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell>{med.name}</TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>{med.category}</TableCell>
                    <TableCell>{med.contraindications}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">...</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="cursor-pointer"
                        >
                          <DropdownMenuItem onClick={() => openEditDialog(med)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => requestDelete(med.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4 text-smss">
              <p>
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2 text-sm">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CREATE / EDIT DIALOG */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Medication" : "Add Medication"}
              </DialogTitle>
            </DialogHeader>

            <Form {...medForm}>
              <form
                onSubmit={medForm.handleSubmit(requestSave)}
                className="space-y-4"
              >
                <FormField
                  control={medForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Medication name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={medForm.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="100mg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={medForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Twice daily" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={medForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={medForm.control}
                  name="contraindications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraindications</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Restrictions..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button className="text-white bg-blue-500 hover:bg-blue-600" type="submit">Save</Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* CONFIRM SAVE */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Save</DialogTitle>
            </DialogHeader>

            <p>Do you want to save this medication?</p>

            <DialogFooter>
              <Button className="text-white bg-blue-500 hover:bg-blue-600" onClick={confirmSave}>Confirm</Button>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CONFIRM DELETE */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>

            <p>This action will permanently delete the medication.</p>

            <DialogFooter>
              <Button onClick={confirmDelete}>Delete</Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminMedicationCatalog;
