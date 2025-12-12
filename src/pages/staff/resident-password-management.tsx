import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { Label } from "@/components/ui";
import {
  getResidentAccounts,
  resetResidentPassword,
  changeResidentPassword,
  type ResidentAccountResponse,
  type ResidentAccountsParams,
} from "@/apis/resident.api";
import { toast } from "react-toastify";
import {
  Lock,
  RefreshCw,
  Edit,
  Search,
  ArrowUpDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePaginationQuerySync } from "@/hooks/use-pagination-query";

type PasswordStatus = "all" | "not_changed" | "changed";
type SortBy = "name" | "created_at" | "status";
type SortOrder = "asc" | "desc";

const RANGE = 2;
type PaginationItem = number | "ellipsis";

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) return [1];

  const candidates = new Set<number>();
  for (let i = currentPage - RANGE; i <= currentPage + RANGE; i += 1) {
    if (i >= 1 && i <= totalPages) {
      candidates.add(i);
    }
  }
  candidates.add(1);
  if (totalPages >= 2) {
    candidates.add(2);
    candidates.add(totalPages);
    if (totalPages - 1 > 0) {
      candidates.add(totalPages - 1);
    }
  }

  const sorted = Array.from(candidates).sort((a, b) => a - b);
  const result: PaginationItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (page - prev > 1) {
        result.push("ellipsis");
      }
    }
    result.push(page);
  });
  return result;
};

