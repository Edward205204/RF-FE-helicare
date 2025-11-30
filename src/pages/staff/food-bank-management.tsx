import React, { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@/components/ui";
import {
  getDishes,
  getIngredients,
  createDish,
  updateDish,
  getAllergenTags,
  type Dish,
  type Ingredient,
  type CreateDishData,
} from "@/apis/menu-planner.api";
import { toast } from "react-toastify";

type DishFormState = {
  dish_id?: string;
  name: string;
  calories_per_100g: string;
  texture: CreateDishData["texture"];
  sugar_adjustable: boolean;
  sodium_level?: string;
  dietary_flags: string[];
  is_blendable: boolean;
  ingredients: {
    ingredient_id: string;
    amount: string;
  }[];
};

const EMPTY_FORM: DishFormState = {
  name: "",
  calories_per_100g: "",
  texture: "Regular",
  sugar_adjustable: false,
  sodium_level: "",
  dietary_flags: [],
  is_blendable: false,
  ingredients: [],
};

const cardStyle = "bg-white shadow-sm border rounded-xl p-4";

const FoodBankManagementPage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allergenTags, setAllergenTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DishFormState>(EMPTY_FORM);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  const ingredientMap = useMemo(
    () => {
      const list = Array.isArray(ingredients) ? ingredients : [];
      return list.reduce<Record<string, Ingredient>>((acc, ing) => {
        acc[ing.ingredient_id] = ing;
        return acc;
      }, {});
    },
    [ingredients]
  );

  const loadReferenceData = async () => {
    try {
      setLoading(true);
      const [dishRes, ingRes, allergenRes] = await Promise.all([
        getDishes(),
        getIngredients(),
        getAllergenTags(),
      ]);

      const dishesList = (dishRes as { message?: string; data?: Dish[] }).data;
      const ingredientsList = (ingRes as {
        message?: string;
        data?: Ingredient[];
      }).data;
      const allergenList = (
        allergenRes as { message?: string; data?: string[] }
      ).data;

      setDishes(dishesList || []);
      setIngredients(ingredientsList || []);
      setAllergenTags(allergenList || []);
    } catch (error: any) {
      console.error("Failed to load food bank data:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể tải dữ liệu ngân hàng món ăn."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingDishId(null);
  };

  const startEdit = (dish: Dish) => {
    setEditingDishId(dish.dish_id);
    setForm({
      dish_id: dish.dish_id,
      name: dish.name,
      calories_per_100g: String(dish.calories_per_100g ?? ""),
      texture: dish.texture,
      sugar_adjustable: dish.sugar_adjustable,
      sodium_level:
        dish.sodium_level !== undefined && dish.sodium_level !== null
          ? String(dish.sodium_level)
          : "",
      dietary_flags: (dish.dietary_flags as string[]) || [],
      is_blendable: dish.is_blendable,
      ingredients:
        dish.dishIngredients?.map((di) => ({
          ingredient_id: di.ingredient_id,
          amount: String(di.amount),
        })) || [],
    });
  };

  const handleIngredientChange = (
    index: number,
    field: "ingredient_id" | "amount",
    value: string
  ) => {
    setForm((prev) => {
      const next = [...prev.ingredients];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, ingredients: next };
    });
  };

  const addIngredientRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { ingredient_id: ingredients[0]?.ingredient_id || "", amount: "" },
      ],
    }));
  };

  const removeIngredientRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên món.");
      return;
    }

    if (!form.calories_per_100g || Number.isNaN(Number(form.calories_per_100g))) {
      toast.error("Calories phải là số hợp lệ.");
      return;
    }

    const normalizedIngredients = form.ingredients
      .filter((ing) => ing.ingredient_id && ing.amount)
      .map((ing) => ({
        ingredient_id: ing.ingredient_id,
        amount: Number(ing.amount),
      }));

    if (normalizedIngredients.length === 0) {
      toast.error("Vui lòng thêm ít nhất một nguyên liệu.");
      return;
    }

    const payload: CreateDishData = {
      name: form.name.trim(),
      calories_per_100g: Number(form.calories_per_100g),
      texture: form.texture,
      sugar_adjustable: form.sugar_adjustable,
      sodium_level: form.sodium_level
        ? Number(form.sodium_level)
        : undefined,
      dietary_flags:
        form.dietary_flags && form.dietary_flags.length > 0
          ? form.dietary_flags
          : undefined,
      is_blendable: form.is_blendable,
      ingredients: normalizedIngredients,
    };

    try {
      setSaving(true);
      if (editingDishId) {
        await updateDish(editingDishId, payload);
        toast.success("Cập nhật món ăn thành công.");
      } else {
        await createDish(payload);
        toast.success("Tạo món ăn thành công.");
      }
      resetForm();
      await loadReferenceData();
    } catch (error: any) {
      console.error("Failed to save dish:", error);
      toast.error(
        error.response?.data?.message || "Không thể lưu món ăn. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const ingredientSummary = (dish: Dish) => {
    if (!dish.dishIngredients || dish.dishIngredients.length === 0) {
      return "—";
    }
    return dish.dishIngredients
      .slice(0, 3)
      .map((di) => di.ingredient?.name || "")
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle>Food Bank Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên món *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Calories (per 100g) *
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.calories_per_100g}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      calories_per_100g: e.target.value,
                    }))
                  }
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Texture *
                </label>
                <Select
                  value={form.texture}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      texture: val as DishFormState["texture"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-white cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Minced">Minced</SelectItem>
                    <SelectItem value="Pureed">Pureed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <label className="text-sm font-medium">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={form.sugar_adjustable}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sugar_adjustable: e.target.checked,
                      }))
                    }
                  />
                  Có thể điều chỉnh đường
                </label>
                <label className="text-sm font-medium">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={form.is_blendable}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_blendable: e.target.checked,
                      }))
                    }
                  />
                  Có thể xay nhuyễn
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mức sodium (mg, optional)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.sodium_level ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sodium_level: e.target.value,
                    }))
                  }
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Allergen / Dietary Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allergenTags.map((tag) => {
                    const active = form.dietary_flags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            dietary_flags: active
                              ? prev.dietary_flags.filter((t) => t !== tag)
                              : [...prev.dietary_flags, tag],
                          }))
                        }
                        className={`px-2 py-1 rounded-full text-xs border cursor-pointer transition-all duration-150 ${
                          active
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-muted/50"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {allergenTags.length === 0 && (
                    <span className="text-xs text-gray-400">
                      Chưa có dữ liệu allergen từ cư dân / món ăn.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Ingredients</h3>
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  onClick={addIngredientRow}
                  disabled={ingredients.length === 0}
                >
                  Thêm nguyên liệu
                </Button>
              </div>
              {ingredients.length === 0 && (
                <p className="text-xs text-gray-500">
                  Chưa có nguyên liệu nào. Hãy nhờ admin/import dữ liệu ingredient
                  trước.
                </p>
              )}
              <div className="space-y-2">
                {form.ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-6">
                      <Select
                        value={ing.ingredient_id}
                        onValueChange={(val) =>
                          handleIngredientChange(index, "ingredient_id", val)
                        }
                      >
                        <SelectTrigger className="bg-white cursor-pointer">
                          <SelectValue placeholder="Chọn nguyên liệu" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {ingredients.map((i) => (
                            <SelectItem
                              key={i.ingredient_id}
                              value={i.ingredient_id}
                            >
                              {i.name} ({i.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Số lượng"
                        value={ing.amount}
                        onChange={(e) =>
                          handleIngredientChange(index, "amount", e.target.value)
                        }
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => removeIngredientRow(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingDishId && (
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={resetForm}
                >
                  Hủy chỉnh sửa
                </Button>
              )}
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingDishId
                  ? "Cập nhật món"
                  : "Tạo món mới"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle>Danh sách món ăn</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
          ) : dishes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Chưa có món ăn nào trong Food Bank.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Tên món</th>
                    <th className="text-left py-2 pr-4 hidden md:table-cell">
                      Nguyên liệu chính
                    </th>
                    <th className="text-left py-2 pr-4">Calories / 100g</th>
                    <th className="text-left py-2 pr-4">Allergens</th>
                    <th className="text-right py-2 pl-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((dish) => (
                    <tr
                      key={dish.dish_id}
                      className="border-b hover:bg-muted/50 transition-all duration-150"
                    >
                      <td className="py-2 pr-4">
                        <div className="font-medium">{dish.name}</div>
                        <div className="text-xs text-gray-500 md:hidden">
                          {ingredientSummary(dish)}
                        </div>
                      </td>
                      <td className="py-2 pr-4 hidden md:table-cell text-xs text-gray-600">
                        {ingredientSummary(dish)}
                      </td>
                      <td className="py-2 pr-4">
                        {dish.calories_per_100g ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {((dish.dietary_flags as string[]) || []).map(
                            (flag) => (
                              <Badge
                                key={flag}
                                variant="outline"
                                className="text-xs"
                              >
                                {flag}
                              </Badge>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => startEdit(dish)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodBankManagementPage;


