import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from "@/components/ui";
import {
  WeeklyMenu,
  WeeklyMenuNutritionReport,
  MealSlot,
} from "@/apis/menu-planner.api";
import { normalizeDayIndex, formatMetric } from "@/utils/nutrition.utils";

interface WeeklyOverviewProps {
  weeklyMenu: WeeklyMenu | null;
  nutritionReport: WeeklyMenuNutritionReport | null;
}

export const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  weeklyMenu,
  nutritionReport,
}) => {
  if (!weeklyMenu || !weeklyMenu.menuItems) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          Tổng quan tuần
        </h2>
        <p className="text-gray-500">Chưa có dữ liệu thực đơn cho tuần này.</p>
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
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Tổng quan tuần</h2>
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
                <CardTitle className="text-lg">
                  {
                    {
                      Monday: "Thứ 2",
                      Tuesday: "Thứ 3",
                      Wednesday: "Thứ 4",
                      Thursday: "Thứ 5",
                      Friday: "Thứ 6",
                      Saturday: "Thứ 7",
                      Sunday: "Chủ nhật",
                    }[dayName]
                  }
                </CardTitle>
                {dayNutrition && (
                  <div className="text-xs text-gray-600 mt-1">
                    <p>
                      Calo:{" "}
                      {formatMetric(dayNutrition.total_calories, {
                        unit: "kcal",
                      })}
                    </p>
                    <p>
                      Đạm:{" "}
                      {formatMetric(dayNutrition.total_protein, {
                        unit: "g",
                      })}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {dayItems.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có bữa ăn nào</p>
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
                          {
                            {
                              Breakfast: "Bữa sáng",
                              Lunch: "Bữa trưa",
                              Afternoon: "Bữa xế",
                              Dinner: "Bữa tối",
                            }[slot]
                          }
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
                          <div key={item.menu_item_id} className="text-sm mb-1">
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
              Tổng hợp dinh dưỡng tuần
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Calo trung bình</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatMetric(nutritionReport.weekly_average.calories, {
                    unit: "kcal",
                  })}
                </p>
                <p className="text-xs text-gray-500">kcal/ngày</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Đạm trung bình</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatMetric(nutritionReport.weekly_average.protein, {
                    unit: "g",
                  })}
                </p>
                <p className="text-xs text-gray-500">mỗi ngày</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chất béo trung bình</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatMetric(nutritionReport.weekly_average.fat, {
                    unit: "g",
                  })}
                </p>
                <p className="text-xs text-gray-500">mỗi ngày</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tinh bột trung bình</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatMetric(nutritionReport.weekly_average.carbs, {
                    unit: "g",
                  })}
                </p>
                <p className="text-xs text-gray-500">mỗi ngày</p>
              </div>
            </div>
            {nutritionReport.warnings &&
              nutritionReport.warnings.length > 0 && (
                <div className="mt-4">
                  <Alert className="bg-yellow-100 border-yellow-300">
                    <AlertDescription>
                      <strong>Cảnh báo:</strong>{" "}
                      {nutritionReport.warnings.join(", ")}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            {nutritionReport.recommendations &&
              nutritionReport.recommendations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-1">Khuyến nghị:</p>
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
