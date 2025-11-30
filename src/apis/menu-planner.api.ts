import request from "@/utils/request";

export type MealSlot = "Breakfast" | "Lunch" | "Afternoon" | "Dinner";
export type DishTexture = "Regular" | "Minced" | "Pureed";
export type IngredientUnit = "g" | "ml" | "pcs";

export interface Ingredient {
  ingredient_id: string;
  institution_id: string;
  name: string;
  unit: IngredientUnit;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;
  created_at: string;
  updated_at: string;
}

export interface DishIngredient {
  dish_ingredient_id: string;
  dish_id: string;
  ingredient_id: string;
  amount: number;
  ingredient?: Ingredient;
}

export interface Dish {
  dish_id: string;
  institution_id: string;
  name: string;
  calories_per_100g: number;
  texture: DishTexture;
  sugar_adjustable: boolean;
  sodium_level?: number;
  dietary_flags?: string[];
  is_blendable: boolean;
  created_at: string;
  updated_at: string;
  dishIngredients?: DishIngredient[];
}

export interface WeeklyMenuItem {
  menu_item_id: string;
  menu_id: string;
  dish_id: string;
  meal_slot: MealSlot;
  day_of_week: number;
  servings: number;
  texture_variant?: DishTexture;
  dish?: Dish;
}

export interface WeeklyMenu {
  menu_id: string;
  institution_id: string;
  week_start_date: string;
  week_end_date: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  menuItems?: WeeklyMenuItem[];
  created_by?: {
    user_id: string;
    email: string;
    staffProfile?: {
      full_name: string;
    };
  };
}

export interface CreateDishData {
  name: string;
  calories_per_100g: number;
  texture: DishTexture;
  sugar_adjustable: boolean;
  sodium_level?: number;
  dietary_flags?: string[];
  is_blendable: boolean;
  ingredients: {
    ingredient_id: string;
    amount: number;
  }[];
}

export interface CreateIngredientData {
  name: string;
  unit: IngredientUnit;
  calories_per_100g: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  carbs_per_100g?: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;
}

export interface CreateWeeklyMenuData {
  week_start_date: string;
  menuItems: {
    dish_id: string;
    meal_slot: MealSlot;
    day_of_week: number;
    servings: number;
    texture_variant?: DishTexture;
  }[];
}

export interface CopyWeekMenuData {
  source_week_start_date: string;
  target_week_start_date: string;
  adjust_servings?: boolean;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sodium?: number;
}

export interface MenuNutritionValidation {
  day_of_week: number;
  meal_slot: MealSlot;
  summary: NutritionSummary;
  warnings: string[];
  recommendations: string[];
}

export interface WeeklyMenuNutritionReport {
  week_start_date: string;
  week_end_date: string;
  daily_summaries: {
    day_of_week: number;
    day_name: string;
    total_calories: number;
    total_protein: number;
    total_fat: number;
    total_carbs: number;
    meal_slots: MenuNutritionValidation[];
  }[];
  weekly_average: NutritionSummary;
  warnings: string[];
  recommendations: string[];
}

export interface AutoVariantResult {
  success: boolean;
  original_texture: DishTexture;
  target_texture: DishTexture;
  variant_dish_id?: string;
  error?: string;
  warning?: string;
}

// ========== DISH APIs ==========
export const getDishes = async (texture?: DishTexture) => {
  const params = texture ? `?texture=${texture}` : "";
  const response = await request.get<{ message: string; data: Dish[] }>(
    `/api/menu-planner/dishes${params}`
  );
  return response.data;
};

export const getDishById = async (dish_id: string) => {
  return request.get<Dish>(`/api/menu-planner/dishes/${dish_id}`);
};

export const createDish = async (data: CreateDishData) => {
  return request.post<Dish>("/api/menu-planner/dishes", data);
};

export const updateDish = async (
  dish_id: string,
  data: Partial<CreateDishData>
) => {
  return request.put<Dish>(`/api/menu-planner/dishes/${dish_id}`, data);
};

export const deleteDish = async (dish_id: string) => {
  return request.delete(`/api/menu-planner/dishes/${dish_id}`);
};

// ========== INGREDIENT APIs ==========
export const getIngredients = async () => {
  const response = await request.get<{ message: string; data: Ingredient[] }>(
    "/api/menu-planner/ingredients"
  );
  return response.data;
};

export const getIngredientById = async (ingredient_id: string) => {
  return request.get<Ingredient>(
    `/api/menu-planner/ingredients/${ingredient_id}`
  );
};

export const createIngredient = async (data: CreateIngredientData) => {
  return request.post<Ingredient>("/api/menu-planner/ingredients", data);
};

export const updateIngredient = async (
  ingredient_id: string,
  data: Partial<CreateIngredientData>
) => {
  return request.put<Ingredient>(
    `/api/menu-planner/ingredients/${ingredient_id}`,
    data
  );
};

export const deleteIngredient = async (ingredient_id: string) => {
  return request.delete(`/api/menu-planner/ingredients/${ingredient_id}`);
};

