import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Plus,
  Pencil,
  Trash2,
  Pill,
  ClipboardList,
  AlertTriangle,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import MultiSelect from "react-select";
import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  createMedicationCarePlan,
  deleteMedicationCarePlan,
  getAlerts,
  getAssignedMedications,
  type Medication,
  type CreateMedicationData,
  type CreateMedicationCarePlanData,
  type Alert,
  type AssignedMedicationResponse,
} from "@/apis/medication-careplan.api";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";

const MedicationCarePlan: React.FC = () => {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(true);

  // Data
  const [medications, setMedications] = useState<Medication[]>([]);
  const [assignedMedications, setAssignedMedications] = useState<
    AssignedMedicationResponse[]
  >([]);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  // Dialog states
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Form states - Create Medication
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null
  );
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medForm, setMedForm] = useState<
    "tablet" | "syrup" | "injection" | "capsule" | "liquid" | "cream" | "other"
  >("tablet");
  const [medFrequency, setMedFrequency] = useState("");
  const [medTiming, setMedTiming] = useState<
    "before_meal" | "after_meal" | "with_meal" | "any_time"
  >("any_time");
  const [medInstructions, setMedInstructions] = useState("");

  // Form states - Assign Medication
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>("");
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<
    "morning" | "noon" | "afternoon" | "evening" | "none"
  >("none");
  const [notes, setNotes] = useState("");
  const [conflictAlerts, setConflictAlerts] = useState<Alert[]>([]);

  // Filters for Assigned Medications tab
  const [filterMedicationId, setFilterMedicationId] = useState<string>("all");
  const [filterResidentId, setFilterResidentId] = useState<string>("all");
  const [filterRoomId, setFilterRoomId] = useState<string>("all");
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>("all");

  // Expanded rows
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(
    new Set()
  );

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "assigned") {
      fetchAssignedMedications();
    }
  }, [
    activeTab,
    filterMedicationId,
    filterResidentId,
    filterRoomId,
    filterTimeSlot,
  ]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [medsRes, residentsRes, roomsRes] = await Promise.all([
        getMedications({ is_active: true }),
        getResidents(),
        getRooms(),
      ]);

      setMedications(medsRes.data || []);
      setResidents(residentsRes.residents || []);
      setRooms(roomsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedMedications = async () => {
    try {
      const result = await getAssignedMedications({
        is_active: true,
        medication_id:
          filterMedicationId && filterMedicationId !== "all"
            ? filterMedicationId
            : undefined,
        resident_id:
          filterResidentId && filterResidentId !== "all"
            ? filterResidentId
            : undefined,
        room_id:
          filterRoomId && filterRoomId !== "all" ? filterRoomId : undefined,
        time_slot:
          filterTimeSlot && filterTimeSlot !== "all"
            ? filterTimeSlot
            : undefined,
      });
      setAssignedMedications(result.data || []);
    } catch (error: any) {
      console.error("Error fetching assigned medications:", error);
      toast.error(
        error.response?.data?.message || "Failed to load assigned medications"
      );
    }
  };

  // ========== MEDICATION HANDLERS ==========
  const handleAddMedication = async () => {
    if (!medName.trim() || !medDosage.trim() || !medFrequency.trim()) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    try {
      const data: CreateMedicationData = {
        name: medName,
        dosage: medDosage,
        form: medForm,
        frequency: medFrequency,
        timing: medTiming,
        instructions: medInstructions || undefined,
      };

      if (editingMedication) {
        await updateMedication(editingMedication.medication_id, data);
        toast.success("Cập nhật thuốc thành công");
      } else {
        await createMedication(data);
        toast.success("Tạo thuốc thành công");
      }

      resetMedicationForm();
      setIsMedicationDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể lưu thông tin thuốc"
      );
    }
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setMedName(med.name);
    setMedDosage(med.dosage);
    setMedForm(med.form as any);
    setMedFrequency(med.frequency);
    setMedTiming(med.timing as any);
    setMedInstructions(med.instructions || "");
    setIsMedicationDialogOpen(true);
  };

  const handleDeleteMedication = async (medication_id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;

    try {
      await deleteMedication(medication_id);
      toast.success("Xóa thuốc thành công");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa thuốc");
    }
  };

  const resetMedicationForm = () => {
    setEditingMedication(null);
    setMedName("");
    setMedDosage("");
    setMedForm("tablet");
    setMedFrequency("");
    setMedTiming("any_time");
    setMedInstructions("");
  };

  // ========== ASSIGNMENT HANDLERS ==========
  const handleOpenAssignDialog = () => {
    setSelectedMedicationId("");
    setSelectedResidentIds([]);
    setSelectedRoomIds([]);
    setStartDate("");
    setEndDate("");
    setTimeSlot("none");
    setNotes("");
    setConflictAlerts([]);
    setIsAssignDialogOpen(true);
  };

  const handleMedicationChange = async (medication_id: string) => {
    setSelectedMedicationId(medication_id);
    setConflictAlerts([]);

    if (medication_id && selectedResidentIds.length > 0) {
      try {
        const alertsRes = await getAlerts({
          medication_id,
          resident_ids: selectedResidentIds,
        });
        setConflictAlerts(alertsRes.data || []);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    }
  };

  const handleResidentChange = async (residentIds: string[]) => {
    setSelectedResidentIds(residentIds);

    if (selectedMedicationId && residentIds.length > 0) {
      try {
        const alertsRes = await getAlerts({
          medication_id: selectedMedicationId,
          resident_ids: residentIds,
        });
        setConflictAlerts(alertsRes.data || []);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedMedicationId) {
      toast.error("Vui lòng chọn thuốc");
      return;
    }

    if (selectedResidentIds.length === 0 && selectedRoomIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một cư dân hoặc phòng");
      return;
    }

    if (!startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu");
      return;
    }

    try {
      const data: CreateMedicationCarePlanData = {
        medication_id: selectedMedicationId,
        resident_ids:
          selectedResidentIds.length > 0 ? selectedResidentIds : undefined,
        room_ids: selectedRoomIds.length > 0 ? selectedRoomIds : undefined,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        time_slot: timeSlot && timeSlot !== "none" ? timeSlot : undefined,
        notes: notes || undefined,
      };

      await createMedicationCarePlan(data);
      toast.success("Gán thuốc thành công");
      setIsAssignDialogOpen(false);
      if (activeTab === "assigned") {
        fetchAssignedMedications();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể gán thuốc");
    }
  };

  const handleDeleteAssignment = async (assignment_id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa gán thuốc này?")) return;

    try {
      await deleteMedicationCarePlan(assignment_id);
      toast.success("Xóa gán thuốc thành công");
      fetchAssignedMedications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa gán thuốc");
    }
  };

  const toggleExpanded = (assignment_id: string) => {
    const newExpanded = new Set(expandedAssignments);
    if (newExpanded.has(assignment_id)) {
      newExpanded.delete(assignment_id);
    } else {
      newExpanded.add(assignment_id);
    }
    setExpandedAssignments(newExpanded);
  };

  // ========== COMPUTED ==========
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getFormLabel = (form: string) => {
    const labels: Record<string, string> = {
      tablet: "Viên nén",
      syrup: "Sirup",
      injection: "Tiêm",
      capsule: "Viên nang",
      liquid: "Dạng lỏng",
      cream: "Kem",
      other: "Khác",
    };
    return labels[form] || form;
  };

  const getTimingLabel = (timing: string) => {
    const labels: Record<string, string> = {
      before_meal: "Trước bữa ăn",
      after_meal: "Sau bữa ăn",
      with_meal: "Trong bữa ăn",
      any_time: "Bất kỳ lúc nào",
    };
    return labels[timing] || timing;
  };

  const getTimeSlotLabel = (slot: string) => {
    const labels: Record<string, string> = {
      morning: "Sáng",
      noon: "Trưa",
      afternoon: "Chiều",
      evening: "Tối",
    };
    return labels[slot] || slot;
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border rounded-xl p-6">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Quản lý Thuốc & Kế hoạch Chăm sóc
          </h1>
          <p className="text-slate-500 mt-1">
            Tạo thuốc, gán thuốc và quản lý các gán thuốc đang hoạt động.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-full bg-white p-1 shadow-sm border border-slate-200 w-full md:w-auto">
            <TabsTrigger
              value="create"
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md cursor-pointer"
            >
              <Pill className="w-4 h-4" />
              Tạo Thuốc
            </TabsTrigger>
            <TabsTrigger
              value="assign"
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Gán Thuốc
            </TabsTrigger>
            <TabsTrigger
              value="assigned"
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Danh sách đã Gán
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Tạo Thuốc */}
          <TabsContent value="create" className="mt-6">
            <Card className="bg-white shadow-sm border rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-800">
                  Danh sách Thuốc
                </CardTitle>
                <Dialog
                  open={isMedicationDialogOpen}
                  onOpenChange={(open) => {
                    setIsMedicationDialogOpen(open);
                    if (!open) resetMedicationForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetMedicationForm}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full px-6 py-2 h-10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Tạo Thuốc Mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-4">
                      <DialogTitle className="text-2xl font-bold text-slate-800">
                        {editingMedication
                          ? "Chỉnh sửa Thuốc"
                          : "Tạo Thuốc Mới"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-slate-600 font-semibold">
                          Tên thuốc *
                        </Label>
                        <Input
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          placeholder="e.g. Aspirin"
                          className="rounded-lg border-slate-200 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-600 font-semibold">
                            Liều lượng *
                          </Label>
                          <Input
                            value={medDosage}
                            onChange={(e) => setMedDosage(e.target.value)}
                            placeholder="e.g. 100mg"
                            className="rounded-lg border-slate-200 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-600 font-semibold">
                            Dạng thuốc *
                          </Label>
                          <Select
                            value={medForm}
                            onValueChange={(v: any) => setMedForm(v)}
                          >
                            <SelectTrigger className="rounded-lg border-slate-200 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="tablet">Viên nén</SelectItem>
                              <SelectItem value="syrup">Sirup</SelectItem>
                              <SelectItem value="injection">Tiêm</SelectItem>
                              <SelectItem value="capsule">Viên nang</SelectItem>
                              <SelectItem value="liquid">Dạng lỏng</SelectItem>
                              <SelectItem value="cream">Kem</SelectItem>
                              <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-600 font-semibold">
                            Tần suất *
                          </Label>
                          <Select
                            value={medFrequency}
                            onValueChange={setMedFrequency}
                          >
                            <SelectTrigger className="rounded-lg border-slate-200 focus:ring-blue-500">
                              <SelectValue placeholder="Chọn tần suất" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="Once daily">
                                1 lần/ngày
                              </SelectItem>
                              <SelectItem value="Twice daily">
                                2 lần/ngày
                              </SelectItem>
                              <SelectItem value="Three times daily">
                                3 lần/ngày
                              </SelectItem>
                              <SelectItem value="Four times daily">
                                4 lần/ngày
                              </SelectItem>
                              <SelectItem value="As needed">Khi cần</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-600 font-semibold">
                            Thời điểm uống *
                          </Label>
                          <Select
                            value={medTiming}
                            onValueChange={(v: any) => setMedTiming(v)}
                          >
                            <SelectTrigger className="rounded-lg border-slate-200 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="before_meal">
                                Trước bữa ăn
                              </SelectItem>
                              <SelectItem value="after_meal">
                                Sau bữa ăn
                              </SelectItem>
                              <SelectItem value="with_meal">
                                Trong bữa ăn
                              </SelectItem>
                              <SelectItem value="any_time">
                                Bất kỳ lúc nào
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600 font-semibold">
                          Hướng dẫn
                        </Label>
                        <Input
                          value={medInstructions}
                          onChange={(e) => setMedInstructions(e.target.value)}
                          placeholder="Hướng dẫn sử dụng..."
                          className="rounded-lg border-slate-200 focus:ring-blue-500"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-4"
                          onClick={handleAddMedication}
                        >
                          {editingMedication ? "Lưu thay đổi" : "Tạo thuốc"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 py-4 text-xs font-bold text-slate-500 uppercase">
                          Tên thuốc
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase">
                          Liều lượng & Dạng
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase">
                          Tần suất
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase">
                          Thời điểm
                        </TableHead>
                        <TableHead className="text-right pr-8 text-xs font-bold text-slate-500 uppercase">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medications.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-slate-500"
                          >
                            Chưa có thuốc nào. Tạo thuốc đầu tiên để bắt đầu.
                          </TableCell>
                        </TableRow>
                      ) : (
                        medications.map((med) => (
                          <TableRow
                            key={med.medication_id}
                            className="group border-b border-slate-50 hover:bg-blue-50/30 transition-colors"
                          >
                            <TableCell className="pl-8 py-4">
                              <div className="flex items-center gap-2">
                                <Pill className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-slate-700">
                                    {med.name}
                                  </p>
                                  {med.instructions && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      {med.instructions}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <p className="text-slate-600 font-medium">
                                  {med.dosage}
                                </p>
                                <Badge className="mt-1 bg-blue-100 text-blue-800">
                                  {getFormLabel(med.form)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge className="bg-green-100 text-green-800">
                                {med.frequency}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge className="bg-purple-100 text-purple-800">
                                {getTimingLabel(med.timing)}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full cursor-pointer"
                                  onClick={() => handleEditMedication(med)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-full cursor-pointer"
                                  onClick={() =>
                                    handleDeleteMedication(med.medication_id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </TabsContent>

          {/* Tab 2: Gán Thuốc */}
          <TabsContent value="assign" className="mt-6">
            <Card className="bg-white shadow-sm border rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-800">
                  Gán Thuốc cho Cư dân / Phòng
                </CardTitle>
                <Button
                  onClick={handleOpenAssignDialog}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full px-6 py-2 h-10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" /> Gán Thuốc Mới
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">
                  Chọn thuốc và gán cho cư dân hoặc phòng. Hệ thống sẽ tự động
                  kiểm tra xung đột với dị ứng, chế độ ăn và lịch trình.
                </p>
              </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog
              open={isAssignDialogOpen}
              onOpenChange={setIsAssignDialogOpen}
            >
              <DialogContent className="sm:max-w-[700px] rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-bold text-slate-800">
                    Gán Thuốc
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-semibold">
                      Chọn thuốc *
                    </Label>
                    <Select
                      value={selectedMedicationId}
                      onValueChange={handleMedicationChange}
                    >
                      <SelectTrigger className="rounded-lg border-slate-200 focus:ring-blue-500">
                        <SelectValue placeholder="Chọn thuốc" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {medications.map((med) => (
                          <SelectItem
                            key={med.medication_id}
                            value={med.medication_id}
                          >
                            {med.name} - {med.dosage} ({getFormLabel(med.form)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 font-semibold">
                      Cư dân
                    </Label>
                    <MultiSelect
                      options={residents.map((r) => ({
                        value: r.resident_id,
                        label: r.full_name,
                      }))}
                      value={residents
                        .filter((r) =>
                          selectedResidentIds.includes(r.resident_id)
                        )
                        .map((r) => ({
                          value: r.resident_id,
                          label: r.full_name,
                        }))}
                      onChange={(selected) =>
                        handleResidentChange(
                          (selected || []).map((opt) => opt.value)
                        )
                      }
                      placeholder="Chọn cư dân..."
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          borderColor: "#e2e8f0",
                          minHeight: "40px",
                          fontSize: "0.875rem",
                        }),
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 font-semibold">
                      Phòng
                    </Label>
                    <MultiSelect
                      options={rooms.map((r) => ({
                        value: r.room_id,
                        label: `Phòng ${r.room_number} (${r.type})`,
                      }))}
                      value={rooms
                        .filter((r) => selectedRoomIds.includes(r.room_id))
                        .map((r) => ({
                          value: r.room_id,
                          label: `Phòng ${r.room_number} (${r.type})`,
                        }))}
                      onChange={(selected) =>
                        setSelectedRoomIds(
                          (selected || []).map((opt) => opt.value)
                        )
                      }
                      placeholder="Chọn phòng..."
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          borderColor: "#e2e8f0",
                          minHeight: "40px",
                          fontSize: "0.875rem",
                        }),
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">
                        Ngày bắt đầu *
                      </Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-lg border-slate-200 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">
                        Ngày kết thúc
                      </Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-lg border-slate-200 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 font-semibold">
                      Khung giờ (tùy chọn)
                    </Label>
                    <Select
                      value={timeSlot}
                      onValueChange={(v: any) => setTimeSlot(v)}
                    >
                      <SelectTrigger className="rounded-lg border-slate-200 focus:ring-blue-500">
                        <SelectValue placeholder="Chọn khung giờ" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="none">Không chọn</SelectItem>
                        <SelectItem value="morning">Sáng</SelectItem>
                        <SelectItem value="noon">Trưa</SelectItem>
                        <SelectItem value="afternoon">Chiều</SelectItem>
                        <SelectItem value="evening">Tối</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 font-semibold">
                      Ghi chú
                    </Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú bổ sung..."
                      className="rounded-lg border-slate-200 focus:ring-blue-500"
                    />
                  </div>

                  {/* Conflict Warnings */}
                  {conflictAlerts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <p className="text-sm font-medium text-amber-800">
                          Cảnh báo xung đột:
                        </p>
                      </div>
                      <div className="space-y-2">
                        {conflictAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded border ${getSeverityColor(
                              alert.severity
                            )}`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium">{alert.message}</p>
                                {alert.suggestion && (
                                  <p className="mt-1 opacity-75">
                                    {alert.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {(selectedResidentIds.length > 0 ||
                    selectedRoomIds.length > 0) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        Tóm tắt:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                        <div>
                          <Users className="w-4 h-4 inline mr-1" />
                          {selectedResidentIds.length} cư dân
                        </div>
                        <div>
                          <Building2 className="w-4 h-4 inline mr-1" />
                          {selectedRoomIds.length} phòng
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-4"
                      onClick={handleCreateAssignment}
                    >
                      Gán Thuốc
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Tab 3: Danh sách đã Gán */}
          <TabsContent value="assigned" className="mt-6">
            <Card className="bg-white shadow-sm border rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Danh sách Thuốc đã Gán
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Thuốc</Label>
                    <Select
                      value={filterMedicationId}
                      onValueChange={setFilterMedicationId}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {medications.map((med) => (
                          <SelectItem
                            key={med.medication_id}
                            value={med.medication_id}
                          >
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Phòng</Label>
                    <Select
                      value={filterRoomId}
                      onValueChange={setFilterRoomId}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tất cả</SelectItem>
                        {rooms.map((r) => (
                          <SelectItem key={r.room_id} value={r.room_id}>
                            Phòng {r.room_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Khung giờ</Label>
                    <Select
                      value={filterTimeSlot}
                      onValueChange={setFilterTimeSlot}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="morning">Sáng</SelectItem>
                        <SelectItem value="noon">Trưa</SelectItem>
                        <SelectItem value="afternoon">Chiều</SelectItem>
                        <SelectItem value="evening">Tối</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 py-4 text-xs font-bold text-slate-500 uppercase">
                          Thuốc
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase">
                          Cư dân / Phòng
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase">
                          Lịch trình
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase">
                          Xung đột
                        </TableHead>
                        <TableHead className="text-right pr-8 text-xs font-bold text-slate-500 uppercase">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedMedications.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-slate-500"
                          >
                            Chưa có gán thuốc nào.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignedMedications.map((assignment) => {
                          const hasConflicts =
                            assignment.conflicts &&
                            assignment.conflicts.length > 0;

                          return (
                            <React.Fragment key={assignment.assignment_id}>
                              <TableRow className="group border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                <TableCell className="pl-8 py-4">
                                  <div className="flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <p className="font-medium text-slate-700">
                                        {assignment.medication.name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {assignment.medication.dosage} -{" "}
                                        {getFormLabel(
                                          assignment.medication.form
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="space-y-1">
                                    {assignment.residents.length > 0 && (
                                      <div>
                                        <p className="text-xs text-slate-500 mb-1">
                                          Cư dân:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {assignment.residents
                                            .slice(0, 3)
                                            .map((r) => (
                                              <Badge
                                                key={r.resident_id}
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {r.full_name}
                                                {r.room &&
                                                  ` (P.${r.room.room_number})`}
                                              </Badge>
                                            ))}
                                          {assignment.residents.length > 3 && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              +{assignment.residents.length - 3}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {assignment.rooms.length > 0 && (
                                      <div>
                                        <p className="text-xs text-slate-500 mb-1">
                                          Phòng:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {assignment.rooms.map((r) => (
                                            <Badge
                                              key={r.room_id}
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              P.{r.room_number}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="space-y-1 text-sm">
                                    <p className="text-slate-600">
                                      {assignment.medication.frequency}
                                    </p>
                                    <div className="flex gap-1">
                                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                                        {getTimingLabel(
                                          assignment.medication.timing
                                        )}
                                      </Badge>
                                      {assignment.time_slot && (
                                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                                          {getTimeSlotLabel(
                                            assignment.time_slot
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      Từ:{" "}
                                      {new Date(
                                        assignment.start_date
                                      ).toLocaleDateString("vi-VN")}
                                      {assignment.end_date &&
                                        ` - ${new Date(
                                          assignment.end_date
                                        ).toLocaleDateString("vi-VN")}`}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  {hasConflicts ? (
                                    <div className="space-y-1">
                                      {assignment
                                        .conflicts!.slice(0, 2)
                                        .map((alert, idx) => (
                                          <Badge
                                            key={idx}
                                            className={`${getSeverityColor(
                                              alert.severity
                                            )} border text-xs`}
                                          >
                                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                                            {alert.type}
                                          </Badge>
                                        ))}
                                      {assignment.conflicts!.length > 2 && (
                                        <p className="text-xs text-slate-500">
                                          +{assignment.conflicts!.length - 2}{" "}
                                          nữa
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-green-600">
                                      Không có xung đột
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="pr-8 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full cursor-pointer"
                                      onClick={() =>
                                        toggleExpanded(assignment.assignment_id)
                                      }
                                    >
                                      {expandedAssignments.has(
                                        assignment.assignment_id
                                      ) ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-full cursor-pointer"
                                      onClick={() =>
                                        handleDeleteAssignment(
                                          assignment.assignment_id
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {/* Expanded Details */}
                              {expandedAssignments.has(
                                assignment.assignment_id
                              ) && (
                                <TableRow className="bg-slate-50/50">
                                  <TableCell
                                    colSpan={5}
                                    className="pl-8 pr-8 py-4"
                                  >
                                    <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-4">
                                      {/* Residents Details */}
                                      {assignment.residents.length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium text-slate-800 mb-2">
                                            Chi tiết Cư dân:
                                          </p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {assignment.residents.map((r) => (
                                              <div
                                                key={r.resident_id}
                                                className="border border-slate-200 rounded-lg p-3"
                                              >
                                                <p className="font-medium text-slate-700">
                                                  {r.full_name}
                                                </p>
                                                {r.room && (
                                                  <p className="text-xs text-slate-500">
                                                    Phòng: {r.room.room_number}
                                                  </p>
                                                )}
                                                {r.allergies &&
                                                  r.allergies.length > 0 && (
                                                    <div className="mt-2">
                                                      <p className="text-xs text-slate-500 mb-1">
                                                        Dị ứng:
                                                      </p>
                                                      <div className="flex flex-wrap gap-1">
                                                        {r.allergies.map(
                                                          (a) => (
                                                            <Badge
                                                              key={a.id}
                                                              variant="destructive"
                                                              className="text-xs"
                                                            >
                                                              {a.substance}
                                                            </Badge>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                {r.dietTags &&
                                                  r.dietTags.length > 0 && (
                                                    <div className="mt-2">
                                                      <p className="text-xs text-slate-500 mb-1">
                                                        Chế độ ăn:
                                                      </p>
                                                      <div className="flex flex-wrap gap-1">
                                                        {r.dietTags.map(
                                                          (dt) => (
                                                            <Badge
                                                              key={dt.tag_id}
                                                              variant="secondary"
                                                              className="text-xs"
                                                            >
                                                              {dt.tag_name}
                                                            </Badge>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Conflicts Details */}
                                      {hasConflicts && (
                                        <div>
                                          <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Chi tiết Xung đột:
                                          </p>
                                          <div className="space-y-2">
                                            {assignment.conflicts!.map(
                                              (alert, idx) => (
                                                <div
                                                  key={idx}
                                                  className={`p-3 rounded-lg border ${getSeverityColor(
                                                    alert.severity
                                                  )}`}
                                                >
                                                  <p className="text-sm font-medium">
                                                    {alert.message}
                                                  </p>
                                                  {alert.suggestion && (
                                                    <p className="text-xs mt-1 opacity-75">
                                                      {alert.suggestion}
                                                    </p>
                                                  )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {assignment.notes && (
                                        <div>
                                          <p className="text-sm font-medium text-slate-800 mb-1">
                                            Ghi chú:
                                          </p>
                                          <p className="text-sm text-slate-600">
                                            {assignment.notes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MedicationCarePlan;
