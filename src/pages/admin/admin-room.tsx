import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

/* ------------------------------------------
   TYPES
-------------------------------------------*/

export type Bed = {
  bed: string;
  resident: string | null;
  status: "Occupied" | "Available" | "Maintenance";
};

export type Room = {
  id: string;
  floor: number;
  area: string;
  description?: string | null;
  beds: Bed[];
};

// Staff view mapping structure
export type StaffResident = {
  id: string;
  name: string | null;
  age: number | null;
  room: string;
  bed: string;
  status: "Occupied" | "Available" | "Maintenance";
};

// Resident view mapping structure
export type ResidentView = {
  residentName: string;
  room: string;
  bed: string;
  status: "Occupied" | "Available" | "Maintenance";
};

/* ------------------------------------------
   MAPPING LOGIC
-------------------------------------------*/

// ADMIN → STAFF
export const mapAdminToStaff = (adminRooms: Room[]): StaffResident[] =>
  adminRooms.flatMap((room) =>
    room.beds.map((bed) => ({
      id: `${room.id}-${bed.bed}`,
      name: bed.resident,
      age: null,
      room: room.id,
      bed: bed.bed,
      status: bed.status,
    }))
  );

// ADMIN → RESIDENT (1 resident)
export const mapAdminToResident = (
  adminRooms: Room[],
  residentName: string
): ResidentView | null => {
  for (const room of adminRooms) {
    const found = room.beds.find((b) => b.resident === residentName);
    if (found) {
      return {
        residentName,
        room: room.id,
        bed: found.bed,
        status: found.status,
      };
    }
  }

  return null;
};

/* ------------------------------------------
   MOCK DATA
-------------------------------------------*/

const initialRooms: Room[] = [
  {
    id: "101",
    floor: 1,
    area: "North Wing",
    description: "Single room with window",
    beds: [
      { bed: "A", resident: "John Doe", status: "Occupied" },
      { bed: "B", resident: null, status: "Available" },
    ],
  },
  {
    id: "102",
    floor: 1,
    area: "South Wing",
    description: "Double room",
    beds: [{ bed: "A", resident: null, status: "Available" }],
  },
];

/* ------------------------------------------
   MAIN COMPONENT
-------------------------------------------*/

const RoomBedAdminPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  /* ----- DASHBOARD STATS ----- */
  const totalBeds = rooms.reduce((sum, r) => sum + r.beds.length, 0);
  const occupied = rooms.reduce(
    (s, r) => s + r.beds.filter((b) => b.status === "Occupied").length,
    0
  );
  const available = rooms.reduce(
    (s, r) => s + r.beds.filter((b) => b.status === "Available").length,
    0
  );
  const maintenance = rooms.reduce(
    (s, r) => s + r.beds.filter((b) => b.status === "Maintenance").length,
    0
  );
  const occupancyRate = totalBeds
    ? Math.round((occupied / totalBeds) * 100)
    : 0;

  const getStatusBadge = (s: string) => {
    const base = "text-white text-sm px-3 py-1 rounded-md";
    if (s === "Available")
      return <Badge className={base + " bg-green-500"}>Available</Badge>;
    if (s === "Occupied")
      return <Badge className={base + " bg-yellow-500"}>Occupied</Badge>;
    if (s === "Maintenance")
      return <Badge className={base + " bg-red-500"}>Maintenance</Badge>;
    return <Badge>Unknown</Badge>;
  };

  /* ----- EDIT EVENTS ----- */

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRoom) return;

    setRooms((prev) =>
      prev.map((r) => (r.id === editingRoom.id ? editingRoom : r))
    );

    setIsEditDialogOpen(false);
    setEditingRoom(null);
  };

  const handleInputChange = (field: keyof Room, value: any) => {
    if (!editingRoom) return;
    setEditingRoom({ ...editingRoom, [field]: value });
  };

  return (
    <div className="max-w-screen-xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Room & Bed Admin</h1>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl">{totalBeds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-yellow-600">{occupied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-green-600">{available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-red-600">{maintenance}</p>
          </CardContent>
        </Card>
      </div>

      {/* OCCUPANCY BAR */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-8 bg-gray-200 rounded-full">
            <div
              className="h-8 bg-blue-600 rounded-full text-white flex items-center justify-center"
              style={{ width: `${occupancyRate}%` }}
            >
              {occupancyRate}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>All Rooms</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-semibold text-center">
                  Room
                </TableHead>
                <TableHead className="text-base font-semibold text-center">
                  Floor
                </TableHead>
                <TableHead className="text-base font-semibold text-center">
                  Area
                </TableHead>
                <TableHead className="text-base font-semibold text-center">
                  Description
                </TableHead>
                <TableHead className="text-base font-semibold text-center">
                  Beds
                </TableHead>
                <TableHead className="text-base font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>{room.id}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>{room.area}</TableCell>
                  <TableCell>{room.description}</TableCell>

                  <TableCell>
                    {room.beds.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <span>{b.bed}</span>
                        {getStatusBadge(b.status)}
                        {b.resident && <span>({b.resident})</span>}
                      </div>
                    ))}
                  </TableCell>

                  <TableCell>
                    <Button
                      className="bg-gray-500"
                      onClick={() => handleEditRoom(room)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>

          {editingRoom && (
            <div className="space-y-4">
              <div>
                <Label>Floor</Label>
                <Input
                  type="number"
                  value={editingRoom.floor}
                  onChange={(e) =>
                    handleInputChange("floor", Number(e.target.value))
                  }
                />
              </div>

              <div>
                <Label>Area</Label>
                <Input
                  value={editingRoom.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingRoom.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>

              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomBedAdminPage;
