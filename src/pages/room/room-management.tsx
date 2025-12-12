import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
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

export default function RoomManagement(): React.JSX.Element {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomResponse | null>(null);

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
  }, []);

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
                            Không tìm thấy phòng nào. Nhấp vào "Thêm phòng mới"
                            để tạo.
                          </td>
                        </tr>
                      ) : (
                        rooms.map((room) => (
                          <tr
                            key={room.room_id}
                            className="hover:bg-blue-50/50 transition-colors"
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
    </div>
  );
}
