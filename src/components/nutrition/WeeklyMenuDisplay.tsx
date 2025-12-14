import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  WeeklyMenu,
  WeeklyMenuNutritionReport,
  MealSlot,
} from "@/apis/menu-planner.api";
import { ResidentResponse } from "@/apis/resident.api";
import { DishNutritionData } from "@/hooks/useWeeklyMenuData";
import { ConsumptionInfo, normalizeDayIndex } from "@/utils/nutrition.utils";
import { DishCard } from "./DishCard";
import { WeeklyOverview } from "./WeeklyOverview";

interface WeeklyMenuDisplayProps {
  weeklyMenu: WeeklyMenu | null;
  nutritionReport: WeeklyMenuNutritionReport | null;
  dishNutritionMap: Map<string, DishNutritionData>;
  consumptionMap?: Map<string, ConsumptionInfo>;
  selectedResident?: ResidentResponse | null;
}

export const WeeklyMenuDisplay: React.FC<WeeklyMenuDisplayProps> = ({
  weeklyMenu,
  nutritionReport,
  dishNutritionMap,
  consumptionMap,
  selectedResident,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

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

          const slotNameMap: Record<string, string> = {
            Breakfast: "Bữa sáng",
            Lunch: "Bữa trưa",
            Afternoon: "Bữa xế",
            Dinner: "Bữa tối",
          };

          return (
            <div key={slot} className="space-y-2">
              <h4 className="font-semibold text-lg mb-2">
                {slotNameMap[slot] || slot}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slotItems.map((item) => (
                  <DishCard
                    key={item.menu_item_id}
                    menuItem={item}
                    dish={item.dish}
                    consumptionMap={consumptionMap}
                    dishNutritionMap={dishNutritionMap}
                    selectedResident={selectedResident}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!weeklyMenu) {
    return (
      <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white">
        Không tìm thấy thực đơn cho tuần này.
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs
        value={selectedDay}
        onValueChange={setSelectedDay}
        className="w-full"
      >
        <div className="w-full flex justify-center mt-4 mb-4">
          <TabsList className="flex space-x-4 bg-white rounded-xl shadow-sm border-none px-4 py-2 flex-wrap h-auto justify-center">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className="text-lg text-black h-10 px-4 flex items-center justify-center rounded-lg data-[state=active]:bg-[#5895d8] data-[state=active]:text-white transition-all cursor-pointer m-1"
              >
                {
                  {
                    Monday: "Thứ 2",
                    Tuesday: "Thứ 3",
                    Wednesday: "Thứ 4",
                    Thursday: "Thứ 5",
                    Friday: "Thứ 6",
                    Saturday: "Thứ 7",
                    Sunday: "Chủ nhật",
                  }[day]
                }
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
                  Chưa có bữa ăn nào vào{" "}
                  {
                    {
                      Monday: "Thứ 2",
                      Tuesday: "Thứ 3",
                      Wednesday: "Thứ 4",
                      Thursday: "Thứ 5",
                      Friday: "Thứ 6",
                      Saturday: "Thứ 7",
                      Sunday: "Chủ nhật",
                    }[day]
                  }
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <WeeklyOverview
        weeklyMenu={weeklyMenu}
        nutritionReport={nutritionReport}
      />
    </div>
  );
};
