import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Alert, AlertDescription } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  getDishes,
  getWeeklyMenuByWeek,
  createWeeklyMenu,
  copyWeekMenu,
  getWeeklyMenus,
  deleteWeeklyMenu,
  exportMenuAsPDF,
  exportMenuAsExcel,
  getServingsSummary,
  calculateServingsForDish,
  calculateDishNutrition,
  getDishById,
  getDishAllergyWarnings,
  getDishSuggestionsByTags,
  getDetailedServingsBreakdown,
  getMenuServingsBreakdown,
  type DetailedServingsBreakdown,
  type MenuServingsBreakdown,
  type Dish,
  type MealSlot,
  type WeeklyMenu,
  type WeeklyMenuNutritionReport,
  type ServingsSummary,
  type DishIngredient,
  type NutritionSummary,
  type DishAllergyWarning,
} from "@/apis/menu-planner.api";
import { toast } from "react-toastify";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { Check, AlertTriangle } from "lucide-react";

export interface Condition {
  id: string;
  name: string;
}

export interface DietGroup {
  id: string;
  name: string;
  recommendedConditions: Condition[];
}

export const conditionMap: Record<string, string> = {
  "Đái tháo đường": "Diabetes",
  "Tăng huyết áp": "Hypertension",
  "Huyết áp cao": "Hypertension",
  "Khó nuốt": "Dysphagia",
  "Rối loạn nuốt": "Dysphagia",
};

export const mockConditions: Condition[] = [
  { id: "1", name: "Diabetes" },
  { id: "2", name: "Hypertension" },
  { id: "3", name: "Dysphagia" },
];

export const mockDietGroups: DietGroup[] = [
  { id: "1", name: "Low Sugar", recommendedConditions: [mockConditions[0]] },
  { id: "2", name: "Low Salt", recommendedConditions: [mockConditions[1]] },
  { id: "5", name: "Soft", recommendedConditions: [mockConditions[2]] },
  { id: "3", name: "Low Carb", recommendedConditions: [] },
  { id: "4", name: "High Protein", recommendedConditions: [] },
];

export function resolveItem<T extends { id: string; name: string }>(
  rawName: string,
  list: T[]
): T {
  const match = list.find(
    (i) => i.name.toLowerCase() === rawName.toLowerCase()
  );
  if (match) return match;
  const newItem = { id: crypto.randomUUID(), name: rawName } as T;
  list.push(newItem);
  return newItem;
}

export function mapConditions(comorbidities: string[] | string): Condition[] {
  const list = Array.isArray(comorbidities)
    ? comorbidities
    : comorbidities.split(",").map((v) => v.trim());

  return list.map((c) => {
    const english = conditionMap[c] || c;
    return resolveItem(english, mockConditions);
  });
}

export function detectDietGroup(conditions: Condition[]): string | undefined {
  if (conditions.some((c) => c.name === "Diabetes")) return "1";
  if (conditions.some((c) => c.name === "Hypertension")) return "2";
  if (conditions.some((c) => c.name === "Dysphagia")) return "5";
  return undefined;
}

export interface Resident {
  id: string;
  name: string;
  avatar?: string;
  room: string;
  bed?: string;
  conditions: typeof mockConditions;
  allergies: Array<{ id: string; substance: string }>;
  dietGroupId?: string;
  dietTags?: Array<{ tag_type: string; tag_name: string }>;
}

function convertResidents(rawResidents: ResidentResponse[]): Resident[] {
  return rawResidents.map((r) => {
    const conditions = mapConditions(
      r.chronicDiseases?.map((d) => d.name) || []
    );
    const allergies = (r.allergies || []).map((a) => ({
      id: a.id,
      substance: a.substance,
    }));
    const roomNumber = r.room?.room_number || "N/A";

    return {
      id: r.resident_id,
      name: r.full_name,
      avatar: undefined,
      room: roomNumber,
      bed: undefined,
      conditions,
      allergies,
      dietGroupId: detectDietGroup(conditions),
      dietTags: [], // TODO: Backend missing dietTags in resident response, ask BE to include
    };
  });
}

// --- CLASS STYLE DÙNG CHUNG ---
// Style for Select Trigger: Light gray, no border, blue border on hover
const SELECT_TRIGGER_STYLE =
  "bg-gray-100 border-none hover:border hover:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all";
// Style for Card: White background, small shadow, no black border
const CARD_STYLE = "bg-white border-none shadow-sm";

