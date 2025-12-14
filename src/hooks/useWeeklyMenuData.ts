import { useState, useEffect } from "react";
import {
  getWeeklyMenuByWeekForFamily,
  calculateDishNutrition,
  validateMenuNutritionForFamily,
  type WeeklyMenu,
  type NutritionSummary,
  type WeeklyMenuNutritionReport,
} from "@/apis/menu-planner.api";
import { extractApiData } from "@/utils/nutrition.utils";

export interface DishNutritionData {
  dish_id: string;
  nutrition: NutritionSummary | null;
  loading: boolean;
}

export function useWeeklyMenuData(weekStart: string) {
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [nutritionReport, setNutritionReport] =
    useState<WeeklyMenuNutritionReport | null>(null);
  const [dishNutritionMap, setDishNutritionMap] = useState<
    Map<string, DishNutritionData>
  >(new Map());
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const loadNutritionReport = async () => {
    try {
      // Use family endpoint that takes week_start_date
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
    const loadWeeklyMenuData = async () => {
      setLoadingMenu(true);
      setError(null);
      try {
        const menuRes = await getWeeklyMenuByWeekForFamily(weekStart);
        const weeklyMenuPayload =
          extractApiData<WeeklyMenu>(menuRes.data) || null;
        if (weeklyMenuPayload) {
          setWeeklyMenu(weeklyMenuPayload);
          await loadDishNutrition(weeklyMenuPayload);
          await loadNutritionReport();
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
        setError("Không thể tải thực đơn. Vui lòng thử lại sau.");
      } finally {
        setLoadingMenu(false);
      }
    };

    loadWeeklyMenuData();
  }, [weekStart]);

  return {
    weeklyMenu,
    nutritionReport,
    dishNutritionMap,
    loadingNutrition,
    loadingMenu,
    error,
  };
}
