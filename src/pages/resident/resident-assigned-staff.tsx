import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getResidentById,
  getResidentStaff,
  assignStaffToResident,
  type ResidentResponse,
  type ResidentStaffResponse,
  type AssignStaffPayload,
} from "@/apis/resident.api";
import { getStaffList, type StaffResponse } from "@/apis/staff.api";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui";
import { ArrowLeft, Loader2, Plus, User } from "lucide-react";
import path from "@/constants/path";

const SHIFTS = [
  { value: "Morning", label: "Morning (6:00 - 12:00)" },
  { value: "Afternoon", label: "Afternoon (12:00 - 18:00)" },
  { value: "Evening", label: "Evening (18:00 - 24:00)" },
  { value: "Night", label: "Night (0:00 - 6:00)" },
];

export default function ResidentAssignedStaff(): React.JSX.Element {
  const { id: resident_id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resident, setResident] = useState<ResidentResponse | null>(null);
  const [assignedStaff, setAssignedStaff] =
    useState<ResidentStaffResponse | null>(null);
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!resident_id) {
      toast.error("Invalid resident ID");
      navigate(path.residentList);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [residentResponse, staffResponse, assignedStaffResponse] =
          await Promise.all([
            getResidentById(resident_id),
            getStaffList(),
            getResidentStaff(resident_id).catch(() => ({ data: null })),
          ]);
        setResident(residentResponse.data);
        setStaffList(staffResponse.data || []);
        setAssignedStaff(assignedStaffResponse.data);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error(error.response?.data?.message || "Cannot load information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resident_id, navigate]);

  const handleAssignStaff = async () => {
    if (!selectedStaffId || !resident_id) {
      toast.error("Please select staff");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AssignStaffPayload = {
        staff_id: selectedStaffId,
        shift: selectedShift || undefined,
      };
      await assignStaffToResident(resident_id, payload);
      toast.success("Staff assigned successfully");
      setAssignDialogOpen(false);
      setSelectedStaffId("");
      setSelectedShift("");

      // Refresh data
      const assignedStaffResponse = await getResidentStaff(resident_id);
      setAssignedStaff(assignedStaffResponse.data);
    } catch (error: any) {
      console.error("Error assigning staff:", error);
      toast.error(error.response?.data?.message || "Cannot assign staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5985d8]" />
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Resident information not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                path.residentDetail.replace(":resident_id", resident_id!)
              )
            }
            className="border-gray-200 "
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Assigned Staff
            </h1>
            <p className="mt-1 text-sm text-gray-600">{resident.full_name}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assigned Staff</CardTitle>
            <Button
              onClick={() => setAssignDialogOpen(true)}
              className="bg-[#5985d8] text-white hover:bg-[#4a74c2]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Assign Staff
            </Button>
          </CardHeader>
          <CardContent>
            {assignedStaff ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Hire Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {assignedStaff.staffProfile?.full_name || "-"}
                    </TableCell>
                    <TableCell>{assignedStaff.email}</TableCell>
                    <TableCell>
                      {assignedStaff.staffProfile?.phone || "-"}
                    </TableCell>
                    <TableCell>
                      {assignedStaff.staffProfile?.position || "-"}
                    </TableCell>
                    <TableCell>
                      {assignedStaff.staffProfile?.hire_date
                        ? new Date(
                            assignedStaff.staffProfile.hire_date
                          ).toLocaleDateString("en-US")
                        : "-"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No staff assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Staff Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Assign Staff to Resident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Staff *</Label>
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                >
                  <SelectTrigger className="border border-gray-200 bg-white">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white">
                    {staffList.map((staff) => (
                      <SelectItem key={staff.user_id} value={staff.user_id}>
                        {staff.full_name || staff.email} -{" "}
                        {staff.staff_role || staff.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Shift (Optional)</Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="border border-gray-200 bg-white">
                    <SelectValue placeholder="Select shift (optional)" />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white">
                    {SHIFTS.map((shift) => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignStaff}
                disabled={isSubmitting || !selectedStaffId}
                className="bg-[#5985d8] text-white hover:bg-[#4a74c2]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  "Assign Staff"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
