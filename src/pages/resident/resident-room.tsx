import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoomById, type RoomResponse } from "@/apis/room.api";
import { toast } from "react-toastify";
import { useContext } from "react";
import { AppContext } from "@/contexts/app.context";

const ResidentRoom: React.FC = () => {
  const { profile } = useContext(AppContext);
  const resident = (profile as any)?.resident;
  const [roomInfo, setRoomInfo] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
          <CardTitle className="text-xl text-gray-900">
            Thông tin phòng
          </CardTitle>
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
    </div>
  );
};

export default ResidentRoom;