// ========== WEEKLY MENU APIs ==========
export const getWeeklyMenus = async (take?: number, skip?: number) => {
  const params = new URLSearchParams();
  if (take) params.append("take", take.toString());
  if (skip) params.append("skip", skip.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  return request.get<{ data: WeeklyMenu[]; total: number }>(
    `/api/menu-planner/weekly-menus${query}`
  );
};

export const getWeeklyMenu = async (menu_id: string) => {
  return request.get<WeeklyMenu>(`/api/menu-planner/weekly-menus/${menu_id}`);
};

export const getWeeklyMenuByWeek = async (week_start_date: string) => {
  return request.get<WeeklyMenu>(
    `/api/menu-planner/weekly-menus/week/${week_start_date}`
  );
};

// Get weekly menu by week for family user (no staff permission required)
export const getWeeklyMenuByWeekForFamily = async (week_start_date: string) => {
  return request.get<WeeklyMenu>(
    `/api/menu-planner/weekly-menus/week/${week_start_date}/family`
  );
};

export const createWeeklyMenu = async (data: CreateWeeklyMenuData) => {
  return request.post<{
    data: WeeklyMenu;
    nutrition_report: WeeklyMenuNutritionReport;
  }>("/api/menu-planner/weekly-menus", data);
};

export const copyWeekMenu = async (data: CopyWeekMenuData) => {
  return request.post<WeeklyMenu>("/api/menu-planner/weekly-menus/copy", data);
};

export const deleteWeeklyMenu = async (menu_id: string) => {
  return request.delete(`/api/menu-planner/weekly-menus/${menu_id}`);
};

// ========== DISH SUGGESTIONS ==========
export const getDishSuggestions = async (
  resident_id: string,
  meal_slot?: MealSlot,
  day_of_week?: number
) => {
  const params = new URLSearchParams();
  if (meal_slot) params.append("meal_slot", meal_slot);
  if (day_of_week !== undefined)
    params.append("day_of_week", day_of_week.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  return request.get<Dish[]>(
    `/api/menu-planner/dish-suggestions/${resident_id}${query}`
  );
};

export interface DishSuggestionWithReasons {
  dish: Dish;
  reasons: string[];
  score: number;
}

export const getDishSuggestionsByTags = async (
  diet_tags?: string[],
  meal_slot?: MealSlot,
  exclude_allergens?: string[]
) => {
  const params = new URLSearchParams();
  if (diet_tags && diet_tags.length > 0) {
    params.append("diet_tags", diet_tags.join(","));
  }
  if (meal_slot) params.append("meal_slot", meal_slot);
  if (exclude_allergens && exclude_allergens.length > 0) {
    params.append("exclude_allergens", exclude_allergens.join(","));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request.get<DishSuggestionWithReasons[]>(
    `/api/menu-planner/dish-suggestions${query}`
  );
};

export const getAllergenTags = async () => {
  const response = await request.get<{ message: string; data: string[] }>(
    `/api/menu-planner/allergens`
  );
  return response.data;
};

export interface DishAllergyWarning {
  dish_id: string;
  dish_name: string;
  affected_residents: Array<{
    resident_id: string;
    resident_name: string;
    allergen_substance: string;
  }>;
  total_affected: number;
  suggested_alternatives?: Array<{
    dish_id: string;
    dish_name: string;
    reason: string;
  }>;
  special_portions_needed: {
    allergy_safe: number;
    low_sugar: number;
    low_sodium: number;
    soft_texture: number;
    pureed: number;
  };
}

export const getDishAllergyWarnings = async (
  dish_id: string,
  meal_slot: MealSlot,
  date?: string
) => {
  const params = new URLSearchParams();
  params.append("meal_slot", meal_slot);
  if (date) params.append("date", date);
  return request.get<DishAllergyWarning>(
    `/api/menu-planner/dishes/${dish_id}/allergy-warnings?${params.toString()}`
  );
};

// ========== AUTO-VARIANT ==========
export const generateDishVariant = async (
  dish_id: string,
  target_texture: DishTexture
) => {
  return request.post<AutoVariantResult>(
    `/api/menu-planner/dishes/${dish_id}/variant`,
    {
      target_texture,
    }
  );
};

export const checkResidentGroupVariants = async (
  dish_id: string,
  resident_ids: string[]
) => {
  return request.post(`/api/menu-planner/dishes/${dish_id}/check-variants`, {
    resident_ids,
  });
};

// ========== NUTRITION VALIDATION ==========
export const validateMenuNutrition = async (menu_id: string) => {
  return request.get<WeeklyMenuNutritionReport>(
    `/api/menu-planner/weekly-menus/${menu_id}/nutrition`
  );
};

// Validate menu nutrition for family user (by week_start_date)
export const validateMenuNutritionForFamily = async (week_start_date: string) => {
  return request.get<WeeklyMenuNutritionReport>(
    `/api/menu-planner/weekly-menus/week/${week_start_date}/nutrition/family`
  );
};

export const calculateDishNutrition = async (
  dish_id: string,
  servings: number = 1
) => {
  return request.get<NutritionSummary>(
    `/api/menu-planner/dishes/${dish_id}/nutrition?servings=${servings}`
  );
};

// ========== SERVINGS CALCULATION ==========
export interface ServingsSummary {
  total_residents: number;
  total_servings: number;
  breakdown_by_tag: Record<string, number>;
  breakdown_by_texture: {
    Regular: number;
    Minced: number;
    Pureed: number;
  };
  messages: string[];
}

export const getServingsSummary = async (date?: string) => {
  const params = date ? `?date=${date}` : "";
  return request.get<{ message: string; data: ServingsSummary }>(
    `/api/menu-planner/servings/summary${params}`
  );
};

export const calculateServingsForDish = async (
  dish_id: string,
  meal_slot: MealSlot,
  date?: string
) => {
  const params = new URLSearchParams();
  params.append("meal_slot", meal_slot);
  if (date) params.append("date", date);
  return request.get<{
    message: string;
    data: {
      total: number;
      breakdown: Record<string, number>;
      texture_breakdown: {
        Regular: number;
        Minced: number;
        Pureed: number;
      };
    };
  }>(`/api/menu-planner/servings/dish/${dish_id}?${params.toString()}`);
};

export interface DetailedServingsBreakdown {
  dish_id: string;
  dish_name: string;
  total_servings: number;
  regular_servings: number;
  special_servings: {
    allergy_safe: {
      count: number;
      excluded_ingredients: Array<{
        ingredient_id: string;
        ingredient_name: string;
        reason: string;
      }>;
      affected_residents: Array<{
        resident_id: string;
        resident_name: string;
        allergen_substance: string;
      }>;
    };
    low_sugar: {
      count: number;
      affected_residents: Array<{
        resident_id: string;
        resident_name: string;
      }>;
      sugar_reduction_percentage?: number;
    };
    low_sodium: {
      count: number;
      affected_residents: Array<{
        resident_id: string;
        resident_name: string;
      }>;
      sodium_reduction_percentage?: number;
    };
    soft_texture: {
      minced: number;
      pureed: number;
      affected_residents: Array<{
        resident_id: string;
        resident_name: string;
        required_texture: "Minced" | "Pureed";
      }>;
    };
  };
  nutrition_breakdown: {
    regular: NutritionSummary;
    allergy_safe: NutritionSummary;
    low_sugar: NutritionSummary;
    low_sodium: NutritionSummary;
  };
  ingredients_breakdown: {
    regular: Array<{
      ingredient_id: string;
      ingredient_name: string;
      total_amount: number;
      unit: string;
    }>;
    special_modifications: Array<{
      modification_type: "allergy_safe" | "low_sugar" | "low_sodium";
      excluded_ingredients: Array<{
        ingredient_id: string;
        ingredient_name: string;
      }>;
      adjusted_ingredients: Array<{
        ingredient_id: string;
        ingredient_name: string;
        original_amount: number;
        adjusted_amount: number;
        unit: string;
        reason: string;
      }>;
    }>;
  };
}

export const getDetailedServingsBreakdown = async (
  dish_id: string,
  meal_slot: MealSlot,
  date?: string
) => {
  const params = new URLSearchParams();
  params.append("meal_slot", meal_slot);
  if (date) params.append("date", date);
  return request.get<{
    message: string;
    data: DetailedServingsBreakdown;
  }>(
    `/api/menu-planner/servings/dish/${dish_id}/detailed?${params.toString()}`
  );
};

export interface MenuServingsBreakdown {
  menu_id: string;
  week_start_date: string;
  total_residents: number;
  dishes: Array<{
    dish_id: string;
    dish_name: string;
    meal_slot: MealSlot;
    day_of_week: number;
    servings: number;
    detailed_breakdown: DetailedServingsBreakdown;
    nutrition_summary: NutritionSummary;
  }>;
  summary: {
    total_regular_servings: number;
    total_allergy_safe_servings: number;
    total_low_sugar_servings: number;
    total_low_sodium_servings: number;
    total_minced_servings: number;
    total_pureed_servings: number;
    total_nutrition: NutritionSummary;
  };
}

export const getMenuServingsBreakdown = async (menu_id: string) => {
  return request.get<{
    message: string;
    data: MenuServingsBreakdown;
  }>(`/api/menu-planner/weekly-menus/${menu_id}/servings-breakdown`);
};

// ========== MENU EXPORT ==========
export const exportMenuAsPDF = async (menu_id: string) => {
  const { beUrl } = await import("@/utils/config");
  const response = await fetch(
    `${beUrl}/api/menu-planner/weekly-menus/${menu_id}/export/pdf`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    }
  );
  if (!response.ok) throw new Error("Failed to export PDF");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `weekly-menu-${menu_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportMenuAsExcel = async (menu_id: string) => {
  const { beUrl } = await import("@/utils/config");
  const response = await fetch(
    `${beUrl}/api/menu-planner/weekly-menus/${menu_id}/export/excel`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    }
  );
  if (!response.ok) throw new Error("Failed to export Excel");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `weekly-menu-${menu_id}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
