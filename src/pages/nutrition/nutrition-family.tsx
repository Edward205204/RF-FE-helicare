import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Alert, AlertDescription } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Progress } from "@/components/ui";
import {
  getWeeklyMenuByWeekForFamily,
  calculateDishNutrition,
  validateMenuNutritionForFamily,
  type WeeklyMenu,
  type MealSlot,
  type NutritionSummary,
  type WeeklyMenuNutritionReport,
  type WeeklyMenuItem,
} from "@/apis/menu-planner.api";
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import {
  getMealCareLogsByResident,
  type CareLogResponse,
} from "@/apis/carelog.api";

const mealSlotKeywordMap: Record<MealSlot, string[]> = {
  Breakfast: ["breakfast", "sáng", "morning"],
  Lunch: ["lunch", "trưa", "midday"],
  Afternoon: ["afternoon", "snack", "xế"],
  Dinner: ["dinner", "tối", "evening", "supper"],
};

const consumptionPatterns: Array<{
  regex: RegExp;
  ratio: number;
  label: string;
}> = [
  {
    regex: /(100%|full|đầy|ăn hết|1\s?suất|toàn bộ)/i,
    ratio: 1,
    label: "Ăn hết khẩu phần",
  },
  { regex: /(75%|3\/4|0\.75)/i, ratio: 0.75, label: "Ăn 75% khẩu phần" },
  {
    regex: /(50%|half|1\/2|nửa\s?suất|0\.5)/i,
    ratio: 0.5,
    label: "Ăn 50% khẩu phần",
  },
  { regex: /(25%|1\/4|0\.25|ăn nhẹ)/i, ratio: 0.25, label: "Ăn nhẹ (~25%)" },
  {
    regex: /(0%|skip|skipped|bỏ bữa|không ăn|refuse)/i,
    ratio: 0,
    label: "Bỏ bữa",
  },
];

interface ConsumptionInfo {
  label: string;
  ratio: number;
  log?: CareLogResponse;
}

const EMPTY_CONSUMPTION: ConsumptionInfo = { label: "Chưa ghi nhận", ratio: 0 };

const toStartOfDay = (date: Date) => {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
};

const parseDateInput = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return toStartOfDay(date);
};

const addDays = (base: Date, days: number) => {
  const cloned = new Date(base);
  cloned.setDate(cloned.getDate() + days);
  return cloned;
};
const formatMetric = (
  value: number | undefined,
  options?: { unit?: string; fallback?: string }
) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return options?.fallback ?? "—";
  }
  const rounded = Math.round(value);
  return `${rounded}${options?.unit ? ` ${options.unit}` : ""}`;
};

const extractApiData = <T,>(payload: unknown): T | null => {
  if (!payload) return null;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in (payload as Record<string, unknown>)
  ) {
    const nested = (payload as Record<string, unknown>).data;
    return (nested as T) ?? null;
  }
  return payload as T;
};

const dayNameToIndex: Record<string, number> = {
  monday: 0,
  mon: 0,
  tuesday: 1,
  tue: 1,
  wednesday: 2,
  wed: 2,
  thursday: 3,
  thu: 3,
  thur: 3,
  friday: 4,
  fri: 4,
  saturday: 5,
  sat: 5,
  sunday: 6,
  sun: 6,
};

const normalizeDayIndex = (
  value: number | string | null | undefined
): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return ((value % 7) + 7) % 7;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed in dayNameToIndex) {
      return dayNameToIndex[trimmed];
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return ((parsed % 7) + 7) % 7;
    }
  }
  return -1;
};

const isSameDay = (dateA: Date, dateB: Date) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const getWeekEndDateString = (weekStart: string) => {
  const startDate = parseDateInput(weekStart);
  if (!startDate) return weekStart;
  const endDate = addDays(startDate, 6);
  return endDate.toISOString().split("T")[0];
};