// --- COMPONENT RESIDENT DETAIL DIALOG ---
const ResidentDetailDialog = ({
  group,
  residents,
  onAssign,
  onClose,
  className,
}: any) => {
  const [search, setSearch] = useState("");

  const filtered = residents.filter(
    (r: Resident) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.includes(search)
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* Add bg-white to DialogContent */}
      <DialogContent className={`bg-white ${className}`}>
        <DialogHeader>
          <DialogTitle>Cư dân trong {group.name}</DialogTitle>
        </DialogHeader>

        <Input
          className="bg-gray-50 border-gray-200 focus:border-blue-400"
          placeholder="Tìm kiếm cư dân"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filtered.map((r: Resident) => (
            <div
              key={r.id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-medium">
                  {r.name}{" "}
                  <span className="text-gray-500 font-normal">
                    (Phòng {r.room})
                  </span>
                </p>
                <div className="flex gap-1 mt-1">
                  {r.conditions.map((c) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700"
                    >
                      {c.name}
                    </Badge>
                  ))}
                  {r.allergies.map((a) => (
                    <Badge key={a.id} variant="destructive">
                      {a.substance}
                    </Badge>
                  ))}
                </div>
              </div>

              <Select onValueChange={(val) => onAssign(r.id, val)}>
                <SelectTrigger className={`w-40 ${SELECT_TRIGGER_STYLE}`}>
                  <SelectValue placeholder="Đổi nhóm" />
                </SelectTrigger>
                {/* Add bg-white to SelectContent */}
                <SelectContent className="bg-white">
                  {mockDietGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- HELPER FUNCTIONS FOR ALLERGY & NUTRITION CHECKS ---
const checkDishAllergy = (
  dish: Dish,
  residentAllergies: Array<{ substance: string }>
): boolean => {
  if (!dish.dietary_flags || !Array.isArray(dish.dietary_flags)) return false;
  const dietaryFlags = dish.dietary_flags as string[];
  return residentAllergies.some((allergy) =>
    dietaryFlags.some((flag) =>
      flag.toLowerCase().includes(allergy.substance.toLowerCase())
    )
  );
};

const checkLowSaltWarning = (dish: Dish): boolean => {
  // TODO: Backend missing nutritional thresholds for groups, using hardcoded 500mg
  return dish.sodium_level ? dish.sodium_level > 500 : false;
};

const checkLowSugarWarning = (dish: Dish, residents: Resident[]): boolean => {
  const needsLowSugar = residents.some((r) =>
    r.dietTags?.some((t) => t.tag_type === "LowSugar")
  );
  if (!needsLowSugar) return false;
  // TODO: Backend missing dish.nutrition.sugar field, using sugar_adjustable as proxy
  return (
    !dish.sugar_adjustable &&
    !(dish.dietary_flags as string[])?.includes("diabetic")
  );
};

const DishDetailDialog = ({
  dish,
  nutrition,
  residents,
  allergyWarnings,
  detailedBreakdown,
  onClose,
  onSelect,
  isSelected,
}: {
  dish: Dish;
  nutrition: NutritionSummary | null;
  residents: Resident[];
  allergyWarnings: DishAllergyWarning | null;
  detailedBreakdown: DetailedServingsBreakdown | null;
  onClose: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) => {
  const ingredients = dish.dishIngredients || [];
  const dietaryFlags = (dish.dietary_flags as string[]) || [];

  // Use backend API data if available, otherwise fallback to FE calculation
  const affectedResidents =
    allergyWarnings?.affected_residents ||
    residents
      .filter((r) => checkDishAllergy(dish, r.allergies))
      .map((r) => ({
        resident_id: r.id,
        resident_name: r.name,
        allergen_substance: "Unknown",
      }));

  const hasLowSaltWarning = checkLowSaltWarning(dish);
  const hasLowSugarWarning = checkLowSugarWarning(dish, residents);

  // Special portions from backend API
  const specialPortions = allergyWarnings?.special_portions_needed;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{dish.name}</span>
            {isSelected && (
              <Badge className="bg-green-500 text-white">
                <Check className="w-3 h-3 mr-1" />
                Đã chọn
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nutrition Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              Thông tin dinh dưỡng
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {nutrition ? (
                <>
                  <div>
                    <span className="text-gray-600">Calo:</span>
                    <span className="ml-2 font-semibold">
                      {nutrition.calories} kcal
                    </span>
                  </div>
                  {nutrition.sodium !== undefined && (
                    <div>
                      <span className="text-gray-600">Natri:</span>
                      <span className="ml-2 font-semibold">
                        {nutrition.sodium} mg
                      </span>
                    </div>
                  )}
                  {nutrition.protein !== undefined && (
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="ml-2 font-semibold">
                        {nutrition.protein}g
                      </span>
                    </div>
                  )}
                  {nutrition.fat !== undefined && (
                    <div>
                      <span className="text-gray-600">Chất béo:</span>
                      <span className="ml-2 font-semibold">
                        {nutrition.fat}g
                      </span>
                    </div>
                  )}
                  {nutrition.carbs !== undefined && (
                    <div>
                      <span className="text-gray-600">Carb:</span>
                      <span className="ml-2 font-semibold">
                        {nutrition.carbs}g
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span className="text-gray-600">Calo (mỗi 100g):</span>
                    <span className="ml-2 font-semibold">
                      {dish.calories_per_100g} kcal
                    </span>
                  </div>
                  {dish.sodium_level !== undefined && (
                    <div>
                      <span className="text-gray-600">Natri (mỗi 100g):</span>
                      <span className="ml-2 font-semibold">
                        {dish.sodium_level} mg
                      </span>
                    </div>
                  )}
                  {/* TODO: Backend missing dish.nutrition.macros, ask BE before implementing */}
                </>
              )}
            </div>
          </div>

          {/* Ingredients List */}
          {ingredients.length > 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Nguyên liệu</h3>
              <ul className="space-y-1">
                {ingredients.map((di: DishIngredient) => (
                  <li key={di.dish_ingredient_id} className="text-sm">
                    <span className="font-medium">
                      {di.ingredient?.name || "Không xác định"}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {di.amount} {di.ingredient?.unit || "g"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 italic">
                Không có nguyên liệu
              </p>
            </div>
          )}

          {/* Allergy Warnings - Using Backend API Data */}
          {allergyWarnings && allergyWarnings.total_affected > 0 && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong className="text-amber-800">
                      📋 Báo cáo dị ứng
                    </strong>
                    <p className="text-sm text-amber-700 mt-1">
                      Món này chứa chất gây dị ứng ảnh hưởng đến{" "}
                      <strong>{allergyWarnings.total_affected}</strong> cư dân.
                    </p>
                  </div>

                  {/* Explanation of handling */}
                  <div className="bg-white rounded-lg p-3 border border-amber-200 mt-2">
                    <p className="text-xs font-semibold text-amber-800 mb-1">
                      💡 Cách xử lý:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>
                          <strong>Món chính</strong> vẫn được giữ cho{" "}
                          {detailedBreakdown
                            ? detailedBreakdown.regular_servings
                            : "những"}{" "}
                          cư dân <strong>không bị dị ứng</strong>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>
                          Chỉ{" "}
                          <strong>
                            {specialPortions?.allergy_safe || 0} cư dân bị dị
                            ứng
                          </strong>{" "}
                          sẽ nhận <strong>phần đặc biệt</strong> (loại bỏ nguyên
                          liệu gây dị ứng)
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Affected residents list */}
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-amber-800 mb-1">
                      Danh sách cư dân bị ảnh hưởng:
                    </p>
                    <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
                      {allergyWarnings.affected_residents
                        .slice(0, 5)
                        .map((r) => (
                          <li key={r.resident_id}>
                            {r.resident_name} - Dị ứng với:{" "}
                            <strong>{r.allergen_substance}</strong>
                          </li>
                        ))}
                      {allergyWarnings.affected_residents.length > 5 && (
                        <li className="text-amber-600">
                          ...và {allergyWarnings.affected_residents.length - 5}{" "}
                          cư dân khác
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Suggested alternatives (optional) */}
                  {allergyWarnings.suggested_alternatives &&
                    allergyWarnings.suggested_alternatives.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-800 mb-1">
                          💡 Gợi ý món thay thế (tùy chọn):
                        </p>
                        <p className="text-xs text-blue-700 mb-1">
                          Nếu muốn thay đổi món hoàn toàn, có thể tham khảo các
                          món sau:
                        </p>
                        <ul className="list-disc list-inside text-xs text-blue-700">
                          {allergyWarnings.suggested_alternatives.map((alt) => (
                            <li key={alt.dish_id}>{alt.dish_name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Summary */}
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs text-amber-700">
                      <strong>Tóm tắt:</strong>{" "}
                      {detailedBreakdown
                        ? `${detailedBreakdown.regular_servings} phần thường`
                        : "Phần thường"}{" "}
                      + {specialPortions?.allergy_safe || 0} phần đặc biệt
                      (không có chất dị ứng)
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Servings Breakdown - Professional Display */}
          {detailedBreakdown && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Phân tích số phần
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Tổng phần
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {detailedBreakdown.total_servings}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Thường
                    </div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      {detailedBreakdown.regular_servings}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Đặc biệt
                    </div>
                    <div className="text-2xl font-bold text-orange-700 mt-1">
                      {detailedBreakdown.total_servings -
                        detailedBreakdown.regular_servings}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Biến thể kết cấu
                    </div>
                    <div className="text-lg font-semibold text-purple-700 mt-1">
                      Xay:{" "}
                      {detailedBreakdown.special_servings.soft_texture.minced} |
                      Nghiền:{" "}
                      {detailedBreakdown.special_servings.soft_texture.pureed}
                    </div>
                  </div>
                </div>

                {/* Special Servings Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {/* Allergy-Safe Servings */}
                  {detailedBreakdown.special_servings.allergy_safe.count >
                    0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-red-900">
                          ⚠️ Phần dành cho người dị ứng
                        </span>
                        <span className="text-xl font-bold text-red-700">
                          {
                            detailedBreakdown.special_servings.allergy_safe
                              .count
                          }
                        </span>
                      </div>
                      {detailedBreakdown.special_servings.allergy_safe
                        .excluded_ingredients.length > 0 && (
                        <div className="text-xs text-red-700 mt-2">
                          <strong>Loại trừ:</strong>{" "}
                          {detailedBreakdown.special_servings.allergy_safe.excluded_ingredients
                            .map((ing) => ing.ingredient_name)
                            .join(", ")}
                        </div>
                      )}
                      {detailedBreakdown.special_servings.allergy_safe
                        .affected_residents.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          <strong>Ảnh hưởng:</strong>{" "}
                          {detailedBreakdown.special_servings.allergy_safe.affected_residents
                            .slice(0, 3)
                            .map((r) => r.resident_name)
                            .join(", ")}
                          {detailedBreakdown.special_servings.allergy_safe
                            .affected_residents.length > 3 &&
                            ` +${
                              detailedBreakdown.special_servings.allergy_safe
                                .affected_residents.length - 3
                            } người khác`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Low Sugar Servings */}
                  {detailedBreakdown.special_servings.low_sugar.count > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-yellow-900">
                          🍯 Phần ít đường
                        </span>
                        <span className="text-xl font-bold text-yellow-700">
                          {detailedBreakdown.special_servings.low_sugar.count}
                        </span>
                      </div>
                      {detailedBreakdown.special_servings.low_sugar
                        .sugar_reduction_percentage && (
                        <div className="text-xs text-yellow-700 mt-2">
                          <strong>Giảm:</strong>{" "}
                          {
                            detailedBreakdown.special_servings.low_sugar
                              .sugar_reduction_percentage
                          }
                          %
                        </div>
                      )}
                    </div>
                  )}

                  {/* Low Sodium Servings */}
                  {detailedBreakdown.special_servings.low_sodium.count > 0 && (
                    <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-cyan-900">
                          🧂 Phần ít muối
                        </span>
                        <span className="text-xl font-bold text-cyan-700">
                          {detailedBreakdown.special_servings.low_sodium.count}
                        </span>
                      </div>
                      {detailedBreakdown.special_servings.low_sodium
                        .sodium_reduction_percentage && (
                        <div className="text-xs text-cyan-700 mt-2">
                          <strong>Giảm:</strong>{" "}
                          {
                            detailedBreakdown.special_servings.low_sodium
                              .sodium_reduction_percentage
                          }
                          %
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Nutrition Breakdown by Type */}
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Phân tích dinh dưỡng (mỗi phần)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Thường</div>
                      <div className="font-semibold text-gray-800">
                        {detailedBreakdown.nutrition_breakdown.regular.calories.toFixed(
                          0
                        )}{" "}
                        cal
                      </div>
                    </div>
                    {detailedBreakdown.special_servings.allergy_safe.count >
                      0 && (
                      <div>
                        <div className="text-gray-500">Phần không dị ứng</div>
                        <div className="font-semibold text-red-700">
                          {detailedBreakdown.nutrition_breakdown.allergy_safe.calories.toFixed(
                            0
                          )}{" "}
                          cal
                        </div>
                      </div>
                    )}
                    {detailedBreakdown.special_servings.low_sugar.count > 0 && (
                      <div>
                        <div className="text-gray-500">Ít đường</div>
                        <div className="font-semibold text-yellow-700">
                          {detailedBreakdown.nutrition_breakdown.low_sugar.calories.toFixed(
                            0
                          )}{" "}
                          cal
                        </div>
                      </div>
                    )}
                    {detailedBreakdown.special_servings.low_sodium.count >
                      0 && (
                      <div>
                        <div className="text-gray-500">Ít muối</div>
                        <div className="font-semibold text-cyan-700">
                          {detailedBreakdown.nutrition_breakdown.low_sodium.calories.toFixed(
                            0
                          )}{" "}
                          cal
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ingredients Breakdown */}
                {detailedBreakdown.ingredients_breakdown.regular.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Nguyên liệu cần thiết (Phần thường)
                    </h4>
                    <div className="space-y-1 text-sm">
                      {detailedBreakdown.ingredients_breakdown.regular.map(
                        (ing) => (
                          <div
                            key={ing.ingredient_id}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-700">
                              {ing.ingredient_name}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {ing.total_amount.toFixed(1)} {ing.unit}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Special Modifications */}
                {detailedBreakdown.ingredients_breakdown.special_modifications
                  .length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      Điều chỉnh đặc biệt cần thiết
                    </h4>
                    {detailedBreakdown.ingredients_breakdown.special_modifications.map(
                      (mod, idx) => (
                        <div key={idx} className="mb-3 last:mb-0">
                          <div className="font-semibold text-orange-800 mb-1">
                            {mod.modification_type === "allergy_safe"
                              ? "⚠️ Loại bỏ chất dị ứng"
                              : mod.modification_type === "low_sugar"
                              ? "🍯 Ít đường"
                              : "🧂 Ít muối"}
                          </div>
                          {mod.excluded_ingredients.length > 0 && (
                            <div className="text-xs text-orange-700">
                              <strong>Loại trừ:</strong>{" "}
                              {mod.excluded_ingredients
                                .map((ing) => ing.ingredient_name)
                                .join(", ")}
                            </div>
                          )}
                          {mod.adjusted_ingredients.length > 0 && (
                            <div className="text-xs text-orange-700 mt-1">
                              <strong>Điều chỉnh:</strong>{" "}
                              {mod.adjusted_ingredients
                                .slice(0, 3)
                                .map(
                                  (ing) =>
                                    `${
                                      ing.ingredient_name
                                    } (${ing.original_amount.toFixed(
                                      1
                                    )} → ${ing.adjusted_amount.toFixed(1)} ${
                                      ing.unit
                                    })`
                                )
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Portions Summary (Fallback if detailed breakdown not available) */}
          {!detailedBreakdown && specialPortions && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">
                Phần đặc biệt cần thiết
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {specialPortions.allergy_safe > 0 && (
                  <div>
                    <span className="text-gray-600">Phần không dị ứng:</span>
                    <span className="ml-2 font-semibold">
                      {specialPortions.allergy_safe}
                    </span>
                  </div>
                )}
                {specialPortions.low_sugar > 0 && (
                  <div>
                    <span className="text-gray-600">Ít đường:</span>
                    <span className="ml-2 font-semibold">
                      {specialPortions.low_sugar}
                    </span>
                  </div>
                )}
                {specialPortions.low_sodium > 0 && (
                  <div>
                    <span className="text-gray-600">Ít muối:</span>
                    <span className="ml-2 font-semibold">
                      {specialPortions.low_sodium}
                    </span>
                  </div>
                )}
                {specialPortions.soft_texture > 0 && (
                  <div>
                    <span className="text-gray-600">Kết cấu mềm:</span>
                    <span className="ml-2 font-semibold">
                      {specialPortions.soft_texture}
                    </span>
                  </div>
                )}
                {specialPortions.pureed > 0 && (
                  <div>
                    <span className="text-gray-600">Nghiền:</span>
                    <span className="ml-2 font-semibold">
                      {specialPortions.pureed}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Low Salt Warning */}
          {hasLowSaltWarning && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <strong className="text-yellow-700">Cảnh báo muối thấp</strong>
                <p className="text-sm text-yellow-600 mt-1">
                  Món này vượt quá mức natri khuyến nghị (500mg/100g) cho nhóm
                  ăn kiêng muối thấp.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Low Sugar Warning */}
          {hasLowSugarWarning && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <strong className="text-yellow-700">Cảnh báo đường thấp</strong>
                <p className="text-sm text-yellow-600 mt-1">
                  Món này có thể không phù hợp với nhóm ăn kiêng đường thấp.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Dietary Flags */}
          {dietaryFlags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dietaryFlags.map((flag, idx) => (
                <Badge key={idx} variant="secondary" className="bg-gray-100">
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button onClick={onSelect} disabled={isSelected}>
              {isSelected ? "Đã chọn" : "Chọn món"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT SUMMARY SCREEN ---
const SummaryScreen = ({
  menuItems,
  dishes,
  servingsSummary,
  nutritionReport,
  onClose,
  onBack,
}: {
  menuItems: Record<
    string,
    Record<MealSlot, { dish_id: string; servings: number } | null>
  >;
  dishes: Dish[];
  servingsSummary: ServingsSummary | null;
  nutritionReport: WeeklyMenuNutritionReport | null;
  onClose: () => void;
  onBack: () => void;
}) => {
  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const slots: MealSlot[] = ["Breakfast", "Lunch", "Afternoon", "Dinner"];

  // Aggregate ingredients
  const ingredientMap = new Map<
    string,
    { name: string; totalAmount: number; unit: string }
  >();

  Object.values(menuItems).forEach((dayItems) => {
    Object.entries(dayItems).forEach(([slot, item]) => {
      if (!item) return;
      const dish = dishes.find((d) => d.dish_id === item.dish_id);
      if (!dish || !dish.dishIngredients) return;

      dish.dishIngredients.forEach((di) => {
        const key = di.ingredient_id;
        const existing = ingredientMap.get(key);
        const amount = di.amount * item.servings || 0;
        if (existing) {
          existing.totalAmount += amount;
        } else {
          ingredientMap.set(key, {
            name: di.ingredient?.name || "Unknown",
            totalAmount: amount,
            unit: di.ingredient?.unit || "g",
          });
        }
      });
    });
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tóm tắt thực đơn tuần</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Dishes */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Các món đã chọn</h3>
            <div className="space-y-4">
              {days.map((day, dayIndex) => (
                <div
                  key={day}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <h4 className="font-medium mb-2">{day}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const item = menuItems[dayIndex]?.[slot];
                      const dish = item
                        ? dishes.find((d) => d.dish_id === item.dish_id)
                        : null;
                      return (
                        <div
                          key={slot}
                          className="p-2 bg-gray-50 rounded border border-gray-100"
                        >
                          <div className="text-xs font-medium text-gray-600">
                            {slot === "Breakfast"
                              ? "Sáng"
                              : slot === "Lunch"
                              ? "Trưa"
                              : slot === "Afternoon"
                              ? "Chiều"
                              : "Tối"}
                          </div>
                          {dish && item ? (
                            <>
                              <div className="text-sm font-semibold mt-1">
                                {dish.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {item.servings} phần
                              </div>
                              {dish.calories_per_100g && (
                                <div className="text-xs text-gray-400 mt-1">
                                  ~
                                  {Math.round(
                                    dish.calories_per_100g * item.servings
                                  )}{" "}
                                  kcal
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-gray-400 mt-1">
                              Không có
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portion Counts */}
          {servingsSummary && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">
                Số lượng phần
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Tổng cư dân:</span>
                  <span className="ml-2 font-semibold">
                    {servingsSummary.total_residents}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Tổng phần:</span>
                  <span className="ml-2 font-semibold">
                    {servingsSummary.total_servings}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Thường:</span>
                  <span className="ml-2 font-semibold">
                    {servingsSummary.breakdown_by_texture.Regular}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Xay nhỏ:</span>
                  <span className="ml-2 font-semibold">
                    {servingsSummary.breakdown_by_texture.Minced}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Nghiền:</span>
                  <span className="ml-2 font-semibold">
                    {servingsSummary.breakdown_by_texture.Pureed}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nutrition Breakdown */}
          {nutritionReport && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">
                Trung bình dinh dưỡng tuần
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Calo:</span>
                  <span className="ml-2 font-semibold">
                    {nutritionReport.weekly_average.calories} kcal
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <span className="ml-2 font-semibold">
                    {nutritionReport.weekly_average.protein}g
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Chất béo:</span>
                  <span className="ml-2 font-semibold">
                    {nutritionReport.weekly_average.fat}g
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Carb:</span>
                  <span className="ml-2 font-semibold">
                    {nutritionReport.weekly_average.carbs}g
                  </span>
                </div>
                {nutritionReport.weekly_average.sodium && (
                  <div>
                    <span className="text-gray-600">Natri:</span>
                    <span className="ml-2 font-semibold">
                      {nutritionReport.weekly_average.sodium} mg
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aggregated Ingredients */}
          {ingredientMap.size > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">
                Tổng nguyên liệu cần thiết
              </h3>
              <div className="space-y-1">
                {Array.from(ingredientMap.values()).map((ing, idx) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span className="font-medium">{ing.name}</span>
                    <span className="text-gray-600">
                      {Math.round(ing.totalAmount * 10) / 10} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onBack}>
              Quay lại chỉnh sửa
            </Button>
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- MAIN PAGE ---
const NutritionPage: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [assignGroup, setAssignGroup] = useState<any>(null);

  // Weekly Menu State
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [nutritionReport, setNutritionReport] =
    useState<WeeklyMenuNutritionReport | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return monday.toISOString().split("T")[0];
  });
  const [menuItems, setMenuItems] = useState<
    Record<
      string,
      Record<
        MealSlot,
        { dish_id: string; servings: number; override?: boolean } | null
      >
    >
  >({});
  const [showCopyWeekDialog, setShowCopyWeekDialog] = useState(false);
  const [servingsSummary, setServingsSummary] =
    useState<ServingsSummary | null>(null);
  const [loadingServings, setLoadingServings] = useState(false);

  // Dish detail dialog state
  const [selectedDishDetail, setSelectedDishDetail] = useState<{
    dish: Dish;
    dayIndex: number;
    slot: MealSlot;
  } | null>(null);
  const [dishNutrition, setDishNutrition] = useState<NutritionSummary | null>(
    null
  );
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dishAllergyWarnings, setDishAllergyWarnings] =
    useState<DishAllergyWarning | null>(null);
  const [detailedServingsBreakdown, setDetailedServingsBreakdown] =
    useState<DetailedServingsBreakdown | null>(null);
  const [menuServingsBreakdown, setMenuServingsBreakdown] =
    useState<MenuServingsBreakdown | null>(null);

  // Tabs state: 'create' or 'view'
  const [activeTab, setActiveTab] = useState<"create" | "view">("create");

  // Previous menus for copy
  const [previousMenus, setPreviousMenus] = useState<WeeklyMenu[]>([]);
  const [selectedMenuForCopy, setSelectedMenuForCopy] =
    useState<WeeklyMenu | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(false);

  // Update menu dialog state
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateMenuItems, setUpdateMenuItems] = useState<typeof menuItems>({});

  // Menu list for view tab
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [viewMenu, setViewMenu] = useState<WeeklyMenu | null>(null);

  // Load previous menus for copy
  const loadPreviousMenus = async () => {
    setLoadingMenus(true);
    try {
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      const result = await getWeeklyMenus(50, 0);
      const menus = Array.isArray(result.data?.data) ? result.data.data : [];

      // Filter: only show menus from previous weeks (not current or future)
      const filteredMenus = menus.filter((menu) => {
        const menuWeekStart = new Date(menu.week_start_date);
        return menuWeekStart < currentWeekStart;
      });

      setPreviousMenus(filteredMenus);
    } catch (error) {
      console.error("Error loading previous menus:", error);
      toast.error("Failed to load previous menus");
    } finally {
      setLoadingMenus(false);
    }
  };

  // Fetch residents from API
  useEffect(() => {
    const loadResidents = async () => {
      try {
        const response = await getResidents();
        setResidents(convertResidents(response.residents || []));
      } catch (error) {
        console.error("Error loading residents:", error);
        // Fallback to localStorage if API fails
        const raw = JSON.parse(localStorage.getItem("residents") || "[]");
        setResidents(convertResidents(raw));
      }
    };
    loadResidents();
  }, []);

  // Load dishes, weekly menu, and servings summary
  useEffect(() => {
    const loadData = async () => {
      try {
        const dishesRes = await getDishes();
        // getDishes() returns { message: '...', data: Dish[] }
        const dishesData = Array.isArray(dishesRes?.data) ? dishesRes.data : [];
        setDishes(dishesData);

        // Load servings summary
        try {
          const summaryRes = await getServingsSummary(selectedWeekStart);
          if (summaryRes.data?.data) {
            setServingsSummary(summaryRes.data.data);
          }
        } catch (error) {
          console.error("Error loading servings summary:", error);
        }

        const menuRes = await getWeeklyMenuByWeek(selectedWeekStart);
        // Backend returns: { message: '...', data: WeeklyMenu | null }
        const responseData = menuRes.data as any;
        const menuData = responseData?.data ?? responseData;

        // Load all menus for view tab
        try {
          const allMenusRes = await getWeeklyMenus(100, 0);
          const allMenusData = Array.isArray(allMenusRes.data?.data)
            ? allMenusRes.data.data
            : [];
          setAllMenus(allMenusData);
        } catch (error) {
          console.error("Error loading all menus:", error);
        }

        // Load menu for current week (for view tab)
        if (menuData && menuData.menu_id) {
          setViewMenu(menuData);
          setSelectedMenuId(menuData.menu_id);

          // Load menu servings breakdown
          try {
            const breakdownRes = await getMenuServingsBreakdown(
              menuData.menu_id
            );
            const breakdownData = breakdownRes.data as any;
            setMenuServingsBreakdown(
              breakdownData?.data ?? breakdownData ?? null
            );
          } catch (error) {
            // Silently fail - breakdown is optional
          }
        } else {
          // No menu found for current week
          setViewMenu(null);
          setSelectedMenuId(null);
          setMenuServingsBreakdown(null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Ensure dishes is set to empty array on error
        setDishes([]);
      }
    };
    loadData();
  }, [selectedWeekStart]);

  const assignResident = (id: string, groupId: string) => {
    const updated = residents.map((r) =>
      r.id === id ? { ...r, dietGroupId: groupId } : r
    );

    setResidents(updated);
    localStorage.setItem("residents", JSON.stringify(updated));
  };

  return (
    <div className="w-full relative min-h-screen">
      {/* Beautiful background */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)]"></div>

      <div className="relative z-10 container mx-auto p-4 space-y-6">
        <Dialog open={!!assignGroup} onOpenChange={() => setAssignGroup(null)}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>
                Phân công cư dân vào {assignGroup?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {residents.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center text-black border-b border-gray-100 pb-2"
                >
                  <div>
                    <p className="font-medium">
                      {r.name}{" "}
                      <span className="text-gray-500 text-sm">
                        (Phòng {r.room})
                      </span>
                    </p>

                    <div className="flex gap-1 mt-1">
                      {r.conditions.map((c) => (
                        <Badge key={c.id} variant="outline" className="text-xs">
                          {c.name}
                        </Badge>
                      ))}
                      {r.allergies.map((a) => (
                        <Badge
                          key={a.id}
                          variant="destructive"
                          className="text-xs"
                        >
                          {a.substance}
                        </Badge>
                      ))}
                    </div>

                    {r.allergies.length > 0 && (
                      <p className="text-red-500 text-xs mt-1 italic">
                        * Cư dân có dị ứng.
                      </p>
                    )}
                  </div>

                  <Button
                    className="cursor-pointer active:scale-95 transition-all"
                    size="sm"
                    variant={
                      r.dietGroupId === assignGroup?.id
                        ? "secondary"
                        : "default"
                    }
                    onClick={() => {
                      assignResident(r.id, assignGroup!.id);
                      setAssignGroup(null);
                    }}
                    disabled={r.dietGroupId === assignGroup?.id}
                  >
                    {r.dietGroupId === assignGroup?.id
                      ? "Đã phân công"
                      : "Phân công"}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {selectedGroup && (
          <ResidentDetailDialog
            className="text-black"
            group={selectedGroup}
            residents={residents.filter(
              (r) => r.dietGroupId === selectedGroup.id
            )}
            onAssign={assignResident}
            onClose={() => setSelectedGroup(null)}
          />
        )}

        {/* WEEKLY MENU PLANNER CARD */}
        <Card className={CARD_STYLE}>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-lg font-semibold">
                Lập kế hoạch thực đơn tuần
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Tuần:</label>
                  <Input
                    type="date"
                    value={selectedWeekStart}
                    onChange={(e) => {
                      setSelectedWeekStart(e.target.value);
                      setWeeklyMenu(null);
                      setMenuItems({});
                      setMenuServingsBreakdown(null);
                    }}
                    className="w-40"
                  />
                </div>
              </div>
            </div>

            {/* Tabs for Create/Edit and View */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "create" | "view")}
            >
              <TabsList className="grid w-full grid-cols-2 ">
                <TabsTrigger
                  value="create"
                  className="cursor-pointer data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  data-state={activeTab === "create" ? "active" : ""}
                >
                  Tạo / Chỉnh sửa thực đơn
                </TabsTrigger>
                <TabsTrigger
                  value="view"
                  className="cursor-pointer data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  data-state={activeTab === "view" ? "active" : ""}
                >
                  Xem thực đơn
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    className="cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => {
                      setShowCopyWeekDialog(true);
                      loadPreviousMenus();
                    }}
                  >
                    Sao chép tuần trước
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      if (
                        confirm(
                          "Bạn có chắc chắn muốn xóa tất cả lựa chọn? Tất cả thay đổi sẽ bị mất."
                        )
                      ) {
                        setMenuItems({});
                      }
                    }}
                  >
                    Xóa tất cả
                  </Button>
                  <Button
                    className="cursor-pointer bg-indigo-500 text-white hover:bg-indigo-600"
                    onClick={() => setShowSummary(true)}
                  >
                    Xem tóm tắt
                  </Button>
                  <Button
                    className="cursor-pointer bg-green-500 text-white hover:bg-green-600"
                    onClick={handleSaveWeeklyMenu}
                  >
                    Lưu thực đơn
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="view" className="mt-4">
                <div className="flex gap-2 mb-4 items-center">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium">Xem thực đơn:</label>
                    <Select
                      value={selectedMenuId || ""}
                      onValueChange={async (menuId) => {
                        setSelectedMenuId(menuId);
                        const menu = allMenus.find((m) => m.menu_id === menuId);
                        if (menu) {
                          setViewMenu(menu);
                          // Load menu servings breakdown
                          try {
                            const breakdownRes = await getMenuServingsBreakdown(
                              menuId
                            );
                            const breakdownData = breakdownRes.data as any;
                            setMenuServingsBreakdown(
                              breakdownData?.data ?? breakdownData ?? null
                            );
                          } catch (error) {
                            console.error("Error loading breakdown:", error);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Chọn thực đơn để xem" />
                      </SelectTrigger>
                      <SelectContent>
                        {allMenus.map((menu) => (
                          <SelectItem key={menu.menu_id} value={menu.menu_id}>
                            {new Date(
                              menu.week_start_date
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(menu.week_end_date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {viewMenu && (
                    <>
                      <Button
                        className="cursor-pointer bg-purple-500 text-white hover:bg-purple-600"
                        onClick={async () => {
                          try {
                            await exportMenuAsPDF(viewMenu.menu_id);
                            toast.success("PDF exported successfully");
                          } catch (error: any) {
                            toast.error(
                              error.message || "Failed to export PDF"
                            );
                          }
                        }}
                      >
                        Xuất PDF
                      </Button>
                      <Button
                        className="cursor-pointer bg-orange-500 text-white hover:bg-orange-600"
                        onClick={async () => {
                          try {
                            await exportMenuAsExcel(viewMenu.menu_id);
                            toast.success("Xuất Excel thành công");
                          } catch (error: any) {
                            toast.error(error.message || "Xuất Excel thất bại");
                          }
                        }}
                      >
                        Xuất Excel
                      </Button>
                      <Button
                        className="cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => {
                          // Load menu items into update state
                          const loadedItems: typeof menuItems = {};
                          if (
                            viewMenu.menuItems &&
                            Array.isArray(viewMenu.menuItems)
                          ) {
                            viewMenu.menuItems.forEach((item: any) => {
                              if (!loadedItems[item.day_of_week]) {
                                loadedItems[item.day_of_week] = {
                                  Breakfast: null,
                                  Lunch: null,
                                  Afternoon: null,
                                  Dinner: null,
                                };
                              }
                              const mealSlot = item.meal_slot as MealSlot;
                              loadedItems[item.day_of_week][mealSlot] = {
                                dish_id: item.dish_id,
                                servings: item.servings || 0,
                                override: true,
                              };
                            });
                          }
                          setUpdateMenuItems(loadedItems);
                          setShowUpdateDialog(true);
                        }}
                      >
                        Cập nhật thực đơn
                      </Button>
                      <Button
                        variant="outline"
                        className="cursor-pointer text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (
                            confirm(
                              "Bạn có chắc chắn muốn xóa thực đơn này? Hành động này không thể hoàn tác."
                            )
                          ) {
                            try {
                              await deleteWeeklyMenu(viewMenu.menu_id);
                              toast.success("Xóa thực đơn thành công");
                              setViewMenu(null);
                              setSelectedMenuId(null);
                              setMenuServingsBreakdown(null);
                              // Reload menus
                              const allMenusRes = await getWeeklyMenus(100, 0);
                              const allMenusData = Array.isArray(
                                allMenusRes.data?.data
                              )
                                ? allMenusRes.data.data
                                : [];
                              setAllMenus(allMenusData);
                            } catch (error: any) {
                              toast.error(
                                error.response?.data?.message ||
                                  "Xóa thực đơn thất bại"
                              );
                            }
                          }
                        }}
                      >
                        Xóa thực đơn
                      </Button>
                    </>
                  )}
                </div>
                {!viewMenu ? (
                  <div className="text-center py-10 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg">
                    Chưa chọn thực đơn. Vui lòng chọn thực đơn từ danh sách ở
                    trên.
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 mb-4">
                    Đang xem thực đơn cho:{" "}
                    {new Date(viewMenu.week_start_date).toLocaleDateString(
                      "vi-VN"
                    )}{" "}
                    -{" "}
                    {new Date(viewMenu.week_end_date).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>
            {/* Show content based on active tab */}
            {activeTab === "create" ? (
              <>
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full grid-cols-7 bg-gray-100 rounded-lg p-1">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                      (day, dayIndex) => (
                        <TabsTrigger
                          key={day}
                          value={dayIndex.toString()}
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                        >
                          {day}
                        </TabsTrigger>
                      )
                    )}
                  </TabsList>
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                    (day, dayIndex) => (
                      <TabsContent
                        key={day}
                        value={dayIndex.toString()}
                        className="mt-4"
                      >
                        <Card className="bg-white shadow-sm border rounded-xl p-4">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">
                              {day} -{" "}
                              {new Date(
                                new Date(selectedWeekStart).getTime() +
                                  dayIndex * 24 * 60 * 60 * 1000
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(
                                [
                                  "Breakfast",
                                  "Lunch",
                                  "Afternoon",
                                  "Dinner",
                                ] as MealSlot[]
                              ).map((slot) => (
                                <Card
                                  key={slot}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
                                >
                                  <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 block">
                                      {slot}
                                    </label>
                                    <div className="space-y-2">
                                      <Select
                                        value={
                                          menuItems[dayIndex]?.[slot]
                                            ?.dish_id || "none"
                                        }
                                        onValueChange={async (dishId) => {
                                          if (dishId && dishId !== "none") {
                                            // Check for duplicate in same day
                                            const dayItems =
                                              menuItems[dayIndex] || {};
                                            const isDuplicate = Object.values(
                                              dayItems
                                            ).some(
                                              (item, idx) =>
                                                item &&
                                                item.dish_id === dishId &&
                                                Object.keys(dayItems)[idx] !==
                                                  slot
                                            );

                                            if (isDuplicate) {
                                              toast.warning(
                                                "Món này đã được chọn cho bữa ăn khác trong cùng ngày"
                                              );
                                              return;
                                            }

                                            // Auto-calculate servings
                                            setLoadingServings(true);
                                            try {
                                              const servingsRes =
                                                await calculateServingsForDish(
                                                  dishId,
                                                  slot,
                                                  selectedWeekStart
                                                );
                                              const calculatedServings =
                                                servingsRes.data?.data?.total ||
                                                0;

                                              setMenuItems((prev) => {
                                                const newItems = { ...prev };
                                                if (!newItems[dayIndex]) {
                                                  newItems[dayIndex] = {
                                                    Breakfast: null,
                                                    Lunch: null,
                                                    Afternoon: null,
                                                    Dinner: null,
                                                  };
                                                }
                                                newItems[dayIndex][slot] = {
                                                  dish_id: dishId,
                                                  servings: calculatedServings,
                                                  override: false,
                                                };
                                                return newItems;
                                              });
                                            } catch (error) {
                                              console.error(
                                                "Error calculating servings:",
                                                error
                                              );
                                              // Fallback to default
                                              setMenuItems((prev) => {
                                                const newItems = { ...prev };
                                                if (!newItems[dayIndex]) {
                                                  newItems[dayIndex] = {
                                                    Breakfast: null,
                                                    Lunch: null,
                                                    Afternoon: null,
                                                    Dinner: null,
                                                  };
                                                }
                                                newItems[dayIndex][slot] = {
                                                  dish_id: dishId,
                                                  servings:
                                                    servingsSummary?.total_servings ||
                                                    1,
                                                  override: false,
                                                };
                                                return newItems;
                                              });
                                            } finally {
                                              setLoadingServings(false);
                                            }
                                          } else {
                                            setMenuItems((prev) => {
                                              const newItems = { ...prev };
                                              if (!newItems[dayIndex]) {
                                                newItems[dayIndex] = {
                                                  Breakfast: null,
                                                  Lunch: null,
                                                  Afternoon: null,
                                                  Dinner: null,
                                                };
                                              }
                                              newItems[dayIndex][slot] = null;
                                              return newItems;
                                            });
                                          }
                                        }}
                                      >
                                        <SelectTrigger
                                          className={`w-full ${
                                            menuItems[dayIndex]?.[slot]
                                              ? "bg-green-50 border-green-300"
                                              : SELECT_TRIGGER_STYLE
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <SelectValue placeholder="Chọn món" />
                                            {menuItems[dayIndex]?.[slot] && (
                                              <Check className="w-4 h-4 text-green-600" />
                                            )}
                                          </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                          <SelectItem value="none">
                                            None
                                          </SelectItem>
                                          {Array.isArray(dishes) &&
                                            dishes.map((dish) => {
                                              // Check if dish is already selected in same day
                                              const dayItems =
                                                menuItems[dayIndex] || {};
                                              const isSelectedElsewhere =
                                                Object.values(dayItems).some(
                                                  (item) =>
                                                    item?.dish_id ===
                                                    dish.dish_id
                                                );
                                              const isCurrentSelection =
                                                menuItems[dayIndex]?.[slot]
                                                  ?.dish_id === dish.dish_id;

                                              return (
                                                <SelectItem
                                                  key={dish.dish_id}
                                                  value={dish.dish_id}
                                                  disabled={
                                                    isSelectedElsewhere &&
                                                    !isCurrentSelection
                                                  }
                                                  className={
                                                    isCurrentSelection
                                                      ? "bg-green-50"
                                                      : isSelectedElsewhere
                                                      ? "opacity-50"
                                                      : ""
                                                  }
                                                >
                                                  <div className="flex items-center justify-between w-full">
                                                    <span className="truncate">
                                                      {dish.name}
                                                    </span>
                                                    {isCurrentSelection && (
                                                      <Check className="w-4 h-4 ml-2 text-green-600 flex-shrink-0" />
                                                    )}
                                                    {isSelectedElsewhere &&
                                                      !isCurrentSelection && (
                                                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                                          (Selected)
                                                        </span>
                                                      )}
                                                  </div>
                                                </SelectItem>
                                              );
                                            })}
                                        </SelectContent>
                                      </Select>
                                      {menuItems[dayIndex]?.[slot] && (
                                        <div className="space-y-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full cursor-pointer hover:bg-muted/50 transition-all duration-150"
                                            onClick={async () => {
                                              const dishId =
                                                menuItems[dayIndex]?.[slot]
                                                  ?.dish_id;
                                              if (!dishId) return;
                                              const dish = dishes.find(
                                                (d) => d.dish_id === dishId
                                              );
                                              if (!dish) return;

                                              setSelectedDishDetail({
                                                dish,
                                                dayIndex,
                                                slot,
                                              });
                                              setLoadingNutrition(true);
                                              try {
                                                const servings =
                                                  menuItems[dayIndex]?.[slot]
                                                    ?.servings || 1;
                                                const nutritionRes =
                                                  await calculateDishNutrition(
                                                    dishId,
                                                    servings
                                                  );
                                                setDishNutrition(
                                                  nutritionRes.data || null
                                                );

                                                // Load allergy warnings from backend API
                                                try {
                                                  const warningsRes =
                                                    await getDishAllergyWarnings(
                                                      dishId,
                                                      slot,
                                                      selectedWeekStart
                                                    );
                                                  setDishAllergyWarnings(
                                                    warningsRes.data || null
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Error loading allergy warnings:",
                                                    error
                                                  );
                                                  setDishAllergyWarnings(null);
                                                }

                                                // Load detailed servings breakdown
                                                try {
                                                  const breakdownRes =
                                                    await getDetailedServingsBreakdown(
                                                      dishId,
                                                      slot,
                                                      selectedWeekStart
                                                    );
                                                  setDetailedServingsBreakdown(
                                                    breakdownRes.data?.data ||
                                                      null
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Error loading detailed breakdown:",
                                                    error
                                                  );
                                                  setDetailedServingsBreakdown(
                                                    null
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  "Error loading nutrition:",
                                                  error
                                                );
                                                setDishNutrition(null);
                                              } finally {
                                                setLoadingNutrition(false);
                                              }
                                            }}
                                          >
                                            Xem chi tiết
                                          </Button>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              min="1"
                                              value={
                                                menuItems[dayIndex][slot]
                                                  ?.servings || 1
                                              }
                                              onChange={(e) => {
                                                setMenuItems((prev) => {
                                                  const newItems = { ...prev };
                                                  newItems[dayIndex][slot] = {
                                                    ...newItems[dayIndex][
                                                      slot
                                                    ]!,
                                                    servings:
                                                      parseInt(
                                                        e.target.value
                                                      ) || 1,
                                                    override: true,
                                                  };
                                                  return newItems;
                                                });
                                              }}
                                              disabled={
                                                !menuItems[dayIndex][slot]
                                                  ?.override
                                              }
                                              className={`flex-1 ${SELECT_TRIGGER_STYLE} ${
                                                menuItems[dayIndex][slot]
                                                  ?.override
                                                  ? ""
                                                  : "bg-gray-100 cursor-not-allowed"
                                              }`}
                                              placeholder="Phần"
                                            />
                                            <input
                                              type="checkbox"
                                              checked={
                                                menuItems[dayIndex][slot]
                                                  ?.override || false
                                              }
                                              onChange={(e) => {
                                                setMenuItems((prev) => {
                                                  const newItems = { ...prev };
                                                  newItems[dayIndex][slot] = {
                                                    ...newItems[dayIndex][
                                                      slot
                                                    ]!,
                                                    override: e.target.checked,
                                                  };
                                                  return newItems;
                                                });
                                              }}
                                              className="cursor-pointer"
                                              title="Ghi đè số phần"
                                            />
                                          </div>
                                          {!menuItems[dayIndex][slot]
                                            ?.override && (
                                            <p className="text-xs text-gray-500">
                                              Tự động tính:{" "}
                                              {menuItems[dayIndex][slot]
                                                ?.servings || 0}{" "}
                                              phần
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  )}
                </Tabs>
              </>
            ) : (
              <>
                {/* View Menu Tab - Show menu breakdown and editable menu */}
                {/* Menu Servings Breakdown - Per Dish */}
                {menuServingsBreakdown ? (
                  <div className="mb-4 space-y-4">
                    {/* Overall Summary */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                      <h3 className="font-bold text-lg text-blue-900 mb-3">
                        📊 Tóm tắt tổng số phần
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">
                            Tổng cư dân
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {menuServingsBreakdown.total_residents}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">Thường</div>
                          <div className="text-xl font-bold text-green-700">
                            {
                              menuServingsBreakdown.summary
                                .total_regular_servings
                            }
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">
                            Phần không dị ứng
                          </div>
                          <div className="text-xl font-bold text-red-700">
                            {
                              menuServingsBreakdown.summary
                                .total_allergy_safe_servings
                            }
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">Ít đường</div>
                          <div className="text-xl font-bold text-yellow-700">
                            {
                              menuServingsBreakdown.summary
                                .total_low_sugar_servings
                            }
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">Ít muối</div>
                          <div className="text-xl font-bold text-cyan-700">
                            {
                              menuServingsBreakdown.summary
                                .total_low_sodium_servings
                            }
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">Xay nhỏ</div>
                          <div className="text-xl font-bold text-purple-700">
                            {
                              menuServingsBreakdown.summary
                                .total_minced_servings
                            }
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">Nghiền</div>
                          <div className="text-xl font-bold text-purple-700">
                            {
                              menuServingsBreakdown.summary
                                .total_pureed_servings
                            }
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="text-xs text-gray-500">Tổng calo</div>
                          <div className="text-lg font-bold text-orange-700">
                            {menuServingsBreakdown.summary.total_nutrition.calories.toFixed(
                              0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Per-Dish Breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 text-lg">
                        Phân tích theo món
                      </h4>
                      {menuServingsBreakdown.dishes.map(
                        (dishBreakdown, idx) => {
                          const dayNames = [
                            "T2",
                            "T3",
                            "T4",
                            "T5",
                            "T6",
                            "T7",
                            "CN",
                          ];
                          const mealSlotNames: Record<MealSlot, string> = {
                            Breakfast: "Sáng",
                            Lunch: "Trưa",
                            Afternoon: "Chiều",
                            Dinner: "Tối",
                          };
                          return (
                            <div
                              key={idx}
                              className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="font-bold text-gray-900 text-lg">
                                    {dishBreakdown.dish_name}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {dayNames[dishBreakdown.day_of_week]} -{" "}
                                    {mealSlotNames[dishBreakdown.meal_slot]} |
                                    Phần: {dishBreakdown.servings}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                <div className="bg-green-50 rounded p-2 border border-green-200">
                                  <div className="text-xs text-green-700">
                                    Thường
                                  </div>
                                  <div className="font-bold text-green-900">
                                    {
                                      dishBreakdown.detailed_breakdown
                                        .regular_servings
                                    }
                                  </div>
                                </div>
                                {dishBreakdown.detailed_breakdown
                                  .special_servings.allergy_safe.count > 0 && (
                                  <div className="bg-red-50 rounded p-2 border border-red-200">
                                    <div className="text-xs text-red-700">
                                      Phần không dị ứng
                                    </div>
                                    <div className="font-bold text-red-900">
                                      {
                                        dishBreakdown.detailed_breakdown
                                          .special_servings.allergy_safe.count
                                      }
                                    </div>
                                  </div>
                                )}
                                {dishBreakdown.detailed_breakdown
                                  .special_servings.low_sugar.count > 0 && (
                                  <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                                    <div className="text-xs text-yellow-700">
                                      Ít đường
                                    </div>
                                    <div className="font-bold text-yellow-900">
                                      {
                                        dishBreakdown.detailed_breakdown
                                          .special_servings.low_sugar.count
                                      }
                                    </div>
                                  </div>
                                )}
                                {dishBreakdown.detailed_breakdown
                                  .special_servings.low_sodium.count > 0 && (
                                  <div className="bg-cyan-50 rounded p-2 border border-cyan-200">
                                    <div className="text-xs text-cyan-700">
                                      Ít muối
                                    </div>
                                    <div className="font-bold text-cyan-900">
                                      {
                                        dishBreakdown.detailed_breakdown
                                          .special_servings.low_sodium.count
                                      }
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Nutrition Summary */}
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                <div className="text-xs font-semibold text-gray-700 mb-2">
                                  Dinh dưỡng (mỗi phần)
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">Calo:</span>
                                    <span className="ml-1 font-semibold">
                                      {dishBreakdown.nutrition_summary.calories.toFixed(
                                        0
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Protein:
                                    </span>
                                    <span className="ml-1 font-semibold">
                                      {dishBreakdown.nutrition_summary.protein.toFixed(
                                        1
                                      )}
                                      g
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Chất béo:
                                    </span>
                                    <span className="ml-1 font-semibold">
                                      {dishBreakdown.nutrition_summary.fat.toFixed(
                                        1
                                      )}
                                      g
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Carb:</span>
                                    <span className="ml-1 font-semibold">
                                      {dishBreakdown.nutrition_summary.carbs.toFixed(
                                        1
                                      )}
                                      g
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : servingsSummary ? (
                  // Fallback to old summary if menu breakdown not available
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Tóm tắt số phần chung
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                      <div>
                        <span className="text-sm text-gray-600">
                          Tổng cư dân:
                        </span>
                        <span className="ml-2 font-semibold">
                          {servingsSummary.total_residents}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Thường:</span>
                        <span className="ml-2 font-semibold">
                          {servingsSummary.breakdown_by_texture.Regular}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Xay nhỏ:</span>
                        <span className="ml-2 font-semibold">
                          {servingsSummary.breakdown_by_texture.Minced}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Nghiền:</span>
                        <span className="ml-2 font-semibold">
                          {servingsSummary.breakdown_by_texture.Pureed}
                        </span>
                      </div>
                    </div>
                    {servingsSummary.messages.length > 0 && (
                      <div className="mt-2">
                        {servingsSummary.messages.map((msg, idx) => (
                          <p key={idx} className="text-sm text-blue-800">
                            {msg}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Weekly Menu - Tabs Layout for Better UX - Editable in View Tab */}
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full grid-cols-7 bg-gray-100 rounded-lg p-1">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                      (day, dayIndex) => (
                        <TabsTrigger
                          key={day}
                          value={dayIndex.toString()}
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                        >
                          {day}
                        </TabsTrigger>
                      )
                    )}
                  </TabsList>
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                    (day, dayIndex) => (
                      <TabsContent
                        key={day}
                        value={dayIndex.toString()}
                        className="mt-4"
                      >
                        <Card className="bg-white shadow-sm border rounded-xl p-4">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">
                              {day} -{" "}
                              {new Date(
                                new Date(selectedWeekStart).getTime() +
                                  dayIndex * 24 * 60 * 60 * 1000
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(
                                [
                                  "Breakfast",
                                  "Lunch",
                                  "Afternoon",
                                  "Dinner",
                                ] as MealSlot[]
                              ).map((slot) => (
                                <Card
                                  key={slot}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
                                >
                                  <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 block">
                                      {slot}
                                    </label>
                                    <div className="space-y-2">
                                      <Select
                                        value={
                                          menuItems[dayIndex]?.[slot]
                                            ?.dish_id || "none"
                                        }
                                        onValueChange={async (dishId) => {
                                          if (dishId && dishId !== "none") {
                                            // Check for duplicate in same day
                                            const dayItems =
                                              menuItems[dayIndex] || {};
                                            const isDuplicate = Object.values(
                                              dayItems
                                            ).some(
                                              (item, idx) =>
                                                item &&
                                                item.dish_id === dishId &&
                                                Object.keys(dayItems)[idx] !==
                                                  slot
                                            );

                                            if (isDuplicate) {
                                              toast.warning(
                                                "Món này đã được chọn cho bữa ăn khác trong cùng ngày"
                                              );
                                              return;
                                            }

                                            // Auto-calculate servings
                                            setLoadingServings(true);
                                            try {
                                              const servingsRes =
                                                await calculateServingsForDish(
                                                  dishId,
                                                  slot,
                                                  selectedWeekStart
                                                );
                                              const calculatedServings =
                                                servingsRes.data?.data?.total ||
                                                0;

                                              setMenuItems((prev) => {
                                                const newItems = { ...prev };
                                                if (!newItems[dayIndex]) {
                                                  newItems[dayIndex] = {
                                                    Breakfast: null,
                                                    Lunch: null,
                                                    Afternoon: null,
                                                    Dinner: null,
                                                  };
                                                }
                                                newItems[dayIndex][slot] = {
                                                  dish_id: dishId,
                                                  servings: calculatedServings,
                                                  override: false,
                                                };
                                                return newItems;
                                              });
                                            } catch (error) {
                                              console.error(
                                                "Error calculating servings:",
                                                error
                                              );
                                              // Fallback to default
                                              setMenuItems((prev) => {
                                                const newItems = { ...prev };
                                                if (!newItems[dayIndex]) {
                                                  newItems[dayIndex] = {
                                                    Breakfast: null,
                                                    Lunch: null,
                                                    Afternoon: null,
                                                    Dinner: null,
                                                  };
                                                }
                                                newItems[dayIndex][slot] = {
                                                  dish_id: dishId,
                                                  servings:
                                                    servingsSummary?.total_servings ||
                                                    1,
                                                  override: false,
                                                };
                                                return newItems;
                                              });
                                            } finally {
                                              setLoadingServings(false);
                                            }
                                          } else {
                                            setMenuItems((prev) => {
                                              const newItems = { ...prev };
                                              if (!newItems[dayIndex]) {
                                                newItems[dayIndex] = {
                                                  Breakfast: null,
                                                  Lunch: null,
                                                  Afternoon: null,
                                                  Dinner: null,
                                                };
                                              }
                                              newItems[dayIndex][slot] = null;
                                              return newItems;
                                            });
                                          }
                                        }}
                                      >
                                        <SelectTrigger
                                          className={`w-full ${
                                            menuItems[dayIndex]?.[slot]
                                              ? "bg-green-50 border-green-300"
                                              : SELECT_TRIGGER_STYLE
                                          }`}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <SelectValue placeholder="Chọn món" />
                                            {menuItems[dayIndex]?.[slot] && (
                                              <Check className="w-4 h-4 text-green-600" />
                                            )}
                                          </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                          <SelectItem value="none">
                                            None
                                          </SelectItem>
                                          {Array.isArray(dishes) &&
                                            dishes.map((dish) => {
                                              // Check if dish is already selected in same day
                                              const dayItems =
                                                menuItems[dayIndex] || {};
                                              const isSelectedElsewhere =
                                                Object.values(dayItems).some(
                                                  (item) =>
                                                    item?.dish_id ===
                                                    dish.dish_id
                                                );
                                              const isCurrentSelection =
                                                menuItems[dayIndex]?.[slot]
                                                  ?.dish_id === dish.dish_id;

                                              return (
                                                <SelectItem
                                                  key={dish.dish_id}
                                                  value={dish.dish_id}
                                                  disabled={
                                                    isSelectedElsewhere &&
                                                    !isCurrentSelection
                                                  }
                                                  className={
                                                    isCurrentSelection
                                                      ? "bg-green-50"
                                                      : isSelectedElsewhere
                                                      ? "opacity-50"
                                                      : ""
                                                  }
                                                >
                                                  <div className="flex items-center justify-between w-full">
                                                    <span className="truncate">
                                                      {dish.name}
                                                    </span>
                                                    {isCurrentSelection && (
                                                      <Check className="w-4 h-4 ml-2 text-green-600 flex-shrink-0" />
                                                    )}
                                                    {isSelectedElsewhere &&
                                                      !isCurrentSelection && (
                                                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                                          (Selected)
                                                        </span>
                                                      )}
                                                  </div>
                                                </SelectItem>
                                              );
                                            })}
                                        </SelectContent>
                                      </Select>
                                      {menuItems[dayIndex]?.[slot] && (
                                        <div className="space-y-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full cursor-pointer hover:bg-muted/50 transition-all duration-150"
                                            onClick={async () => {
                                              const dishId =
                                                menuItems[dayIndex]?.[slot]
                                                  ?.dish_id;
                                              if (!dishId) return;
                                              const dish = dishes.find(
                                                (d) => d.dish_id === dishId
                                              );
                                              if (!dish) return;

                                              setSelectedDishDetail({
                                                dish,
                                                dayIndex,
                                                slot,
                                              });
                                              setLoadingNutrition(true);
                                              try {
                                                const servings =
                                                  menuItems[dayIndex]?.[slot]
                                                    ?.servings || 1;
                                                const nutritionRes =
                                                  await calculateDishNutrition(
                                                    dishId,
                                                    servings
                                                  );
                                                setDishNutrition(
                                                  nutritionRes.data || null
                                                );

                                                // Load allergy warnings from backend API
                                                try {
                                                  const warningsRes =
                                                    await getDishAllergyWarnings(
                                                      dishId,
                                                      slot,
                                                      selectedWeekStart
                                                    );
                                                  setDishAllergyWarnings(
                                                    warningsRes.data || null
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Error loading allergy warnings:",
                                                    error
                                                  );
                                                  setDishAllergyWarnings(null);
                                                }

                                                // Load detailed servings breakdown
                                                try {
                                                  const breakdownRes =
                                                    await getDetailedServingsBreakdown(
                                                      dishId,
                                                      slot,
                                                      selectedWeekStart
                                                    );
                                                  setDetailedServingsBreakdown(
                                                    breakdownRes.data?.data ||
                                                      null
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Error loading detailed breakdown:",
                                                    error
                                                  );
                                                  setDetailedServingsBreakdown(
                                                    null
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  "Error loading nutrition:",
                                                  error
                                                );
                                                setDishNutrition(null);
                                              } finally {
                                                setLoadingNutrition(false);
                                              }
                                            }}
                                          >
                                            Xem chi tiết
                                          </Button>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              min="1"
                                              value={
                                                menuItems[dayIndex][slot]
                                                  ?.servings || 1
                                              }
                                              onChange={(e) => {
                                                setMenuItems((prev) => {
                                                  const newItems = { ...prev };
                                                  newItems[dayIndex][slot] = {
                                                    ...newItems[dayIndex][
                                                      slot
                                                    ]!,
                                                    servings:
                                                      parseInt(
                                                        e.target.value
                                                      ) || 1,
                                                    override: true,
                                                  };
                                                  return newItems;
                                                });
                                              }}
                                              disabled={
                                                !menuItems[dayIndex][slot]
                                                  ?.override
                                              }
                                              className={`flex-1 ${SELECT_TRIGGER_STYLE} ${
                                                menuItems[dayIndex][slot]
                                                  ?.override
                                                  ? ""
                                                  : "bg-gray-100 cursor-not-allowed"
                                              }`}
                                              placeholder="Phần"
                                            />
                                            <input
                                              type="checkbox"
                                              checked={
                                                menuItems[dayIndex][slot]
                                                  ?.override || false
                                              }
                                              onChange={(e) => {
                                                setMenuItems((prev) => {
                                                  const newItems = { ...prev };
                                                  newItems[dayIndex][slot] = {
                                                    ...newItems[dayIndex][
                                                      slot
                                                    ]!,
                                                    override: e.target.checked,
                                                  };
                                                  return newItems;
                                                });
                                              }}
                                              className="cursor-pointer"
                                              title="Ghi đè số phần"
                                            />
                                          </div>
                                          {!menuItems[dayIndex][slot]
                                            ?.override && (
                                            <p className="text-xs text-gray-500">
                                              Tự động tính:{" "}
                                              {menuItems[dayIndex][slot]
                                                ?.servings || 0}{" "}
                                              phần
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  )}
                </Tabs>

                {/* Nutrition Report */}
                {nutritionReport && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Tóm tắt dinh dưỡng</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm">Trung bình calo tuần: </span>
                        <span className="font-semibold">
                          {nutritionReport.weekly_average.calories} kcal
                        </span>
                      </div>
                      <div>
                        <span className="text-sm">Protein: </span>
                        <span className="font-semibold">
                          {nutritionReport.weekly_average.protein}g
                        </span>
                      </div>
                      {nutritionReport.warnings.length > 0 && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertDescription>
                            <strong>Cảnh báo:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {nutritionReport.warnings.map((w, i) => (
                                <li key={i} className="text-sm">
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dish Detail Dialog */}
        {selectedDishDetail && (
          <DishDetailDialog
            dish={selectedDishDetail.dish}
            nutrition={dishNutrition}
            residents={residents}
            allergyWarnings={dishAllergyWarnings}
            detailedBreakdown={detailedServingsBreakdown}
            onClose={() => {
              setSelectedDishDetail(null);
              setDishNutrition(null);
              setDishAllergyWarnings(null);
              setDetailedServingsBreakdown(null);
            }}
            onSelect={() => {
              // Already selected, just close
              setSelectedDishDetail(null);
              setDishNutrition(null);
              setDishAllergyWarnings(null);
              setDetailedServingsBreakdown(null);
            }}
            isSelected={true}
          />
        )}

        {/* Summary Screen */}
        {showSummary && (
          <SummaryScreen
            menuItems={menuItems}
            dishes={dishes}
            servingsSummary={servingsSummary}
            nutritionReport={nutritionReport}
            onClose={() => setShowSummary(false)}
            onBack={() => setShowSummary(false)}
          />
        )}

        {/* Copy Week Dialog - List View */}
        <Dialog open={showCopyWeekDialog} onOpenChange={setShowCopyWeekDialog}>
          <DialogContent className="bg-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sao chép thực đơn tuần trước</DialogTitle>
            </DialogHeader>
            {loadingMenus ? (
              <div className="text-center py-8">Đang tải thực đơn trước...</div>
            ) : previousMenus.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Không tìm thấy thực đơn trước
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Chọn thực đơn tuần trước để sao chép sang tuần hiện tại (
                  {new Date(selectedWeekStart).toLocaleDateString("vi-VN")})
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {previousMenus.map((menu) => (
                    <Card
                      key={menu.menu_id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-all ${
                        selectedMenuForCopy?.menu_id === menu.menu_id
                          ? "border-2 border-blue-500 bg-blue-50"
                          : "border"
                      }`}
                      onClick={() => setSelectedMenuForCopy(menu)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">
                            Tuần:{" "}
                            {new Date(menu.week_start_date).toLocaleDateString(
                              "vi-VN"
                            )}{" "}
                            -{" "}
                            {new Date(menu.week_end_date).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Món: {menu.menuItems?.length || 0}
                          </div>
                          {menu.created_by?.staffProfile?.full_name && (
                            <div className="text-xs text-gray-500 mt-1">
                              Tạo bởi: {menu.created_by.staffProfile.full_name}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMenuForCopy(menu);
                          }}
                        >
                          {selectedMenuForCopy?.menu_id === menu.menu_id
                            ? "Đã chọn"
                            : "Chọn"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                {selectedMenuForCopy && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">
                          Chi tiết thực đơn đã chọn
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            selectedMenuForCopy.week_start_date
                          ).toLocaleDateString("vi-VN")}{" "}
                          -{" "}
                          {new Date(
                            selectedMenuForCopy.week_end_date
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedMenuForCopy(null)}
                        >
                          Xóa
                        </Button>
                        <Button
                          className="bg-green-500 text-white hover:bg-green-600"
                          onClick={async () => {
                            if (!selectedMenuForCopy) return;
                            try {
                              await copyWeekMenu({
                                source_week_start_date:
                                  selectedMenuForCopy.week_start_date,
                                target_week_start_date: selectedWeekStart,
                                adjust_servings: true,
                              });
                              toast.success(
                                "Sao chép thực đơn tuần thành công"
                              );
                              setShowCopyWeekDialog(false);
                              setSelectedMenuForCopy(null);
                              // Reload menu
                              const menuRes = await getWeeklyMenuByWeek(
                                selectedWeekStart
                              );
                              const responseData = menuRes.data as any;
                              const menuData =
                                responseData?.data ?? responseData;
                              if (menuData) {
                                setWeeklyMenu(menuData);
                                setActiveTab("view");
                              }
                            } catch (error: any) {
                              toast.error(
                                error.response?.data?.message ||
                                  "Sao chép thực đơn tuần thất bại"
                              );
                            }
                          }}
                        >
                          Sao chép sang tuần hiện tại
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                        (day, dayIndex) => {
                          const dayItems =
                            selectedMenuForCopy.menuItems?.filter(
                              (item) => item.day_of_week === dayIndex
                            ) || [];
                          return (
                            <div
                              key={day}
                              className="p-2 bg-white rounded border"
                            >
                              <div className="font-semibold text-xs">{day}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {dayItems.length} món
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Menu Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="bg-white max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Cập nhật thực đơn -{" "}
                {viewMenu
                  ? `${new Date(viewMenu.week_start_date).toLocaleDateString(
                      "vi-VN"
                    )} - ${new Date(viewMenu.week_end_date).toLocaleDateString(
                      "vi-VN"
                    )}`
                  : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Chỉnh sửa món cho từng bữa ăn. Thay đổi sẽ được lưu khi bạn nhấn
                "Gửi cập nhật".
              </div>

              {/* Weekly Menu - Tabs Layout for Editing */}
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="grid w-full grid-cols-7 bg-gray-100 rounded-lg p-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, dayIndex) => (
                      <TabsTrigger
                        key={day}
                        value={dayIndex.toString()}
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                      >
                        {day}
                      </TabsTrigger>
                    )
                  )}
                </TabsList>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, dayIndex) => (
                    <TabsContent
                      key={day}
                      value={dayIndex.toString()}
                      className="mt-4"
                    >
                      <Card className="bg-white shadow-sm border rounded-xl p-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold">
                            {day} -{" "}
                            {viewMenu
                              ? new Date(
                                  new Date(viewMenu.week_start_date).getTime() +
                                    dayIndex * 24 * 60 * 60 * 1000
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(
                              [
                                "Breakfast",
                                "Lunch",
                                "Afternoon",
                                "Dinner",
                              ] as MealSlot[]
                            ).map((slot) => (
                              <Card
                                key={slot}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
                              >
                                <div className="space-y-3">
                                  <label className="text-sm font-semibold text-gray-700 block">
                                    {slot === "Breakfast"
                                      ? "Sáng"
                                      : slot === "Lunch"
                                      ? "Trưa"
                                      : slot === "Afternoon"
                                      ? "Chiều"
                                      : "Tối"}
                                  </label>
                                  <div className="space-y-2">
                                    <Select
                                      value={
                                        updateMenuItems[dayIndex]?.[slot]
                                          ?.dish_id || "none"
                                      }
                                      onValueChange={async (dishId) => {
                                        if (dishId && dishId !== "none") {
                                          // Check for duplicate in same day
                                          const dayItems =
                                            updateMenuItems[dayIndex] || {};
                                          const isDuplicate = Object.values(
                                            dayItems
                                          ).some(
                                            (item, idx) =>
                                              item &&
                                              item.dish_id === dishId &&
                                              Object.keys(dayItems)[idx] !==
                                                slot
                                          );

                                          if (isDuplicate) {
                                            toast.warning(
                                              "This dish has already been selected for another meal on the same day"
                                            );
                                            return;
                                          }

                                          // Auto-calculate servings
                                          try {
                                            const servingsRes =
                                              await calculateServingsForDish(
                                                dishId,
                                                slot,
                                                viewMenu?.week_start_date ||
                                                  selectedWeekStart
                                              );
                                            const calculatedServings =
                                              servingsRes.data?.data?.total ||
                                              0;

                                            setUpdateMenuItems((prev) => {
                                              const newItems = { ...prev };
                                              if (!newItems[dayIndex]) {
                                                newItems[dayIndex] = {
                                                  Breakfast: null,
                                                  Lunch: null,
                                                  Afternoon: null,
                                                  Dinner: null,
                                                };
                                              }
                                              newItems[dayIndex][slot] = {
                                                dish_id: dishId,
                                                servings: calculatedServings,
                                                override: false,
                                              };
                                              return newItems;
                                            });
                                          } catch (error) {
                                            console.error(
                                              "Error calculating servings:",
                                              error
                                            );
                                            setUpdateMenuItems((prev) => {
                                              const newItems = { ...prev };
                                              if (!newItems[dayIndex]) {
                                                newItems[dayIndex] = {
                                                  Breakfast: null,
                                                  Lunch: null,
                                                  Afternoon: null,
                                                  Dinner: null,
                                                };
                                              }
                                              newItems[dayIndex][slot] = {
                                                dish_id: dishId,
                                                servings: 1,
                                                override: false,
                                              };
                                              return newItems;
                                            });
                                          }
                                        } else {
                                          setUpdateMenuItems((prev) => {
                                            const newItems = { ...prev };
                                            if (!newItems[dayIndex]) {
                                              newItems[dayIndex] = {
                                                Breakfast: null,
                                                Lunch: null,
                                                Afternoon: null,
                                                Dinner: null,
                                              };
                                            }
                                            newItems[dayIndex][slot] = null;
                                            return newItems;
                                          });
                                        }
                                      }}
                                    >
                                      <SelectTrigger
                                        className={`w-full ${
                                          updateMenuItems[dayIndex]?.[slot]
                                            ? "bg-green-50 border-green-300"
                                            : SELECT_TRIGGER_STYLE
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <SelectValue placeholder="Chọn món" />
                                          {updateMenuItems[dayIndex]?.[
                                            slot
                                          ] && (
                                            <Check className="w-4 h-4 text-green-600" />
                                          )}
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent className="bg-white">
                                        <SelectItem value="none">
                                          Không có
                                        </SelectItem>
                                        {Array.isArray(dishes) &&
                                          dishes.map((dish) => {
                                            const dayItems =
                                              updateMenuItems[dayIndex] || {};
                                            const isSelectedElsewhere =
                                              Object.values(dayItems).some(
                                                (item) =>
                                                  item?.dish_id === dish.dish_id
                                              );
                                            const isCurrentSelection =
                                              updateMenuItems[dayIndex]?.[slot]
                                                ?.dish_id === dish.dish_id;

                                            return (
                                              <SelectItem
                                                key={dish.dish_id}
                                                value={dish.dish_id}
                                                disabled={
                                                  isSelectedElsewhere &&
                                                  !isCurrentSelection
                                                }
                                                className={
                                                  isCurrentSelection
                                                    ? "bg-green-50"
                                                    : isSelectedElsewhere
                                                    ? "opacity-50"
                                                    : ""
                                                }
                                              >
                                                <div className="flex items-center justify-between w-full">
                                                  <span className="truncate">
                                                    {dish.name}
                                                  </span>
                                                  {isCurrentSelection && (
                                                    <Check className="w-4 h-4 ml-2 text-green-600 flex-shrink-0" />
                                                  )}
                                                </div>
                                              </SelectItem>
                                            );
                                          })}
                                      </SelectContent>
                                    </Select>
                                    {updateMenuItems[dayIndex]?.[slot] && (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="1"
                                          value={
                                            updateMenuItems[dayIndex][slot]
                                              ?.servings || 1
                                          }
                                          onChange={(e) => {
                                            setUpdateMenuItems((prev) => {
                                              const newItems = { ...prev };
                                              newItems[dayIndex][slot] = {
                                                ...newItems[dayIndex][slot]!,
                                                servings:
                                                  parseInt(e.target.value) || 1,
                                                override: true,
                                              };
                                              return newItems;
                                            });
                                          }}
                                          className={`flex-1 ${SELECT_TRIGGER_STYLE}`}
                                          placeholder="Servings"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )
                )}
              </Tabs>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateDialog(false);
                    setUpdateMenuItems({});
                  }}
                >
                  Hủy
                </Button>
                <Button
                  className="bg-green-500 text-white hover:bg-green-600"
                  onClick={async () => {
                    if (!viewMenu) return;
                    try {
                      const menuItemsArray = [];
                      for (let day = 0; day < 7; day++) {
                        const dayItems = updateMenuItems[day] || {
                          Breakfast: null,
                          Lunch: null,
                          Afternoon: null,
                          Dinner: null,
                        };
                        for (const slot of [
                          "Breakfast",
                          "Lunch",
                          "Afternoon",
                          "Dinner",
                        ] as MealSlot[]) {
                          if (dayItems[slot]) {
                            menuItemsArray.push({
                              dish_id: dayItems[slot]!.dish_id,
                              meal_slot: slot,
                              day_of_week: day,
                              servings: dayItems[slot]!.servings || 0,
                            });
                          }
                        }
                      }

                      const result = await createWeeklyMenu({
                        week_start_date: viewMenu.week_start_date,
                        menuItems: menuItemsArray,
                      });

                      const responseData = result.data as any;
                      const menuData = responseData?.data ?? responseData;

                      if (menuData && menuData.menu_id) {
                        toast.success("Cập nhật thực đơn thành công");
                        setShowUpdateDialog(false);
                        setUpdateMenuItems({});

                        // Reload menu
                        const menuRes = await getWeeklyMenuByWeek(
                          viewMenu.week_start_date
                        );
                        const responseData2 = menuRes.data as any;
                        const menuData2 = responseData2?.data ?? responseData2;
                        if (menuData2) {
                          setViewMenu(menuData2);
                          setSelectedMenuId(menuData2.menu_id);
                          // Reload breakdown
                          try {
                            const breakdownRes = await getMenuServingsBreakdown(
                              menuData2.menu_id
                            );
                            const breakdownData = breakdownRes.data as any;
                            setMenuServingsBreakdown(
                              breakdownData?.data ?? breakdownData ?? null
                            );
                          } catch (error) {
                            console.error("Error loading breakdown:", error);
                          }
                        }

                        // Reload all menus
                        const allMenusRes = await getWeeklyMenus(100, 0);
                        const allMenusData = Array.isArray(
                          allMenusRes.data?.data
                        )
                          ? allMenusRes.data.data
                          : [];
                        setAllMenus(allMenusData);
                      }
                    } catch (error: any) {
                      toast.error(
                        error.response?.data?.message ||
                          "Cập nhật thực đơn thất bại"
                      );
                    }
                  }}
                >
                  Gửi cập nhật
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  async function handleSaveWeeklyMenu() {
    try {
      const menuItemsArray = [];
      for (let day = 0; day < 7; day++) {
        const dayItems = menuItems[day] || {
          Breakfast: null,
          Lunch: null,
          Afternoon: null,
          Dinner: null,
        };
        for (const slot of [
          "Breakfast",
          "Lunch",
          "Afternoon",
          "Dinner",
        ] as MealSlot[]) {
          if (dayItems[slot]) {
            menuItemsArray.push({
              dish_id: dayItems[slot]!.dish_id,
              meal_slot: slot,
              day_of_week: day,
              servings: dayItems[slot]!.servings || 0, // Auto-calculated if 0
            });
          }
        }
      }

      const result = await createWeeklyMenu({
        week_start_date: selectedWeekStart,
        menuItems: menuItemsArray,
      });

      // Backend returns: { message: '...', data: WeeklyMenu, nutrition_report: ..., wasUpdate: boolean }
      const responseData = result.data as any;
      const menuData = responseData?.data ?? responseData;
      const nutritionReportData = responseData?.nutrition_report;
      const wasUpdate = responseData?.wasUpdate ?? false;

      if (menuData && menuData.menu_id) {
        setWeeklyMenu(menuData);
        if (nutritionReportData) {
          setNutritionReport(nutritionReportData);
        }

        // Load menu servings breakdown - add small delay to ensure transaction is committed
        try {
          // Wait a bit for transaction to commit
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Retry logic - menu might not be immediately available after transaction
          let breakdownRes = null;
          let retries = 3;

          while (retries > 0) {
            try {
              breakdownRes = await getMenuServingsBreakdown(menuData.menu_id);
              break; // Success, exit retry loop
            } catch (error: any) {
              retries--;
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            }
          }

          if (breakdownRes) {
            setMenuServingsBreakdown(
              (breakdownRes.data as any)?.data ?? breakdownRes.data ?? null
            );
          }
        } catch (error) {
          // Silently fail - breakdown is optional
        }

        // Show success message based on wasUpdate flag from backend
        toast.success(
          wasUpdate
            ? "Cập nhật thực đơn tuần thành công"
            : "Tạo thực đơn tuần thành công"
        );
      } else {
        toast.error("Tạo thực đơn tuần thất bại: Phản hồi không hợp lệ");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Tạo thực đơn tuần thất bại";
      if (errorMessage.includes("not found")) {
        toast.error("Không tìm thấy thực đơn. Vui lòng thử lại.");
      } else {
        toast.error(errorMessage);
      }
    }
  }
};

export default NutritionPage;
