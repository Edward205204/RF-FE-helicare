import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";

// Mock data for residents
const initialResidents = [
  {
    id: 1,
    fullName: "Nguyen Van A",
    age: 70,
    gender: "Male",
    room: "P203",
    bed: "B01",
    status: "active" as "active" | "discharged",
    medicalRisk: "low" as "low" | "medium" | "high",
  },
  {
    id: 2,
    fullName: "Tran Thi B",
    age: 65,
    gender: "Female",
    room: "P203",
    bed: "B02",
    status: "active" as "active" | "discharged",
    medicalRisk: "medium" as "low" | "medium" | "high",
  },
  {
    id: 3,
    fullName: "Le Van C",
    age: 75,
    gender: "Male",
    room: "P105",
    bed: "B01",
    status: "discharged" as "active" | "discharged",
    medicalRisk: "high" as "low" | "medium" | "high",
  },
  // Add more mock data as needed
];

type Resident = (typeof initialResidents)[0];

const ResidentManagementPage: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>(initialResidents);
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all_rooms");
  const [bedFilter, setBedFilter] = useState("all_beds");
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    room: "",
    bed: "",
    status: "active" as "active" | "discharged",
    medicalRisk: "low" as "low" | "medium" | "high",
  });

  const itemsPerPage = 5;

  // Filtered and searched residents
  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const matchesSearch = resident.fullName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRoom =
        roomFilter === "all_rooms" || resident.room === roomFilter;
      const matchesBed = bedFilter === "all_beds" || resident.bed === bedFilter;
      const matchesStatus =
        statusFilter === "all_statuses" || resident.status === statusFilter;
      return matchesSearch && matchesRoom && matchesBed && matchesStatus;
    });
  }, [residents, search, roomFilter, bedFilter, statusFilter]);

  // Paginated residents
  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResidents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResidents, currentPage]);

  const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-500 text-white">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-500 text-white">
        Discharged
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Medium
          </Badge>
        );
      case "high":
        return <Badge variant="destructive">High</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleAddEdit = () => {
    // convert age (string) from formData to a number, fallback to 0 if invalid
    const parsedAge = Number(formData.age);
    const safeAge = Number.isNaN(parsedAge) ? 0 : parsedAge;

    const payload = {
      fullName: formData.fullName,
      age: safeAge,
      gender: formData.gender,
      room: formData.room,
      bed: formData.bed,
      status: formData.status,
      medicalRisk: formData.medicalRisk,
    };

    if (editingResident) {
      setResidents((prev) =>
        prev.map((res) =>
          res.id === editingResident.id ? { ...res, ...payload } : res
        )
      );
    } else {
      const newResident: Resident = {
        id: residents.length + 1,
        ...payload,
      };
      setResidents((prev) => [...prev, newResident]);
    }
    setIsDialogOpen(false);
    setEditingResident(null);
    setFormData({
      fullName: "",
      age: "",
      gender: "",
      room: "",
      bed: "",
      status: "active",
      medicalRisk: "low",
    });
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      fullName: resident.fullName,
      age: resident.age.toString(),
      gender: resident.gender,
      room: resident.room,
      bed: resident.bed,
      status: resident.status,
      medicalRisk: resident.medicalRisk,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setResidents((prev) => prev.filter((res) => res.id !== id));
  };

  const handleView = (resident: Resident) => {
    alert(`Viewing details for ${resident.fullName}`);
  };

  const uniqueRooms = [...new Set(residents.map((r) => r.room))];
  const uniqueBeds = [...new Set(residents.map((r) => r.bed))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blue-800">Resident Admin</h1>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search by Name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search residents..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roomFilter">Filter by Room</Label>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_rooms">All Rooms</SelectItem>
                  {uniqueRooms.map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bedFilter">Filter by Bed</Label>
              <Select value={bedFilter} onValueChange={setBedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Beds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_beds">All Beds</SelectItem>
                  {uniqueBeds.map((bed) => (
                    <SelectItem key={bed} value={bed}>
                      {bed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statusFilter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Resident Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            {/* <Button
              className="bg-blue-500"
              onClick={() => setEditingResident(null)}
            >
              <Plus className="h-4 w-4 mr-2 bg-blue-500" />
              Add Resident
            </Button> */}
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingResident ? "Edit Resident" : "Add New Resident"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, age: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: "Male" | "Female" | "Other") =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, room: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="bed">Bed</Label>
                <Input
                  id="bed"
                  value={formData.bed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, bed: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "discharged") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="medicalRisk">Medical Risk Level</Label>
                <Select
                  value={formData.medicalRisk}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setFormData((prev) => ({ ...prev, medicalRisk: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddEdit} className="w-full">
                {editingResident ? "Update Resident" : "Add Resident"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Residents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Residents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-semibold">
                  Full Name
                </TableHead>
                <TableHead className="text-base font-semibold">Age</TableHead>
                <TableHead className="text-base font-semibold">
                  Gender
                </TableHead>
                <TableHead className="text-base font-semibold">Room</TableHead>
                <TableHead className="text-base font-semibold">Bed</TableHead>
                <TableHead className="text-base font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-base font-semibold">
                  Medical Risk
                </TableHead>
                <TableHead className="text-base font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResidents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="text-lg">{resident.fullName}</TableCell>
                  <TableCell className="text-lg">{resident.age}</TableCell>
                  <TableCell className="text-lg">{resident.gender}</TableCell>
                  <TableCell className="text-lg">{resident.room}</TableCell>
                  <TableCell className="text-lg">{resident.bed}</TableCell>
                  <TableCell>{getStatusBadge(resident.status)}</TableCell>
                  <TableCell>{getRiskBadge(resident.medicalRisk)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(resident)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(resident)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(resident.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResidentManagementPage;
