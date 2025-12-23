import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Home, Edit, LogOut } from "lucide-react";
import {
  getRoomById,
  getResidentsInRoom,
  getRooms,
  type RoomResponse,
} from "@/apis/room.api";
import { updateResident } from "@/apis/resident.api";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Label } from "@/components/ui";
import path from "@/constants/path";

interface ResidentInRoom {
  resident_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
}

export default function RoomDetail(): React.JSX.Element {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [residents, setResidents] = useState<ResidentInRoom[]>([]);
  const [allRooms, setAllRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangeRoomDialog, setShowChangeRoomDialog] = useState(false);
  const [selectedResident, setSelectedResident] =
    useState<ResidentInRoom | null>(null);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>("");
  const [changingRoom, setChangingRoom] = useState(false);

  useEffect(() => {
    if (room_id) {
      fetchRoomData();
    }
  }, [room_id]);

  const fetchRoomData = async () => {
    if (!room_id) return;

    try {
      setLoading(true);
      const [roomRes, residentsRes, allRoomsRes] = await Promise.all([
        getRoomById(room_id),
        getResidentsInRoom(room_id),
        getRooms(),
      ]);

      setRoom(roomRes.data || roomRes);
      setResidents(residentsRes.data || residentsRes);
      setAllRooms(allRoomsRes.rooms || []);
    } catch (error: any) {
      console.error("Error fetching room data:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải thông tin phòng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRoom = (resident: ResidentInRoom) => {
    setSelectedResident(resident);
    setSelectedNewRoomId("");
    setShowChangeRoomDialog(true);
  };

  const handleConfirmChangeRoom = async () => {
    if (!selectedResident || !selectedNewRoomId) {
      toast.error("Vui lòng chọn phòng mới");
      return;
    }

    if (selectedNewRoomId === room_id) {
      toast.error("Phòng mới phải khác phòng hiện tại");
      return;
    }

    try {
      setChangingRoom(true);
      await updateResident(selectedResident.resident_id, {
        room_id: selectedNewRoomId,
      });
      toast.success("Chuyển phòng thành công!");
      setShowChangeRoomDialog(false);
      setSelectedResident(null);
      setSelectedNewRoomId("");
      // Refresh data
      await fetchRoomData();
    } catch (error: any) {
      console.error("Error changing room:", error);
      toast.error(error.response?.data?.message || "Không thể chuyển phòng");
    } finally {
      setChangingRoom(false);
    }
  };

  // Filter available rooms (exclude current room and full rooms)
  const availableRooms = allRooms.filter(
    (r) =>
      r.room_id !== room_id &&
      r.is_available &&
      r.current_occupancy < r.capacity
  );

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case "single":
        return "Đơn";
      case "double":
        return "Đôi";
      case "multi":
        return "Nhiều giường";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
        <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Đang tải thông tin phòng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
        <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Không tìm thấy thông tin phòng</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <section className="w-full h-full max-w-full rounded-3xl bg-white/95 ring-1 ring-black/5 shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <header className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(path.roomManagement)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold" style={{ color: "#5985d8" }}>
                Chi tiết phòng {room.room_number}
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-hidden p-6 min-h-0">
            <div className="w-full h-full overflow-y-auto overflow-x-hidden space-y-6">
              {/* Room Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Thông tin phòng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Số phòng</Label>
                      <p className="text-lg font-semibold">
                        {room.room_number}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Loại phòng
                      </Label>
                      <p className="text-lg font-semibold">
                        {getRoomTypeLabel(room.type)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Sức chứa</Label>
                      <p className="text-lg font-semibold">{room.capacity}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Đã sử dụng
                      </Label>
                      <p className="text-lg font-semibold">
                        {room.current_occupancy}/{room.capacity}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">
                        Trạng thái
                      </Label>
                      <div className="mt-1">
                        {room.is_available &&
                        room.current_occupancy < room.capacity ? (
                          <Badge className="bg-green-500 text-white">
                            Có sẵn
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">Đầy</Badge>
                        )}
                      </div>
                    </div>
                    {room.notes && (
                      <div className="md:col-span-2">
                        <Label className="text-sm text-gray-600">Ghi chú</Label>
                        <p className="text-sm text-gray-700 mt-1">
                          {room.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Residents List Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Danh sách cư dân ({residents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {residents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Phòng này chưa có cư dân nào
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                              Tên cư dân
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                              Giới tính
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                              Ngày sinh
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {residents.map((resident) => (
                            <tr
                              key={resident.resident_id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-gray-800 font-medium">
                                {resident.full_name}
                              </td>
                              <td className="px-4 py-3 text-gray-800 capitalize">
                                {resident.gender === "male" ? "Nam" : "Nữ"}
                              </td>
                              <td className="px-4 py-3 text-gray-800">
                                {new Date(
                                  resident.date_of_birth
                                ).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChangeRoom(resident)}
                                  className="flex items-center gap-2"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Chuyển phòng
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>

      {/* Change Room Dialog */}
      <Dialog
        open={showChangeRoomDialog}
        onOpenChange={setShowChangeRoomDialog}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Chuyển phòng cho cư dân</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cư dân</Label>
              <p className="text-sm font-semibold mt-1">
                {selectedResident?.full_name}
              </p>
            </div>
            <div>
              <Label>Phòng hiện tại</Label>
              <p className="text-sm font-semibold mt-1">{room.room_number}</p>
            </div>
            <div>
              <Label>Chọn phòng mới *</Label>
              <Select
                value={selectedNewRoomId}
                onValueChange={setSelectedNewRoomId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn phòng mới" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      Không có phòng trống nào
                    </div>
                  ) : (
                    availableRooms.map((r) => (
                      <SelectItem key={r.room_id} value={r.room_id}>
                        {r.room_number} ({getRoomTypeLabel(r.type)}) - Còn{" "}
                        {r.capacity - r.current_occupancy} chỗ trống
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeRoomDialog(false);
                setSelectedResident(null);
                setSelectedNewRoomId("");
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmChangeRoom}
              disabled={!selectedNewRoomId || changingRoom}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {changingRoom ? "Đang chuyển..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
