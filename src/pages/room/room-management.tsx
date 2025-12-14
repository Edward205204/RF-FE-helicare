import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import path from "@/constants/path";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  type RoomResponse,
  type CreateRoomData,
} from "@/apis/room.api";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Button } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getRoomChangeRequests,
  approveRoomChangeRequest,
  rejectRoomChangeRequest,
  type RoomChangeRequestResponse,
} from "@/apis/room.api";

export default function RoomManagement(): React.JSX.Element {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomResponse | null>(null);

  // Room change requests state
  const [roomChangeRequests, setRoomChangeRequests] = useState<
    RoomChangeRequestResponse[]
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<RoomChangeRequestResponse | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

  // Form states
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState<"single" | "double" | "multi">(
    "single"
  );
  const [capacity, setCapacity] = useState(1);
  const [notes, setNotes] = useState("");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await getRooms();
      setRooms(response.data || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast.error(error.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRoomChangeRequests();
  }, [filterStatus]);

  const fetchRoomChangeRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await getRoomChangeRequests(
        filterStatus === "all" ? undefined : filterStatus
      );
      setRoomChangeRequests(response.data || []);
    } catch (error: any) {
      console.error("Error fetching room change requests:", error);
      toast.error(
        error.response?.data?.message || "Failed to load room change requests"
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      await approveRoomChangeRequest(selectedRequest.request_id, approveNotes);
      toast.success("Yêu cầu đổi phòng đã được duyệt thành công!");
      setShowApproveDialog(false);
      setApproveNotes("");
      setSelectedRequest(null);
      fetchRoomChangeRequests();
      fetchRooms(); // Refresh rooms list
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await rejectRoomChangeRequest(selectedRequest.request_id, rejectNotes);
      toast.success("Yêu cầu đổi phòng đã bị từ chối");
      setShowRejectDialog(false);
      setRejectNotes("");
      setSelectedRequest(null);
      fetchRoomChangeRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Chờ duyệt", className: "bg-yellow-500 text-white" },
      approved: { label: "Đã duyệt", className: "bg-blue-500 text-white" },
      rejected: { label: "Đã từ chối", className: "bg-red-500 text-white" },
      completed: { label: "Hoàn thành", className: "bg-green-500 text-white" },
    };
    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-500 text-white",
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Auto-set capacity based on room type (only when creating new room, not editing)
  useEffect(() => {
    if (!isEditing) {
      if (roomType === "single") {
        setCapacity(1);
      } else if (roomType === "double") {
        setCapacity(2);
      }
      // For "multi", keep current capacity value (user can input)
    }
  }, [roomType, isEditing]);

  const resetForm = () => {
    setRoomNumber("");
    setRoomType("single");
    setCapacity(1);
    setNotes("");
    setCurrentRoom(null);
    setIsEditing(false);
  };

  const handleOpenDialog = (room?: RoomResponse) => {
    if (room) {
      setIsEditing(true);
      setCurrentRoom(room);
      setRoomNumber(room.room_number);
      setRoomType(room.type);
      setCapacity(room.capacity);
      setNotes(room.notes || "");
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomNumber.trim()) {
      toast.error("Vui lòng nhập số phòng");
      return;
    }

    if (capacity < 1) {
      toast.error("Sức chứa phải ít nhất là 1");
      return;
    }

    const roomData: CreateRoomData = {
      room_number: roomNumber,
      type: roomType,
      capacity,
      notes: notes || undefined,
    };

    try {
      if (isEditing && currentRoom) {
        await updateRoom(currentRoom.room_id, roomData);
        toast.success("Cập nhật phòng thành công!");
      } else {
        await createRoom(roomData);
        toast.success("Tạo phòng mới thành công!");
      }
      fetchRooms();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error saving room:", error);
      toast.error(
        error.response?.data?.message || "Không thể lưu thông tin phòng"
      );
    }
  };

  const handleDelete = async (room: RoomResponse) => {
    if (room.current_occupancy > 0) {
      toast.error("Không thể xóa phòng đang có cư dân");
      return;
    }

    if (
      !window.confirm(`Bạn có chắc chắn muốn xóa Phòng ${room.room_number}?`)
    ) {
      return;
    }

    try {
      await deleteRoom(room.room_id);
      toast.success("Xóa phòng thành công!");
      fetchRooms();
    } catch (error: any) {
      console.error("Error deleting room:", error);
      toast.error(error.response?.data?.message || "Không thể xóa phòng");
    }
  };

  const today = new Date().toLocaleDateString("vi-VN");

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <section className="w-full h-full max-w-full rounded-3xl bg-white/95 ring-1 ring-black/5 shadow-lg overflow-hidden flex flex-col">
          <header className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold" style={{ color: "#5985d8" }}>
                  Quản lý phòng
                </h1>
                <p className="text-sm text-gray-500">{today}</p>
              </div>
              <button
                onClick={() => handleOpenDialog()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#5985d8] text-white rounded-lg hover:bg-[#4a7bc8] transition-colors shadow-md font-semibold"
                aria-label="Add Room"
              >
                <Plus className="h-5 w-5" />
                Thêm phòng mới
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden p-6 min-h-0">
            <div className="w-full h-full overflow-y-auto overflow-x-hidden">
              <Tabs defaultValue="rooms" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="rooms">Danh sách phòng</TabsTrigger>
                  <TabsTrigger value="requests">
                    Yêu cầu đổi phòng
                    {roomChangeRequests.filter((r) => r.status === "pending")
                      .length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white">
                        {
                          roomChangeRequests.filter(
                            (r) => r.status === "pending"
                          ).length
                        }
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="rooms">
                  <div className="rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-sm w-full">
                    <div className="overflow-x-auto max-w-full">
                      <table className="w-full table-fixed">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                              Số phòng
                            </th>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                              Loại phòng
                            </th>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                              Sức chứa
                            </th>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                              Đã sử dụng
                            </th>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                              Trạng thái
                            </th>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                              Ghi chú
                            </th>
                            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {loading ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-6 py-12 text-center text-gray-500"
                              >
                                Đang tải danh sách phòng...
                              </td>
                            </tr>
                          ) : rooms.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-6 py-12 text-center text-gray-500"
                              >
                                Không tìm thấy phòng nào. Nhấp vào "Thêm phòng
                                mới" để tạo.
                              </td>
                            </tr>
                          ) : (
                            rooms.map((room) => (
                              <tr
                                key={room.room_id}
                                className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  // Không điều hướng nếu click vào button
                                  if (
                                    (e.target as HTMLElement).closest("button")
                                  ) {
                                    return;
                                  }
                                  navigate(
                                    path.roomDetail.replace(
                                      ":room_id",
                                      room.room_id
                                    )
                                  );
                                }}
                              >
                                <td className="px-4 py-4 text-gray-800 font-medium">
                                  {room.room_number}
                                </td>
                                <td className="px-4 py-4 text-gray-800 capitalize">
                                  {room.type === "single"
                                    ? "Đơn"
                                    : room.type === "double"
                                    ? "Đôi"
                                    : "Nhiều giường"}
                                </td>
                                <td className="px-4 py-4 text-gray-800">
                                  {room.capacity}
                                </td>
                                <td className="px-4 py-4 text-gray-800">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {room.current_occupancy}/{room.capacity}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {room.is_available &&
                                  room.current_occupancy < room.capacity ? (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                      Có sẵn
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                      Đầy
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-gray-600 text-sm truncate">
                                  {room.notes || "-"}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleOpenDialog(room)}
                                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                                      title="Chỉnh sửa"
                                    >
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(room)}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Xóa"
                                      disabled={room.current_occupancy > 0}
                                    >
                                      <Trash2
                                        className={`h-4 w-4 ${
                                          room.current_occupancy > 0
                                            ? "text-gray-400"
                                            : "text-red-600"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Yêu cầu đổi phòng</h2>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="approved">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Đã từ chối</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingRequests ? (
                    <div className="text-center py-8">Đang tải...</div>
                  ) : roomChangeRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không có yêu cầu đổi phòng nào
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {roomChangeRequests.map((request) => (
                        <Card key={request.request_id}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {request.resident?.full_name || "N/A"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Ngày yêu cầu:{" "}
                                  {new Date(
                                    request.created_at
                                  ).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Phòng hiện tại:
                                </p>
                                <p className="font-semibold">
                                  {request.current_room?.room_number ||
                                    "Chưa có phòng"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Phòng yêu cầu:
                                </p>
                                <p className="font-semibold">
                                  {request.requested_room?.room_number || "N/A"}{" "}
                                  (
                                  {request.requested_room_type === "single"
                                    ? "Đơn"
                                    : request.requested_room_type === "double"
                                    ? "Đôi"
                                    : "Nhiều giường"}
                                  )
                                </p>
                              </div>
                            </div>

                            {request.reason && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-600">Lý do:</p>
                                <p className="text-sm">{request.reason}</p>
                              </div>
                            )}

                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApproveDialog(true);
                                  }}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  Duyệt
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectDialog(true);
                                  }}
                                  variant="destructive"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            )}

                            {request.notes && (
                              <div className="mt-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                  Ghi chú từ staff:
                                </p>
                                <p className="text-sm">{request.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </div>

      {/* Dialog for Create/Edit Room */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Chỉnh sửa phòng" : "Tạo phòng mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Số phòng *</Label>
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Vd: 101, A-201"
                  className="border border-gray-200 shadow-none bg-white"
                  required
                />
              </div>

              <div>
                <Label>Loại phòng *</Label>
                <Select
                  value={roomType}
                  onValueChange={(v) =>
                    setRoomType(v as "single" | "double" | "multi")
                  }
                >
                  <SelectTrigger className="border border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 bg-white">
                    <SelectItem value="single">Phòng đơn</SelectItem>
                    <SelectItem value="double">Phòng đôi</SelectItem>
                    <SelectItem value="multi">Phòng nhiều giường</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sức chứa *</Label>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCapacity(value);
                  }}
                  disabled={
                    !isEditing &&
                    (roomType === "single" || roomType === "double")
                  }
                  className="border border-gray-200 shadow-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
                {!isEditing &&
                  (roomType === "single" || roomType === "double") && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sức chứa tự động đặt là{" "}
                      {roomType === "single" ? "1" : "2"} cho{" "}
                      {roomType === "single" ? "phòng đơn" : "phòng đôi"}
                    </p>
                  )}
              </div>

              <div>
                <Label>Ghi chú (Tùy chọn)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thông tin bổ sung..."
                  rows={3}
                  className="border border-gray-200 shadow-none bg-white"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                {isEditing ? "Cập nhật" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu đổi phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Bạn có chắc chắn muốn duyệt yêu cầu đổi phòng cho{" "}
              <strong>{selectedRequest?.resident?.full_name}</strong> không?
            </p>
            <div>
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setApproveNotes("");
                setSelectedRequest(null);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleApproveRequest}
              className="bg-green-500 hover:bg-green-600"
            >
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu đổi phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Bạn có chắc chắn muốn từ chối yêu cầu đổi phòng cho{" "}
              <strong>{selectedRequest?.resident?.full_name}</strong> không?
            </p>
            <div>
              <Label>Lý do từ chối (tùy chọn)</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectNotes("");
                setSelectedRequest(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleRejectRequest} variant="destructive">
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
