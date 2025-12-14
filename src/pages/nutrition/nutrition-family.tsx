import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui";
import { Alert, AlertDescription } from "@/components/ui";
import { Progress } from "@/components/ui";
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import {
  getMealCareLogsByResident,
  type CareLogResponse,
} from "@/apis/carelog.api";
import { useWeeklyMenuData } from "@/hooks/useWeeklyMenuData";
import { WeeklyMenuDisplay } from "@/components/nutrition/WeeklyMenuDisplay";
import {
  extractApiData,
  getWeekEndDateString,
  deriveConsumptionFromLog,
  matchMealLogForMenuItem,
  ConsumptionInfo,
} from "@/utils/nutrition.utils";

const NutritionAllergyPage: React.FC = () => {
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [selectedResident, setSelectedResident] =
    useState<ResidentResponse | null>(null);
  const [mealCareLogs, setMealCareLogs] = useState<CareLogResponse[]>([]);
  const [mealLogsLoading, setMealLogsLoading] = useState(false);
  const [mealLogsError, setMealLogsError] = useState<string | null>(null);

  // Get current week's Monday
  const getCurrentWeekMonday = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return monday.toISOString().split("T")[0];
  };

  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekMonday());
  const {
    weeklyMenu,
    nutritionReport,
    dishNutritionMap,
    loadingMenu,
    error: menuError,
  } = useWeeklyMenuData(weekStart);

  const weekStartDate = useMemo(() => {
    if (!weekStart) return null;
    const date = new Date(`${weekStart}T00:00:00`);
    // Ensure reset time to start of day
    date.setHours(0, 0, 0, 0);
    return date;
  }, [weekStart]);

  const consumptionMap = useMemo<Map<string, ConsumptionInfo>>(() => {
    if (!weeklyMenu?.menuItems || !weekStartDate || mealCareLogs.length === 0) {
      return new Map();
    }

    const map = new Map<string, ConsumptionInfo>();
    weeklyMenu.menuItems.forEach((item) => {
      const matchedLog = matchMealLogForMenuItem(
        item,
        mealCareLogs,
        weekStartDate
      );
      map.set(item.menu_item_id, deriveConsumptionFromLog(matchedLog));
    });

    return map;
  }, [weeklyMenu?.menuItems, mealCareLogs, weekStartDate]);

  useEffect(() => {
    const loadResidents = async () => {
      try {
        const residentsRes = await getResidentsByFamily();
        const residentPayload =
          extractApiData<ResidentResponse[]>(residentsRes.data) || [];
        const residentList: ResidentResponse[] = Array.isArray(residentPayload)
          ? residentPayload
          : [];
        setResidents(residentList);
        setSelectedResident((prev) => {
          if (prev) {
            const stillExists = residentList.find(
              (resident) => resident.resident_id === prev.resident_id
            );
            if (stillExists) {
              return stillExists;
            }
          }
          return residentList[0] || null;
        });
      } catch (error) {
        console.error("Error loading residents:", error);
        setResidents([]);
        setSelectedResident(null);
      }
    };

    loadResidents();
  }, []);

  useEffect(() => {
    const loadMealLogs = async () => {
      if (!selectedResident) {
        setMealCareLogs([]);
        return;
      }

      setMealLogsLoading(true);
      setMealLogsError(null);

      try {
        const weekEnd = getWeekEndDateString(weekStart);
        const response = await getMealCareLogsByResident(
          selectedResident.resident_id,
          {
            start_date: weekStart,
            end_date: weekEnd,
            take: 200,
          }
        );
        const careLogPayload =
          extractApiData<{
            care_logs: CareLogResponse[];
          }>(response.data) || null;
        setMealCareLogs(careLogPayload?.care_logs || []);
      } catch (error) {
        console.error("Error loading meal care logs:", error);
        setMealCareLogs([]);
        setMealLogsError("Không thể tải nhật ký bữa ăn. Vui lòng thử lại sau.");
      } finally {
        setMealLogsLoading(false);
      }
    };

    loadMealLogs();
  }, [selectedResident?.resident_id, weekStart]);

  // Get resident allergies list
  const residentAllergies =
    selectedResident?.allergies?.map((a) => a.substance) || [];

  // Get resident chronic diseases
  const residentDiseases =
    selectedResident?.chronicDiseases
      ?.filter((d) => d.status === "ACTIVE")
      .map((d) => d.name) || [];

  const menuItems = weeklyMenu?.menuItems || [];
  const totalMeals = menuItems.length;
  const servedMeals = menuItems.reduce((count, item) => {
    const ratio = consumptionMap.get(item.menu_item_id)?.ratio ?? 0;
    return ratio > 0 ? count + 1 : count;
  }, 0);
  const consumedEquivalent = menuItems.reduce((sum, item) => {
    const ratio = consumptionMap.get(item.menu_item_id)?.ratio ?? 0;
    return sum + ratio;
  }, 0);
  const progressPercent =
    totalMeals > 0 ? Math.round((consumedEquivalent / totalMeals) * 100) : 0;

  return (
    <div className="w-full relative">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)]"></div>
      <div className="relative z-10 max-w-6xl mx-auto p-2 space-y-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">
          Dinh dưỡng & Dị ứng
        </h1>
        {selectedResident && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Thông tin cư dân
              </h2>
              <p className="text-lg">
                <strong>Họ tên:</strong> {selectedResident.full_name}
              </p>
              {residentDiseases.length > 0 && (
                <p className="text-lg">
                  <strong>Bệnh lý:</strong> {residentDiseases.join(", ")}
                </p>
              )}
              {residentAllergies.length > 0 && (
                <div className="mt-2">
                  <strong className="text-lg">Dị ứng:</strong>
                  {residentAllergies.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant="destructive"
                      className="text-sm ml-2"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {residentAllergies.length > 0 && (
              <Alert className="mb-6 bg-red-100 border-red-300 rounded-lg">
                <AlertDescription className="text-lg text-red-800">
                  ⚠️ Cảnh báo: Các bữa ăn chứa {residentAllergies.join(", ")}{" "}
                  được làm nổi bật.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Tiến độ tuần
          </h2>
          <Progress value={progressPercent} className="w-full" />
          <p className="text-lg mt-2">
            Đã ghi nhận {servedMeals} / {totalMeals} khẩu phần (
            {progressPercent}
            %)
          </p>
          {mealLogsLoading && (
            <p className="text-sm text-gray-500 mt-1">
              Đang đồng bộ nhật ký bữa ăn...
            </p>
          )}
          {mealLogsError && (
            <p className="text-sm text-red-500 mt-1">{mealLogsError}</p>
          )}
        </div>
        {/* Week Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Chọn tuần (Thứ 2)
          </label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>

        {/* Resident Selector */}
        {residents.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Chọn cư dân
            </label>
            <select
              value={selectedResident?.resident_id || ""}
              onChange={(e) => {
                const resident = residents.find(
                  (r) => r.resident_id === e.target.value
                );
                setSelectedResident(resident || null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer"
            >
              {residents.map((r) => (
                <option key={r.resident_id} value={r.resident_id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loadingMenu ? (
          <div className="text-center py-8 text-gray-400 italic">
            Đang tải thực đơn...
          </div>
        ) : (
          <WeeklyMenuDisplay
            weeklyMenu={weeklyMenu}
            nutritionReport={nutritionReport}
            dishNutritionMap={dishNutritionMap}
            consumptionMap={consumptionMap}
            selectedResident={selectedResident}
          />
        )}
      </div>
    </div>
  );
};

export default NutritionAllergyPage;
