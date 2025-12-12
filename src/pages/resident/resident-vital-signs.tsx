import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useHealthSummary } from "@/hooks/use-health-summary";
import { AlertTriangle, Heart, Thermometer } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { useContext } from "react";
import { AppContext } from "@/contexts/app.context";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

const ResidentVitalSigns: React.FC = () => {
  const { profile } = useContext(AppContext);
  const residentId = (profile as any)?.resident?.resident_id;

  const summaryQuery = useHealthSummary(residentId);

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

  if (!residentId) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center text-gray-600">
            Không tìm thấy thông tin cư dân.
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
            Lịch sử chỉ số sinh tồn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart */}
          <div className="h-80 w-full">
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
                    name="Tâm thu"
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    name="Tâm trương"
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
                Không có dữ liệu chỉ số sinh tồn.
              </div>
            )}
          </div>

          {/* Latest Vitals */}
          {summary?.vitals.latest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.vitals.latest.blood_pressure_systolic &&
                summary.vitals.latest.blood_pressure_diastolic && (
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          Huyết áp
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.vitals.latest.blood_pressure_systolic}/
                        {summary.vitals.latest.blood_pressure_diastolic}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">mmHg</p>
                    </CardContent>
                  </Card>
                )}
              {summary.vitals.latest.heart_rate && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Nhịp tim
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.vitals.latest.heart_rate}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">bpm</p>
                  </CardContent>
                </Card>
              )}
              {summary.vitals.latest.temperature_c && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Nhiệt độ
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.vitals.latest.temperature_c.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">°C</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Alerts */}
          {summary?.alerts && summary.alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Cảnh báo
              </h3>
              {summary.alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.severity === "critical"
                      ? "border-red-500 bg-red-50"
                      : alert.severity === "warning"
                      ? "border-amber-500 bg-amber-50"
                      : "border-blue-500 bg-blue-50"
                  }`}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold text-gray-900">
                      {alert.message}
                    </p>
                    {alert.recommendation && (
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.recommendation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentVitalSigns;
