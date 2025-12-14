import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
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
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import {
  getRoomById,
  type RoomResponse,
  getAvailableRoomsByType,
  createRoomChangeRequest,
} from "@/apis/room.api";
import { toast } from "react-toastify";

const RoomBedFamilyPage: React.FC = () => {
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [selectedResident, setSelectedResident] =
    useState<ResidentResponse | null>(null);
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
    const fetchResidents = async () => {
      try {
        setLoading(true);
        const response = await getResidentsByFamily();
        const residentsList = response.data || [];
        setResidents(residentsList);

        if (residentsList.length > 0) {
          const firstResident = residentsList[0];
          setSelectedResidentId(firstResident.resident_id);
          setSelectedResident(firstResident);
        }
      } catch (error: any) {
        console.error("Failed to fetch residents:", error);
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          toast.error("Không thể tải danh sách cư dân. Please thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!selectedResident?.room_id) {
        setRoomInfo(null);
        return;
      }

      try {
        setLoading(true);
        const response = await getRoomById(selectedResident.room_id);
        setRoomInfo(response.data || response);
      } catch (error: any) {
        console.error("Failed to fetch room info:", error);
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          toast.error("Không thể tải thông tin phòng. Please thử lại sau.");
        }
        setRoomInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [selectedResident?.room_id]);

  const handleResidentChange = (residentId: string) => {
    setSelectedResidentId(residentId);
    const resident = residents.find((r) => r.resident_id === residentId);
    setSelectedResident(resident || null);
  };

  const handleOpenChangeRoomDialog = () => {
    if (!selectedResident) {
      toast.error("Vui lòng chọn cư dân");
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
    if (!selectedResident || !selectedRoomId || !selectedRoomType) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (submittingRequest) {
      return; // Prevent double submit
    }

    setSubmittingRequest(true);
    try {
      await createRoomChangeRequest({
        resident_id: selectedResident.resident_id,
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
      if (selectedResident?.room_id) {
        const response = await getRoomById(selectedResident.room_id);
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

  const getStatusBadge = (
    isAvailable: boolean,
    currentOccupancy: number,
    capacity: number
  ) => {
    if (currentOccupancy >= capacity) {
      return <Badge className="bg-red-500 text-white text-sm">Đầy</Badge>;
    }
    if (isAvailable) {
      return <Badge className="bg-green-500 text-white text-sm">Còn chỗ</Badge>;
    }
    return (
      <Badge className="bg-yellow-500 text-white text-sm">Đang sử dụng</Badge>
    );
  };

  // Parse room number để extract floor và area (nếu có format như P203, A203, etc.)
  const parseRoomNumber = (roomNumber: string) => {
    // Try to extract floor from room number (e.g., P203 -> floor 2, A101 -> floor 1)
    const floorMatch = roomNumber.match(/(\d{1,2})/);
    const floor = floorMatch ? parseInt(floorMatch[1].charAt(0)) : null;

    // Try to extract area from room number (e.g., P203 -> P, A101 -> A)
    const areaMatch = roomNumber.match(/^([A-Z])/);
    const area = areaMatch ? areaMatch[1] : null;

    return { floor, area };
  };

  if (loading && residents.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6 rounded-2xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (residents.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6 rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-800">Thông tin phòng</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              None cư dân nào được liên kết với tài khoản của bạn.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { floor, area } = roomInfo?.room_number
    ? parseRoomNumber(roomInfo.room_number)
    : { floor: null, area: null };

  return (
    <div className="container mx-auto p-6 space-y-6 rounded-2xl">
      <h1 className="text-3xl font-bold text-gray-800">
        Thông tin phòng & giường
      </h1>

      {residents.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="font-semibold">Select cư dân:</label>
              <Select
                value={selectedResidentId}
                onValueChange={handleResidentChange}
              >
                <SelectTrigger className="w-[300px] border-none shadow-sm">
                  <SelectValue placeholder="Select cư dân" />
                </SelectTrigger>
                <SelectContent className="border-none shadow-sm bg-white">
                  {residents.map((r) => (
                    <SelectItem key={r.resident_id} value={r.resident_id}>
                      {r.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              Thông tin phòng của {selectedResident?.full_name || "Resident"}
            </CardTitle>
            {selectedResident?.room_id && (
              <Button
                onClick={handleOpenChangeRoomDialog}
                className="bg-[#5985d8] text-white hover:bg-[#466bb3]"
              >
                Yêu cầu đổi phòng
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!selectedResident?.room_id ? (
            <div className="text-center text-gray-500 py-8">
              Resident chưa được phân bổ phòng.
            </div>
          ) : loading ? (
            <div className="text-center py-8">Loading thông tin phòng...</div>
          ) : roomInfo ? (
            <div className="flex justify-center">
              <div className="max-w-lg grid grid-cols-[150px_1fr] gap-y-4 text-base items-center">
                <div className="font-semibold">Tên:</div>
                <div>{selectedResident.full_name}</div>

                <div className="font-semibold">Room:</div>
                <div>{roomInfo.room_number}</div>

                <div className="font-semibold">Type phòng:</div>
                <div>
                  {roomInfo.type === "single"
                    ? "Đơn"
                    : roomInfo.type === "double"
                    ? "Đôi"
                    : "Nhiều giường"}
                </div>

                <div className="font-semibold">Sức chứa:</div>
                <div>
                  {roomInfo.current_occupancy}/{roomInfo.capacity} người
                </div>

                {floor !== null && (
                  <>
                    <div className="font-semibold">Tầng:</div>
                    <div>{floor}</div>
                  </>
                )}

                {area !== null && (
                  <>
                    <div className="font-semibold">Khu vực:</div>
                    <div>{area}</div>
                  </>
                )}

                <div className="font-semibold">Trạng thái:</div>
                <div>
                  {getStatusBadge(
                    roomInfo.is_available,
                    roomInfo.current_occupancy,
                    roomInfo.capacity
                  )}
                </div>

                {roomInfo.notes && (
                  <>
                    <div className="font-semibold">Ghi chú:</div>
                    <div>{roomInfo.notes}</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không thể tải thông tin phòng.
            </div>
          )}
        </CardContent>
      </Card>

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
            <p>
              Bạn có chắc chắn muốn gửi yêu cầu đổi phòng cho{" "}
              <strong>{selectedResident?.full_name}</strong> không?
            </p>
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

export { RoomBedFamilyPage };