const matchMealLogForMenuItem = (
  menuItem: WeeklyMenuItem,
  logs: CareLogResponse[],
  weekStartDate: Date | null
) => {
  if (!weekStartDate) return undefined;
  const dayIndex = normalizeDayIndex(menuItem.day_of_week);
  if (dayIndex < 0) return undefined;
  const targetDate = addDays(weekStartDate, dayIndex);
  const sameDayLogs = logs.filter((log) => {
    if (!log.start_time) return false;
    const logDate = new Date(log.start_time);
    if (Number.isNaN(logDate.getTime())) return false;
    return isSameDay(logDate, targetDate);
  });

  if (sameDayLogs.length === 0) {
    return undefined;
  }

  const slotKeywords = mealSlotKeywordMap[menuItem.meal_slot as MealSlot] || [];
  const dishName = menuItem.dish?.name?.toLowerCase();

  const slotMatchedLogs =
    slotKeywords.length > 0
      ? sameDayLogs.filter((log) => {
          if (!log.meal_type) return true;
          const normalizedType = log.meal_type.toLowerCase();
          return slotKeywords.some((keyword) =>
            normalizedType.includes(keyword)
          );
        })
      : sameDayLogs;

  const dishMatchedLog =
    dishName && dishName.length > 0
      ? slotMatchedLogs.find((log) => {
          const combined = `${log.food_items || ""} ${
            log.title || ""
          }`.toLowerCase();
          return combined.includes(dishName);
        })
      : undefined;

  return dishMatchedLog || slotMatchedLogs[0] || sameDayLogs[0];
};

const deriveConsumptionFromLog = (log?: CareLogResponse): ConsumptionInfo => {
  if (!log) return { ...EMPTY_CONSUMPTION };

  const combinedText = `${log.quantity || ""} ${log.notes || ""} ${
    log.food_items || ""
  }`.trim();

  const matchedPattern = consumptionPatterns.find((pattern) =>
    pattern.regex.test(combinedText)
  );

  if (matchedPattern) {
    return {
      label: matchedPattern.label,
      ratio: matchedPattern.ratio,
      log,
    };
  }

  if (log.status === "completed") {
    return { label: "Đã phục vụ đầy đủ", ratio: 1, log };
  }

  if (log.status === "in_progress") {
    return { label: "Đang phục vụ", ratio: 0.5, log };
  }

  return { label: "Đang chờ ghi nhận", ratio: 0, log };
};

interface DishNutritionData {
  dish_id: string;
  nutrition: NutritionSummary | null;
  loading: boolean;
}

const NutritionAllergyPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [selectedResident, setSelectedResident] =
    useState<ResidentResponse | null>(null);
  const [nutritionReport, setNutritionReport] =
    useState<WeeklyMenuNutritionReport | null>(null);
  const [dishNutritionMap, setDishNutritionMap] = useState<
    Map<string, DishNutritionData>
  >(new Map());
  const [loadingNutrition, setLoadingNutrition] = useState(false);
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
  const weekStartDate = useMemo(() => parseDateInput(weekStart), [weekStart]);
  const consumptionMap = useMemo<Map<string, ConsumptionInfo>>(() => {
    if (!weeklyMenu?.menuItems || !weekStartDate) {
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

  // Load nutrition data for all dishes in menu
  const loadDishNutrition = async (menu: WeeklyMenu) => {
    if (!menu.menuItems) return;

    setLoadingNutrition(true);
    const nutritionMap = new Map<string, DishNutritionData>();

    // Initialize map
    menu.menuItems.forEach((item) => {
      if (item.dish_id && !nutritionMap.has(item.dish_id)) {
        nutritionMap.set(item.dish_id, {
          dish_id: item.dish_id,
          nutrition: null,
          loading: true,
        });
      }
    });

    setDishNutritionMap(nutritionMap);

    // Load nutrition for each unique dish
    const uniqueDishIds = Array.from(nutritionMap.keys());
    const nutritionPromises = uniqueDishIds.map(async (dish_id) => {
      try {
        const menuItem = menu.menuItems?.find(
          (item) => item.dish_id === dish_id
        );
        const servings = menuItem?.servings || 1;
        const nutritionRes = await calculateDishNutrition(dish_id, servings);
        const nutritionData =
          extractApiData<NutritionSummary>(nutritionRes.data) || null;
        return { dish_id, nutrition: nutritionData };
      } catch (error) {
        console.error(`Error loading nutrition for dish ${dish_id}:`, error);
        return { dish_id, nutrition: null };
      }
    });

    const nutritionResults = await Promise.all(nutritionPromises);
    const updatedMap = new Map(nutritionMap);
    nutritionResults.forEach(({ dish_id, nutrition }) => {
      const existing = updatedMap.get(dish_id);
      if (existing) {
        updatedMap.set(dish_id, {
          ...existing,
          nutrition,
          loading: false,
        });
      }
    });

    setDishNutritionMap(updatedMap);
    setLoadingNutrition(false);
  };

  // Load nutrition report for the week
  const loadNutritionReport = async (menu: WeeklyMenu) => {
    try {
      // Use family endpoint that takes week_start_date instead of menu_id
      const reportRes = await validateMenuNutritionForFamily(weekStart);
      const reportPayload =
        extractApiData<WeeklyMenuNutritionReport>(reportRes.data) || null;
      setNutritionReport(reportPayload);
    } catch (error) {
      console.error("Error loading nutrition report:", error);
      setNutritionReport(null);
    }
  };

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
    const loadWeeklyMenuData = async () => {
      try {
        const menuRes = await getWeeklyMenuByWeekForFamily(weekStart);
        const weeklyMenuPayload =
          extractApiData<WeeklyMenu>(menuRes.data) || null;
        if (weeklyMenuPayload) {
          setWeeklyMenu(weeklyMenuPayload);
          await loadDishNutrition(weeklyMenuPayload);
          await loadNutritionReport(weeklyMenuPayload);
        } else {
          setWeeklyMenu(null);
          setNutritionReport(null);
          setDishNutritionMap(new Map());
        }
      } catch (error) {
        console.error("Error loading weekly menu:", error);
        setWeeklyMenu(null);
        setNutritionReport(null);
        setDishNutritionMap(new Map());
      }
    };

    loadWeeklyMenuData();
  }, [weekStart]);

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

  const hasAllergyAlert = (dish: any) => {
    if (!selectedResident || !selectedResident.allergies) return false;
    const residentAllergies = selectedResident.allergies.map((a) =>
      a.substance.toLowerCase()
    );
    const dietaryFlags = (dish?.dietary_flags as string[]) || [];
    return dietaryFlags.some((flag) =>
      residentAllergies.includes(flag.toLowerCase())
    );
  };

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

  const DishCard: React.FC<{
    menuItem: WeeklyMenuItem;
    dish: any;
  }> = ({ menuItem, dish }) => {
    if (!dish) return null;

    const consumption = consumptionMap.get(menuItem.menu_item_id) ?? {
      ...EMPTY_CONSUMPTION,
    };
    const alert = hasAllergyAlert(dish);
    const nutritionData = dishNutritionMap.get(dish.dish_id);
    const nutrition = nutritionData?.nutrition;

    // Get dietary flags
    const dietaryFlags = (dish.dietary_flags as string[]) || [];

    return (
      <Card
        className={`rounded-lg shadow-lg bg-white border-none ${
          alert ? "border-red-500 border-2" : ""
        }`}
      >
        <CardHeader>
          <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
          <CardTitle className="text-xl">{dish.name}</CardTitle>
          {alert && (
            <Alert className="bg-red-100 border-red-300 rounded-lg">
              <AlertDescription className="text-lg text-red-800">
                ⚠️ Contains allergens that resident is allergic to
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {nutrition ? (
            <>
              <p className="text-lg mb-2">
                <strong>Calories:</strong>{" "}
                {formatMetric(nutrition.calories, { unit: "kcal" })}
              </p>
              <div className="mb-2">
                <strong className="text-lg">
                  Nutrients (per {menuItem.servings} serving
                  {menuItem.servings > 1 ? "s" : ""}):
                </strong>
                <ul className="list-disc list-inside text-sm mt-1">
                  <li>
                    Protein: {formatMetric(nutrition.protein, { unit: "g" })}
                  </li>
                  <li>Fat: {formatMetric(nutrition.fat, { unit: "g" })}</li>
                  <li>Carbs: {formatMetric(nutrition.carbs, { unit: "g" })}</li>
                  {nutrition.fiber !== undefined && (
                    <li>
                      Fiber: {formatMetric(nutrition.fiber, { unit: "g" })}
                    </li>
                  )}
                  {nutrition.sodium !== undefined && (
                    <li>
                      Sodium: {formatMetric(nutrition.sodium, { unit: "mg" })}
                    </li>
                  )}
                </ul>
              </div>
            </>
          ) : nutritionData?.loading ? (
            <p className="text-sm text-gray-500">Loading nutrition data...</p>
          ) : (
            <p className="text-sm text-gray-500">
              Nutrition data not available
            </p>
          )}
          <div className="mb-4">
            <Badge variant="outline" className="text-sm mr-2">
              Texture: {dish.texture || menuItem.texture_variant || "Regular"}
            </Badge>
            {menuItem.texture_variant && (
              <Badge variant="secondary" className="text-sm mr-2">
                Variant: {menuItem.texture_variant}
              </Badge>
            )}
            {dietaryFlags.map((flag) => (
              <Badge key={flag} variant="outline" className="text-sm mr-2">
                {flag}
              </Badge>
            ))}
          </div>
          <p className="text-lg font-semibold mt-2">
            Tình trạng: {consumption.label}
          </p>
          {consumption.log?.notes && (
            <p className="text-sm text-gray-600 mt-1">
              Ghi chú: {consumption.log.notes}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render meal slots from weekly menu
  const renderMealSlots = (dayIndex: number) => {
    if (!weeklyMenu || !weeklyMenu.menuItems) return null;

    const dayItems = weeklyMenu.menuItems.filter(
      (item) => normalizeDayIndex(item.day_of_week) === dayIndex
    );
    const mealSlots: MealSlot[] = ["Breakfast", "Lunch", "Afternoon", "Dinner"];

    return (
      <div className="space-y-4">
        {mealSlots.map((slot) => {
          const slotItems = dayItems.filter((item) => item.meal_slot === slot);
          if (slotItems.length === 0) return null;

          return (
            <div key={slot} className="space-y-2">
              <h4 className="font-semibold text-lg mb-2">{slot}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slotItems.map((item) => (
                  <DishCard
                    key={item.menu_item_id}
                    menuItem={item}
                    dish={item.dish}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const WeeklyOverview: React.FC = () => {
    if (!weeklyMenu || !weeklyMenu.menuItems) {
      return (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            Weekly Overview
          </h2>
          <p className="text-gray-500">No menu data available for this week.</p>
        </div>
      );
    }

    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const mealSlots: MealSlot[] = ["Breakfast", "Lunch", "Afternoon", "Dinner"];

    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          Weekly Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {dayNames.map((dayName, dayIndex) => {
            const dayItems = (weeklyMenu.menuItems || []).filter(
              (item) => normalizeDayIndex(item.day_of_week) === dayIndex
            );
            const dayNutrition = nutritionReport?.daily_summaries?.find(
              (d) => d.day_of_week === dayIndex
            );

            return (
              <Card
                key={dayName}
                className="rounded-lg border border-blue-500 shadow-sm bg-white"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{dayName}</CardTitle>
                  {dayNutrition && (
                    <div className="text-xs text-gray-600 mt-1">
                      <p>
                        Calories:{" "}
                        {formatMetric(dayNutrition.total_calories, {
                          unit: "kcal",
                        })}
                      </p>
                      <p>
                        Protein:{" "}
                        {formatMetric(dayNutrition.total_protein, {
                          unit: "g",
                        })}
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No meals scheduled</p>
                  ) : (
                    mealSlots.map((slot) => {
                      const slotItems = dayItems.filter(
                        (item) => item.meal_slot === slot
                      );
                      if (slotItems.length === 0) return null;

                      const slotNutrition = dayNutrition?.meal_slots?.find(
                        (m) => m.meal_slot === slot
                      );

                      return (
                        <div key={slot} className="mb-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            {slot}
                            {slotNutrition && (
                              <span className="text-gray-500 ml-1">
                                (
                                {formatMetric(slotNutrition.summary.calories, {
                                  unit: "kcal",
                                  fallback: "—",
                                })}
                                )
                              </span>
                            )}
                          </p>
                          {slotItems.map((item) => (
                            <div
                              key={item.menu_item_id}
                              className="text-sm mb-1"
                            >
                              <span className="font-medium">
                                {item.dish?.name || "Unknown"}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({item.servings})
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Weekly Nutrition Summary */}
        {nutritionReport && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800">
                Weekly Nutrition Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Average Calories</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatMetric(nutritionReport.weekly_average.calories, {
                      unit: "kcal",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">kcal/day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Protein</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatMetric(nutritionReport.weekly_average.protein, {
                      unit: "g",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">per day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Fat</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatMetric(nutritionReport.weekly_average.fat, {
                      unit: "g",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">per day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Carbs</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatMetric(nutritionReport.weekly_average.carbs, {
                      unit: "g",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">per day</p>
                </div>
              </div>
              {nutritionReport.warnings &&
                nutritionReport.warnings.length > 0 && (
                  <div className="mt-4">
                    <Alert className="bg-yellow-100 border-yellow-300">
                      <AlertDescription>
                        <strong>Warnings:</strong>{" "}
                        {nutritionReport.warnings.join(", ")}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              {nutritionReport.recommendations &&
                nutritionReport.recommendations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-1">
                      Recommendations:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {nutritionReport.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="w-full relative">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)]"></div>
      <div className="relative z-10 max-w-6xl mx-auto p-2 space-y-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">
          Nutrition & Allergy
        </h1>
        {selectedResident && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Resident Summary
              </h2>
              <p className="text-lg">
                <strong>Name:</strong> {selectedResident.full_name}
              </p>
              {residentDiseases.length > 0 && (
                <p className="text-lg">
                  <strong>Conditions:</strong> {residentDiseases.join(", ")}
                </p>
              )}
              {residentAllergies.length > 0 && (
                <div className="mt-2">
                  <strong className="text-lg">Allergies:</strong>
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
                  ⚠️ Alert: Meals containing {residentAllergies.join(", ")} are
                  highlighted.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Weekly Progress
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
            Select Week (Monday)
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
              Select Resident
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

        {weeklyMenu ? (
          <Tabs
            value={selectedDay}
            onValueChange={setSelectedDay}
            className="w-full"
          >
            <div className="w-full flex justify-center mt-4 mb-4">
              <TabsList className="flex space-x-4 bg-white rounded-xl shadow-sm border-none px-4 py-2">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day, index) => (
                  <TabsTrigger
                    key={day}
                    value={day}
                    className="text-lg text-black h-10 px-4 flex items-center justify-center rounded-lg data-[state=active]:bg-[#5895d8] data-[state=active]:text-white transition-all cursor-pointer"
                  >
                    {day}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day, index) => (
              <TabsContent key={day} value={day}>
                <div className="space-y-4">
                  {renderMealSlots(index)}
                  {!weeklyMenu.menuItems?.some(
                    (item) => normalizeDayIndex(item.day_of_week) === index
                  ) && (
                    <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white">
                      No meals scheduled for {day}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white">
            No weekly menu found for this week. Please contact staff to create a
            menu.
          </div>
        )}
        <WeeklyOverview />
      </div>
    </div>
  );
};

export default NutritionAllergyPage;
