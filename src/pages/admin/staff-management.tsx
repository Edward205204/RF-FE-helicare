import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Search, Plus, Edit, Trash2, UserCog } from "lucide-react";
import { toast } from "react-toastify";
import {
  getAdminStaff,
  createAdmin,
  updateAdminStaff,
  deleteAdminStaff,
  getAdminMe,
  exportAdminStaff,
  approveAdminStaff,
  rejectAdminStaff,
  resetAdminStaffPassword,
  assignAdminStaffResident,
  unassignAdminStaffResident,
  getAdminStaffAudit,
} from "@/apis/admin.api";
import { useNavigate } from "react-router-dom";
import path from "@/constants/path";

const AdminStaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });
  const [editFormData, setEditFormData] = useState({
    role: "Staff" as "Staff" | "Admin",
    status: "active" as "active" | "inactive" | "pending",
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    checkRole();
    loadData();
  }, []);

  const checkRole = async () => {
    try {
      const response = await getAdminMe();
      if (response.data.role === "RootAdmin") {
        setIsRootAdmin(true);
      }
    } catch (error) {
      // Ignore
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getAdminStaff({
        search: search || undefined,
        role:
          roleFilter === "all"
            ? undefined
            : (roleFilter as "Staff" | "Admin" | "RootAdmin"),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "active" | "inactive" | "pending"),
      });
      setStaff(response.staff || []);
    } catch (error: any) {
      toast.error("Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter, statusFilter]);

  const handleCreate = () => {
    if (!isRootAdmin) {
      toast.error("Only RootAdmin can create an Admin");
      return;
    }
    setFormData({ email: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setEditFormData({
      role:
        staffMember.role === "RootAdmin"
          ? "Admin"
          : (staffMember.role as "Staff" | "Admin"),
      status: staffMember.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.email) {
      toast.error("Please enter an email");
      return;
    }

    try {
      await createAdmin({ email: formData.email, institution_id: "" });
      toast.success("Admin invitation sent");
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to create Admin");
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingStaff) return;

    try {
      await updateAdminStaff(editingStaff.user_id, editFormData);
      toast.success("Updated successfully");
      setIsEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to update");
    }
  };

  const handleQuickUpdate = async (id: string, data: any) => {
    try {
      await updateAdminStaff(id, data);
      toast.success("Updated");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAdminStaff(id);
      toast.success("Approved");
      loadData();
    } catch (error: any) {
      toast.error("Approve failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAdminStaff(id, { approve: false });
      toast.success("Rejected");
      loadData();
    } catch (error: any) {
      toast.error("Reject failed");
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await resetAdminStaffPassword(id);
      toast.success("Reset email sent");
    } catch (error: any) {
      toast.error("Reset failed");
    }
  };

  const handleAssign = async (id: string) => {
    const resident_id = window.prompt("Enter resident ID to assign");
    if (!resident_id) return;
    try {
      await assignAdminStaffResident(id, { resident_id });
      toast.success("Assigned");
    } catch (error: any) {
      toast.error("Assign failed");
    }
  };

  const handleUnassign = async (id: string) => {
    const resident_id = window.prompt("Enter resident ID to unassign");
    if (!resident_id) return;
    try {
      await unassignAdminStaffResident(id, resident_id);
      toast.success("Unassigned");
    } catch (error: any) {
      toast.error("Unassign failed");
    }
  };

  const handleAudit = async (id: string) => {
    try {
      const res = await getAdminStaffAudit(id);
      setAuditLogs(res.data || []);
      setShowAudit(true);
    } catch (error: any) {
      toast.error("Load audit failed");
    }
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const blob = await exportAdminStaff({
        search: search || undefined,
        role:
          roleFilter === "all"
            ? undefined
            : (roleFilter as "Staff" | "Admin" | "RootAdmin"),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "active" | "inactive" | "pending"),
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `staff.${format === "xlsx" ? "xlsx" : "csv"}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      toast.error("Export failed");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!isRootAdmin) {
      toast.error("Only RootAdmin can delete staff");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this staff?")) return;

    try {
      await deleteAdminStaff(userId);
      toast.success("Staff deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to delete staff");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "RootAdmin":
        return <Badge className="bg-purple-500 text-white">Root Admin</Badge>;
      case "Admin":
        return <Badge className="bg-blue-500 text-white">Admin</Badge>;
      case "Staff":
        return <Badge className="bg-green-500 text-white">Staff</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500 text-white">Active</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white">Inactive</Badge>
    );
  };

  if (loading && staff.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-t-md">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Staff Admin
            </CardTitle>
            {isRootAdmin && (
              <Button
                onClick={handleCreate}
                className="bg-[#4f7df5] hover:bg-[#3c6be6] text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="RootAdmin">Root Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  Clear filters
                </Button>
              </div>
              <div className="flex items-end justify-start md:justify-end gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                  onClick={() => handleExport("csv")}
                >
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => handleExport("xlsx")}
                >
                  Export XLSX
                </Button>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((staffMember) => (
                    <TableRow key={staffMember.user_id}>
                      <TableCell className="font-medium">
                        {staffMember.email}
                      </TableCell>
                      <TableCell>
                        {staffMember.staffProfile?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={staffMember.role}
                          onValueChange={(val) =>
                            handleQuickUpdate(staffMember.user_id, {
                              role: val as any,
                            })
                          }
                          disabled={staffMember.role === "RootAdmin"}
                        >
                          <SelectTrigger className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Staff">Staff</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="RootAdmin" disabled>
                              RootAdmin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={staffMember.status}
                          onValueChange={(val) =>
                            handleQuickUpdate(staffMember.user_id, {
                              status: val as any,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100"
                            onClick={() =>
                              handleResetPassword(staffMember.user_id)
                            }
                          >
                            Reset PW
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            onClick={() => handleAudit(staffMember.user_id)}
                          >
                            Audit
                          </Button>
                          {staffMember.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                onClick={() =>
                                  handleApprove(staffMember.user_id)
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleReject(staffMember.user_id)
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(staffMember)}
                            className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
                            onClick={() => handleAssign(staffMember.user_id)}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
                            onClick={() => handleUnassign(staffMember.user_id)}
                          >
                            Unassign
                          </Button>
                          {isRootAdmin && staffMember.role !== "RootAdmin" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(staffMember.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="admin@example.com"
                className="bg-white border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCreate}
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingStaff && editingStaff.role === "RootAdmin" && (
              <p className="text-sm text-gray-600">
                Cannot change the role of RootAdmin
              </p>
            )}
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: "Staff" | "Admin") =>
                  setEditFormData({ ...editFormData, role: value })
                }
                disabled={editingStaff?.role === "RootAdmin"}
              >
                <SelectTrigger className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setEditFormData({ ...editFormData, status: value })
                }
              >
                <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEdit}
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffManagement;
