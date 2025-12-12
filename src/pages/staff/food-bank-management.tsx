import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const FoodBankManagementPage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allergenTags, setAllergenTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DishFormState>(EMPTY_FORM);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  const ingredientMap = useMemo(() => {
    const list = Array.isArray(ingredients) ? ingredients : [];
    return list.reduce<Record<string, Ingredient>>((acc, ing) => {
      acc[ing.ingredient_id] = ing;
      return acc;
    }, {});
  }, [ingredients]);

  const loadReferenceData = async () => {
    try {
      setLoading(true);
      const [dishRes, ingRes, allergenRes] = await Promise.all([
        getDishes(),
        getIngredients(),
        getAllergenTags(),
      ]);

      const dishesList = (dishRes as { message?: string; data?: Dish[] }).data;
      const ingredientsList = (
        ingRes as {
          message?: string;
          data?: Ingredient[];
        }
      ).data;
      const allergenList = (
        allergenRes as { message?: string; data?: string[] }
      ).data;

      setDishes(dishesList || []);
      setIngredients(ingredientsList || []);
      setAllergenTags(allergenList || []);
    } catch (error: any) {
      console.error("Failed to load food bank data:", error);
      toast.error(
        error.response?.data?.message || "Failed to load food bank data."
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
      toast.error("Please enter dish name.");
      return;
    }

    if (
      !form.calories_per_100g ||
      Number.isNaN(Number(form.calories_per_100g))
    ) {
      toast.error("Calories must be a valid number.");
      return;
    }

    const normalizedIngredients = form.ingredients
      .filter((ing) => ing.ingredient_id && ing.amount)
      .map((ing) => ({
        ingredient_id: ing.ingredient_id,
        amount: Number(ing.amount),
      }));

    if (normalizedIngredients.length === 0) {
      toast.error("Please add at least one ingredient.");
      return;
    }

    const payload: CreateDishData = {
      name: form.name.trim(),
      calories_per_100g: Number(form.calories_per_100g),
      texture: form.texture,
      sugar_adjustable: form.sugar_adjustable,
      sodium_level: form.sodium_level ? Number(form.sodium_level) : undefined,
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
        toast.success("Dish updated successfully.");
      } else {
        await createDish(payload);
        toast.success("Dish created successfully.");
      }
      resetForm();
      await loadReferenceData();
    } catch (error: any) {
      console.error("Failed to save dish:", error);
      toast.error(
        error.response?.data?.message || "Cannot save dish. Please try again."
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
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Food Bank Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="dish-name"
                  className="text-base font-semibold text-gray-700"
                >
                  Dish Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dish-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter dish name"
                  className="bg-white border-gray-300 text-lg focus:border-blue-400 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="calories"
                  className="text-base font-semibold text-gray-700"
                >
                  Calories (per 100g) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="calories"
                  type="number"
                  min={0}
                  value={form.calories_per_100g}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      calories_per_100g: e.target.value,
                    }))
                  }
                  placeholder="Enter calories"
                  className="bg-white border-gray-300 text-lg focus:border-blue-400 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="texture"
                  className="text-base font-semibold text-gray-700"
                >
                  Texture <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.texture}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      texture: val as DishFormState["texture"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-lg focus:border-blue-400 focus:ring-0">
                    <SelectValue placeholder="Select texture" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Minced">Minced</SelectItem>
                    <SelectItem value="Pureed">Pureed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700 block mb-3">
                  Options
                </Label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      checked={form.sugar_adjustable}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sugar_adjustable: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-base text-gray-700 group-hover:text-blue-600 transition-colors">
                      Sugar Adjustable
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      checked={form.is_blendable}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          is_blendable: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-base text-gray-700 group-hover:text-blue-600 transition-colors">
                      Blendable
                    </span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="sodium"
                  className="text-base font-semibold text-gray-700"
                >
                  Sodium Level (mg, optional)
                </Label>
                <Input
                  id="sodium"
                  type="number"
                  min={0}
                  value={form.sodium_level ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sodium_level: e.target.value,
                    }))
                  }
                  placeholder="Enter sodium level"
                  className="bg-white border-gray-300 text-lg focus:border-blue-400 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700 block mb-3">
                  Allergens / Nutrition Labels
                </Label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
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
                        className={`px-4 py-2 rounded-full text-sm font-medium border-2 cursor-pointer transition-all duration-200 shadow-sm ${
                          active
                            ? "bg-blue-500 text-white border-blue-600 shadow-md hover:bg-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {allergenTags.length === 0 && (
                    <span className="text-sm text-gray-500 italic">
                      No allergen data from residents / dishes.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-gray-800">
                  Ingredients
                </Label>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#5985d8] hover:bg-[#5183c9] text-white shadow-sm"
                  onClick={addIngredientRow}
                  disabled={ingredients.length === 0}
                >
                  + Add Ingredient
                </Button>
              </div>
              {ingredients.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> No ingredients available. Please ask
                    admin to import/create ingredients first.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {form.ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="col-span-6">
                      <Select
                        value={ing.ingredient_id}
                        onValueChange={(val) =>
                          handleIngredientChange(index, "ingredient_id", val)
                        }
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-base focus:border-blue-400 focus:ring-0">
                          <SelectValue placeholder="Select ingredient" />
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
                        step="0.01"
                        placeholder="Amount"
                        value={ing.amount}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "amount",
                            e.target.value
                          )
                        }
                        className="bg-white border-gray-300 text-base focus:border-blue-400 focus:ring-0"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer hover:bg-red-50 hover:text-red-600 text-gray-500"
                        onClick={() => removeIngredientRow(index)}
                      >
                        <span className="text-xl">×</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {editingDishId && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                type="submit"
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white shadow-sm min-w-[120px]"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingDishId
                  ? "Update Dish"
                  : "Create Dish"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Dish List
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">Loading data...</p>
            </div>
          ) : dishes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No dishes in Food Bank.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="text-base font-semibold text-gray-700">
                      Dish Name
                    </TableHead>
                    <TableHead className="text-base font-semibold text-gray-700 hidden md:table-cell">
                      Ingredients
                    </TableHead>
                    <TableHead className="text-base font-semibold text-gray-700">
                      Calories / 100g
                    </TableHead>
                    <TableHead className="text-base font-semibold text-gray-700">
                      Allergens
                    </TableHead>
                    <TableHead className="text-base font-semibold text-gray-700 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dishes.map((dish) => (
                    <TableRow
                      key={dish.dish_id}
                      className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="font-semibold text-lg text-gray-800">
                          {dish.name}
                        </div>
                        <div className="text-sm text-gray-500 md:hidden mt-1">
                          {ingredientSummary(dish)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 hidden md:table-cell text-sm text-gray-600">
                        {ingredientSummary(dish)}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-medium text-gray-800">
                          {dish.calories_per_100g ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {((dish.dietary_flags as string[]) || []).map(
                            (flag) => (
                              <Badge
                                key={flag}
                                variant="outline"
                                className="text-xs border-gray-300 bg-gray-50 text-gray-700"
                              >
                                {flag}
                              </Badge>
                            )
                          )}
                          {(!dish.dietary_flags ||
                            (dish.dietary_flags as string[]).length === 0) && (
                            <span className="text-xs text-gray-400 italic">
                              None
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                          onClick={() => startEdit(dish)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodBankManagementPage;