const ResidentPasswordManagement: React.FC = () => {
  const { page, limit, setPage, setLimit, searchParams, setQueryParams } =
    usePaginationQuerySync(10);
  const [activeTab, setActiveTab] = useState<PasswordStatus>("all");
  const [data, setData] = useState<ResidentAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Dialog states
  const [selectedResident, setSelectedResident] =
    useState<ResidentAccountResponse | null>(null);
  const [dialogType, setDialogType] = useState<"reset" | "change" | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const params: ResidentAccountsParams = {
        page,
        limit,
        search: searchInput.trim() || undefined,
        password_status: activeTab === "all" ? undefined : activeTab,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const result = await getResidentAccounts(params);
      setData(result.residents || []);
      setPagination(result.pagination || pagination);
    } catch (error: any) {
      console.error("Error fetching resident accounts:", error);
      toast.error(error.response?.data?.message || "Cannot load account list");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchInput, activeTab, sortBy, sortOrder]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSearch = () => {
    setPage(1);
    fetchAccounts();
  };

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const openResetDialog = (resident: ResidentAccountResponse) => {
    setSelectedResident(resident);
    setDialogType("reset");
    setNewPassword("");
    setConfirmPassword("");
  };

  const openChangeDialog = (resident: ResidentAccountResponse) => {
    setSelectedResident(resident);
    setDialogType("change");
    setNewPassword("");
    setConfirmPassword("");
  };

  const closeDialog = () => {
    setSelectedResident(null);
    setDialogType(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const validatePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password confirmation does not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedResident || !validatePassword()) return;

    setSubmitting(true);
    try {
      if (dialogType === "reset") {
        await resetResidentPassword(selectedResident.resident_id, newPassword);
        toast.success(
          "Password reset successfully! Resident needs to change password on first login."
        );
      } else {
        await changeResidentPassword(selectedResident.resident_id, newPassword);
        toast.success("Password changed successfully!");
      }
      closeDialog();
      fetchAccounts();
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Cannot update password");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: "not_changed" | "changed") => {
    if (status === "not_changed") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">
          Not Changed
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
        Changed
      </Badge>
    );
  };

  const paginationItems = buildPaginationItems(
    pagination.page,
    pagination.totalPages
  );

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Resident Password Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and help reset passwords for resident accounts
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by resident name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="pl-10 border-gray-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleSearch}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as PasswordStatus);
            setPage(1);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 border-gray-200 bg-white">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-blue-100"
            >
              All
              {activeTab === "all" && ` (${pagination.total})`}
            </TabsTrigger>
            <TabsTrigger
              value="not_changed"
              className="data-[state=active]:bg-amber-100"
            >
              Not Changed
              {activeTab === "not_changed" && ` (${pagination.total})`}
            </TabsTrigger>
            <TabsTrigger
              value="changed"
              className="data-[state=active]:bg-emerald-100"
            >
              Changed
              {activeTab === "changed" && ` (${pagination.total})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Account List
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {activeTab === "all"
                        ? "All resident accounts"
                        : activeTab === "not_changed"
                        ? "Accounts with unchanged passwords (default passwords)"
                        : "Accounts with changed passwords"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sortBy}
                      onValueChange={(value) => setSortBy(value as SortBy)}
                    >
                      <SelectTrigger className="w-[180px] border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 bg-white">
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="created_at">
                          Sort by Date Created
                        </SelectItem>
                        <SelectItem value="status">Sort by Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="border-gray-200"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading...
                  </div>
                ) : data.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No accounts found
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="border-gray-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("name")}
                                className="hover:bg-gray-100"
                              >
                                Resident Name
                                {sortBy === "name" && (
                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead className="border-gray-200">
                              Username
                            </TableHead>
                            <TableHead className="border-gray-200">
                              Room
                            </TableHead>
                            <TableHead className="border-gray-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("status")}
                                className="hover:bg-gray-100"
                              >
                                Password Status
                                {sortBy === "status" && (
                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead className="border-gray-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort("created_at")}
                                className="hover:bg-gray-100"
                              >
                                Date Created
                                {sortBy === "created_at" && (
                                  <ArrowUpDown className="ml-2 h-3 w-3" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead className="border-gray-200 text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.map((resident) => (
                            <TableRow
                              key={resident.resident_id}
                              className="border-gray-200 hover:bg-gray-50"
                            >
                              <TableCell className="border-gray-200 font-medium">
                                {resident.full_name}
                              </TableCell>
                              <TableCell className="border-gray-200 font-mono text-sm">
                                {resident.user?.email?.split("@")[0] || "—"}
                              </TableCell>
                              <TableCell className="border-gray-200">
                                {resident.room?.room_number || "—"}
                              </TableCell>
                              <TableCell className="border-gray-200">
                                {getStatusBadge(resident.password_status)}
                              </TableCell>
                              <TableCell className="border-gray-200 text-sm text-gray-600">
                                {resident.user?.created_at
                                  ? new Date(
                                      resident.user.created_at
                                    ).toLocaleDateString("en-US")
                                  : "—"}
                              </TableCell>
                              <TableCell className="border-gray-200">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openResetDialog(resident)}
                                    className="border-gray-200 text-amber-600 hover:bg-amber-50"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Reset
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openChangeDialog(resident)}
                                    className="border-gray-200 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Change
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Showing {(page - 1) * limit + 1} -{" "}
                          {Math.min(page * limit, pagination.total)} of{" "}
                          {pagination.total} accounts
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="border-gray-200"
                          >
                            Previous
                          </Button>
                          {paginationItems.map((item, idx) => {
                            if (item === "ellipsis") {
                              return (
                                <span
                                  key={`ellipsis-${idx}`}
                                  className="px-2 text-gray-400"
                                >
                                  ...
                                </span>
                              );
                            }
                            return (
                              <Button
                                key={item}
                                variant={page === item ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(item)}
                                className={
                                  page === item
                                    ? "bg-blue-500 text-white"
                                    : "border-gray-200"
                                }
                              >
                                {item}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === pagination.totalPages}
                            className="border-gray-200"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Password Dialog */}
        <Dialog open={dialogType === "reset"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Reset Password
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Reset password for{" "}
                <strong>{selectedResident?.full_name}</strong>. Resident will
                need to change password on first login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  New Password *
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="border-gray-200 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="border-gray-200 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> After reset, account status will be
                  "Not Changed". Resident needs to change password on first
                  login.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={submitting}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                {submitting ? "Processing..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={dialogType === "change"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Change Password
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Change password for{" "}
                <strong>{selectedResident?.full_name}</strong>. Account will be
                marked as "Changed".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  New Password *
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="border-gray-200 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="border-gray-200 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After change, account status will be
                  "Changed". Resident can use the new password immediately.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={submitting}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {submitting ? "Processing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ResidentPasswordManagement;
