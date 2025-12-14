import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import {
  getRoomById,
  type RoomResponse,
  getAvailableRoomsByType,
  createRoomChangeRequest,
} from "@/apis/room.api";
import { toast } from "react-toastify";
import { useContext } from "react";
import { AppContext } from "@/contexts/app.context";

const ResidentRoom: React.FC = () => {
  const { profile } = useContext(AppContext);
  const resident = (profile as any)?.resident;
  const [roomInfo, setRoomInfo] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangeRoomDialog, setShowChangeRoomDialog] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<
    "single" | "double" | "multi" | ""
  >("");
  const [availableRooms, setAvailableRooms] = useState<RoomResponse[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      // Check for room_id in resident object or nested room object
      const roomId = resident?.room?.room_id || resident?.room_id;

      if (!roomId) {
        setRoomInfo(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getRoomById(roomId);
        setRoomInfo(response.data || response);
      } catch (error: any) {
        console.error("Failed to fetch room info:", error);
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          toast.error("Không thể tải thông tin phòng. Vui lòng thử lại sau.");
        }
        setRoomInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [resident]);

  const handleOpenChangeRoomDialog = () => {
    if (!resident?.resident_id) {
      toast.error("Không tìm thấy thông tin cư dân");
      return;
    }
    setShowChangeRoomDialog(true);
    setSelectedRoomType("");
    setAvailableRooms([]);
    setSelectedRoomId("");
    setReason("");
  };

  const handleRoomTypeChange = async (type: "single" | "double" | "multi") => {
    setSelectedRoomType(type);
    setSelectedRoomId("");
    setLoadingRooms(true);
    try {
      const response = await getAvailableRoomsByType(type);
      setAvailableRooms(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch available rooms:", error);
      toast.error("Không thể tải danh sách phòng trống");
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleConfirmRequest = () => {
    if (!selectedRoomId) {
      toast.error("Vui lòng chọn phòng");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!resident?.resident_id || !selectedRoomId || !selectedRoomType) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (submittingRequest) {
      return; // Prevent double submit
    }

    setSubmittingRequest(true);
    try {
      await createRoomChangeRequest({
        resident_id: resident.resident_id,
        requested_room_id: selectedRoomId,
        requested_room_type: selectedRoomType,
        reason: reason || undefined,
      });
      toast.success("Yêu cầu đổi phòng đã được gửi thành công!");
      setShowChangeRoomDialog(false);
      setShowConfirmDialog(false);
      // Reset form
      setSelectedRoomId("");
      setSelectedRoomType("");
      setReason("");
      // Refresh room info
      const roomId = resident?.room?.room_id || resident?.room_id;
      if (roomId) {
        const response = await getRoomById(roomId);
        setRoomInfo(response.data || response);
      }
    } catch (error: any) {
      console.error("Failed to create room change request:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể gửi yêu cầu đổi phòng";
      toast.error(errorMessage);
      // Nếu lỗi 409, đóng dialog để user có thể xem lại
      if (error.response?.status === 409) {
        setShowConfirmDialog(false);
      }
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">
            Đang tải thông tin phòng...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            Chưa được phân phòng.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-6 bg-white">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gray-900">
              Thông tin phòng
            </CardTitle>
            {roomInfo && (
              <Button
                onClick={handleOpenChangeRoomDialog}
                className="bg-[#5985d8] text-white hover:bg-[#466bb3]"
              >
                Yêu cầu đổi phòng
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Phòng {roomInfo.room_number}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Loại phòng:{" "}
                {roomInfo.type === "single"
                  ? "Đơn"
                  : roomInfo.type === "double"
                  ? "Đôi"
                  : "Nhiều người"}
              </p>
              {roomInfo.notes && (
                <p className="text-sm text-gray-500 mt-1 italic">
                  Ghi chú: {roomInfo.notes}
                </p>
              )}
            </div>
            <Badge
              className={
                roomInfo.current_occupancy >= roomInfo.capacity
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
              }
            >
              {roomInfo.current_occupancy}/{roomInfo.capacity}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Sức chứa</p>
              <p className="text-2xl font-bold text-gray-900">
                {roomInfo.capacity} người
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Đang ở</p>
              <p className="text-2xl font-bold text-gray-900">
                {roomInfo.current_occupancy} người
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roommates Section */}
      {roomInfo.residents && roomInfo.residents.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Bạn cùng phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomInfo.residents.map((roommate) => (
                <div
                  key={roommate.resident_id}
                  className={`p-4 rounded-lg border ${
                    roommate.resident_id === resident?.resident_id
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {roommate.full_name}
                    {roommate.resident_id === resident?.resident_id && " (Bạn)"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Giới tính: {roommate.gender === "Male" ? "Nam" : "Nữ"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Ngày sinh:{" "}
                    {new Date(roommate.date_of_birth).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog yêu cầu đổi phòng */}
      <Dialog
        open={showChangeRoomDialog}
        onOpenChange={setShowChangeRoomDialog}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yêu cầu đổi phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loại phòng muốn chuyển đến</Label>
              <Select
                value={selectedRoomType}
                onValueChange={handleRoomTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Đơn</SelectItem>
                  <SelectItem value="double">Đôi</SelectItem>
                  <SelectItem value="multi">Nhiều giường</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRoomType && (
              <div>
                <Label>Chọn phòng</Label>
                {loadingRooms ? (
                  <div className="text-center py-4">
                    Đang tải danh sách phòng...
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Không có phòng trống loại này
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {availableRooms.map((room) => (
                      <div
                        key={room.room_id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedRoomId === room.room_id
                            ? "border-[#5985d8] bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedRoomId(room.room_id)}
                      >
                        <div className="font-semibold">
                          Phòng {room.room_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {room.current_occupancy}/{room.capacity} người
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Lý do yêu cầu đổi phòng (tùy chọn)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do yêu cầu đổi phòng..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeRoomDialog(false);
                setShowConfirmDialog(false);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmRequest}
              disabled={!selectedRoomId}
              className="bg-[#5985d8] text-white hover:bg-[#466bb3]"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận cuối cùng */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận yêu cầu đổi phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Bạn có chắc chắn muốn gửi yêu cầu đổi phòng không?</p>
            {selectedRoomId && (
              <p className="text-sm text-gray-600">
                Phòng yêu cầu:{" "}
                {availableRooms.find((r) => r.room_id === selectedRoomId)
                  ?.room_number || ""}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={submittingRequest}
              className="bg-[#5985d8] text-white hover:bg-[#466bb3]"
            >
              {submittingRequest ? "Đang gửi..." : "Xác nhận gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResidentRoom;
