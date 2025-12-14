import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
} from "@/components/ui";
import { WeeklyMenuItem } from "@/apis/menu-planner.api";
import { ResidentResponse } from "@/apis/resident.api";
import { DishNutritionData } from "@/hooks/useWeeklyMenuData";
import {
  ConsumptionInfo,
  formatMetric,
  EMPTY_CONSUMPTION,
} from "@/utils/nutrition.utils";

interface DishCardProps {
  menuItem: WeeklyMenuItem;
  dish: any;
  consumptionMap?: Map<string, ConsumptionInfo>;
  dishNutritionMap: Map<string, DishNutritionData>;
  selectedResident?: ResidentResponse | null;
}

export const DishCard: React.FC<DishCardProps> = ({
  menuItem,
  dish,
  consumptionMap,
  dishNutritionMap,
  selectedResident,
}) => {
  if (!dish) return null;

  const consumption = consumptionMap?.get(menuItem.menu_item_id) ?? {
    ...EMPTY_CONSUMPTION,
    // If no map provided, maybe hide status or show "N/A"?
    // For resident view without logs, we might want to hide consumption status if map is undefined
    // But let's keep it consistent with default for now.
  };

  // If consumptionMap is undefined, we probably shouldn't show "Chưa ghi nhận" as if it is missing data,
  // unless we know we SHOULD have data.
  // For resident view, we might not have logs.
  const showConsumption = !!consumptionMap;

  const hasAllergyAlert = (dish: any) => {
    if (!selectedResident || !selectedResident.allergies) return false;
    const residentAllergies = selectedResident.allergies.map((a: any) =>
      a.substance.toLowerCase()
    );
    const dietaryFlags = (dish?.dietary_flags as string[]) || [];
    return dietaryFlags.some((flag) =>
      residentAllergies.includes(flag.toLowerCase())
    );
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
              ⚠️ Món ăn có chứa chất gây dị ứng cho cư dân
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
                Dinh dưỡng (trên {menuItem.servings} khẩu phần):
              </strong>
              <ul className="list-disc list-inside text-sm mt-1">
                <li>Đạm: {formatMetric(nutrition.protein, { unit: "g" })}</li>
                <li>Chất béo: {formatMetric(nutrition.fat, { unit: "g" })}</li>
                <li>
                  Tinh bột: {formatMetric(nutrition.carbs, { unit: "g" })}
                </li>
                {nutrition.fiber !== undefined && (
                  <li>
                    Chất xơ: {formatMetric(nutrition.fiber, { unit: "g" })}
                  </li>
                )}
                {nutrition.sodium !== undefined && (
                  <li>
                    Natri: {formatMetric(nutrition.sodium, { unit: "mg" })}
                  </li>
                )}
              </ul>
            </div>
          </>
        ) : nutritionData?.loading ? (
          <p className="text-sm text-gray-500">
            Đang tải dữ liệu dinh dưỡng...
          </p>
        ) : (
          <p className="text-sm text-gray-500">Chưa có dữ liệu dinh dưỡng</p>
        )}
        <div className="mb-4">
          <Badge variant="outline" className="text-sm mr-2">
            Độ thô: {dish.texture || menuItem.texture_variant || "Thường"}
          </Badge>
          {menuItem.texture_variant && (
            <Badge variant="secondary" className="text-sm mr-2">
              Biến thể: {menuItem.texture_variant}
            </Badge>
          )}
          {dietaryFlags.map((flag) => (
            <Badge key={flag} variant="outline" className="text-sm mr-2">
              {flag}
            </Badge>
          ))}
        </div>

        {showConsumption && (
          <>
            <p className="text-lg font-semibold mt-2">
              Tình trạng: {consumption.label}
            </p>
            {consumption.log?.notes && (
              <p className="text-sm text-gray-600 mt-1">
                Ghi chú: {consumption.log.notes}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
