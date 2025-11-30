import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ScrollArea,
} from "@/components/ui";
import { useSearchParams } from "react-router-dom";
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import { useQuery } from "@tanstack/react-query";
import { useHealthSummary } from "@/hooks/use-health-summary";
import { AlertTriangle, Heart, Thermometer } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

const severityColors: Record<"normal" | "warning" | "critical", string> = {
  normal: "text-emerald-600 bg-emerald-50 border-emerald-100",
  warning: "text-amber-600 bg-amber-50 border-amber-100",
  critical: "text-red-600 bg-red-50 border-red-100",
};

const alertColorMap: Record<"info" | "warning" | "critical", string> = {
  info: "border-slate-200 bg-slate-50 text-slate-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-red-200 bg-red-50 text-red-900",
};

const FamilyHealthCare: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const residentId = searchParams.get("residentId");

  const residentsQuery = useQuery<ResidentResponse[]>({
    queryKey: ["family-residents"],
    queryFn: async () => {
      const response = await getResidentsByFamily();
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const activeResidentId =
    residentId ||
    (residentsQuery.data && residentsQuery.data.length > 0
      ? residentsQuery.data[0].resident_id
      : undefined);

  React.useEffect(() => {
    if (!residentId && activeResidentId) {
      setSearchParams({ residentId: activeResidentId }, { replace: true });
    }
  }, [residentId, activeResidentId, setSearchParams]);

  const summaryQuery = useHealthSummary(activeResidentId);

  const chartData = useMemo(() => {
    if (!summaryQuery.data?.vitals.history) return [];
    return summaryQuery.data.vitals.history
      .slice()
      .reverse()
      .map((vital) => ({
        name: formatDateTime(vital.measured_at || vital.created_at),
        systolic: vital.blood_pressure_systolic,
        diastolic: vital.blood_pressure_diastolic,
        heartRate: vital.heart_rate,
      }));
  }, [summaryQuery.data]);

  const summary = summaryQuery.data;
  const familyFriendlyAlerts = useMemo(() => {
    if (!summary?.alerts) return [];
    return summary.alerts.map((alert) => {
      switch (alert.id) {
        case "careplan-lag":
          return {
            ...alert,
            message: "Đội ngũ đang tối ưu lịch chăm sóc",
            recommendation:
              "Chúng tôi đã nhắc điều dưỡng cân bằng lại lịch để cư dân được quan tâm đầy đủ.",
          };
        case "hydration-gap":
          return {
            ...alert,
            message: "Cần ghi nhận thêm bữa ăn/nước uống",
            recommendation:
              "Viện sẽ cập nhật lại nhật ký dinh dưỡng và thông báo cho gia đình nếu có vấn đề.",
          };
        case "stale-vitals":
          return {
            ...alert,
            message: "Đang chờ số liệu sinh hiệu mới",
            recommendation:
              "Nhân viên y tế sẽ đo lại sớm và cập nhật cho gia đình ngay khi có kết quả.",
          };
        case "hypertension-risk":
          return {
            ...alert,
            message: "Huyết áp cần được theo dõi sát",
            recommendation:
              "Bác sĩ phụ trách đã được thông báo để điều chỉnh phác đồ nếu cần.",
          };
        case "oxygen-drop":
          return {
            ...alert,
            message: "Độ bão hòa oxy giảm",
            recommendation:
              "Đã kích hoạt quy trình hỗ trợ hô hấp, đội ngũ y tế đang theo dõi liên tục.",
          };
        case "infection-risk":
          return {
            ...alert,
            message: "Dấu hiệu sức khỏe cần chú ý",
            recommendation:
              "Nhân viên y tế đang đánh giá thêm để đảm bảo cư dân luôn an toàn.",
          };
        default:
          return alert;
      }
    });
  }, [summary?.alerts]);

  const selectedResident = residentsQuery.data?.find(
    (resident) => resident.resident_id === activeResidentId
  );

  if (residentsQuery.isLoading) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">
            Đang tải danh sách người thân...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeResidentId || !selectedResident) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            Bạn chưa có người thân nào. Vui lòng quay lại trang My Resident để
            liên kết cư dân.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-6 bg-slate-50">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-gray-200">
              <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">
                {selectedResident.full_name
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl text-gray-900">
                {selectedResident.full_name}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {selectedResident.gender === "male" ? "Nam" : "Nữ"} •{" "}
                {summary?.resident.age ?? "—"} tuổi • Phòng{" "}
                {selectedResident.room?.room_number ?? "—"}
              </p>
              {summary?.meta && (
                <p className="text-xs text-gray-500 mt-1">
                  Cập nhật lúc{" "}
                  {formatDateTime(summary.meta.generated_at) || "—"}
                </p>
              )}
            </div>
          </div>
          <Select
            value={activeResidentId}
            onValueChange={(value) =>
              setSearchParams({ residentId: value }, { replace: true })
            }
          >
            <SelectTrigger className="w-full md:w-80 bg-white border border-gray-200 shadow-sm">
              <SelectValue placeholder="Chọn người thân" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              {residentsQuery.data?.map((resident) => (
                <SelectItem
                  key={resident.resident_id}
                  value={resident.resident_id}
                  className="text-sm"
                >
                  {resident.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {summaryQuery.isLoading ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">
            Đang tải dữ liệu sức khỏe...
          </CardContent>
        </Card>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summary.indicators.map((indicator) => (
              <Card
                key={indicator.id}
                className="border border-gray-200 bg-white shadow-sm"
              >
                <CardHeader className="pb-2">
                  <p className="text-sm text-gray-500">{indicator.label}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-gray-900">
                      {indicator.value}
                    </span>
                    {indicator.unit && (
                      <span className="text-sm text-gray-500">
                        {indicator.unit}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-3 border ${
                      severityColors[indicator.severity]
                    }`}
                  >
                    {indicator.severity === "normal"
                      ? "Ổn định"
                      : indicator.severity === "warning"
                      ? "Cảnh báo"
                      : "Khẩn cấp"}
                  </Badge>
                  <p className="mt-2 text-xs text-gray-500">
                    {indicator.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Xu hướng sinh hiệu</CardTitle>
                  <p className="text-sm text-gray-500">
                    Theo dõi huyết áp & nhịp tim (7 lần đo gần nhất)
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-600"
                >
                  Engine v{summary.meta.engine_version}
                </Badge>
              </CardHeader>
              <CardContent className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        name="Huyết áp tâm thu"
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={false}
                        name="Huyết áp tâm trương"
                      />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#f97316"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        dot={false}
                        name="Nhịp tim"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                    Chưa có dữ liệu sinh hiệu để hiển thị.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Cảnh báo & khuyến nghị</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <div className="space-y-3">
                    {familyFriendlyAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-lg border px-4 py-3 ${
                          alertColorMap[alert.severity]
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {alert.severity === "critical" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : alert.severity === "warning" ? (
                            <Thermometer className="h-4 w-4" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                          {alert.message}
                        </div>
                        <p className="mt-2 text-sm">{alert.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Sinh hiệu mới nhất</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.vitals.latest ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Đo lúc</span>
                      <strong>
                        {formatDateTime(
                          summary.vitals.latest.measured_at ||
                            summary.vitals.latest.created_at
                        )}
                      </strong>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-gray-100 bg-slate-50 p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Huyết áp</p>
                        <p className="text-lg font-semibold">
                          {summary.vitals.latest.blood_pressure_systolic ?? "—"}
                          /
                          {summary.vitals.latest.blood_pressure_diastolic ??
                            "—"}{" "}
                          mmHg
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-slate-50 p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Nhịp tim</p>
                        <p className="text-lg font-semibold">
                          {summary.vitals.latest.heart_rate ?? "—"} bpm
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-slate-50 p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Nhiệt độ</p>
                        <p className="text-lg font-semibold">
                          {summary.vitals.latest.temperature_c ?? "—"} °C
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-slate-50 p-3 shadow-sm">
                        <p className="text-xs text-gray-500">SpO₂</p>
                        <p className="text-lg font-semibold">
                          {summary.vitals.latest.oxygen_saturation ?? "—"}%
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa ghi nhận lần đo nào cho cư dân này.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Carelog gần nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {summary.careLogs.recent.length > 0 ? (
                      summary.careLogs.recent.map((log) => (
                        <div
                          key={log.care_log_id}
                          className="rounded-lg border border-gray-100 bg-slate-50 p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                            <span>{log.title}</span>
                            <Badge
                              variant="outline"
                              className="border-gray-200"
                            >
                              {log.status === "completed"
                                ? "Hoàn tất"
                                : log.status === "in_progress"
                                ? "Đang thực hiện"
                                : "Chờ xử lý"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(log.start_time)}
                          </p>
                          {log.notes && (
                            <p className="mt-2 text-sm text-gray-600">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Chưa có carelog nào trong 20 hoạt động gần nhất.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-500">
            Không thể tải dữ liệu sức khỏe. Vui lòng thử lại.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FamilyHealthCare;
