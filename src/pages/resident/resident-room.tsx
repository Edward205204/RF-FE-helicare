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
      if (!resident?.room_id) {
        setRoomInfo(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getRoomById(resident.room_id);
        setRoomInfo(response.data || response);
      } catch (error: any) {
        console.error("Failed to fetch room info:", error);
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          toast.error("Cannot load room info. Please try again later.");
        }
        setRoomInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [resident?.room_id]);

  if (loading) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">
            Loading room info...
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
            Room not assigned.
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
            Room Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Room {roomInfo.room_number}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Type:{" "}
                {roomInfo.type === "single"
                  ? "Single"
                  : roomInfo.type === "double"
                  ? "Double"
                  : "Multiple"}
              </p>
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
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {roomInfo.capacity}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-gray-900">
                {roomInfo.current_occupancy}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentRoom;
