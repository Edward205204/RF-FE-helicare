import React, { useEffect, useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover"
import { Calendar } from "../components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"

import {
    mapConditions,
    mapAllergies,
    detectDietGroup,
    normalizeList,
    mockDietGroups,
    mockMenuItems
} from "../utils/nutrition-core";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../components/ui/dialog";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "../components/ui/select";

import {
    Table,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    TableHeader
} from "../components/ui/table";

import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "../components/ui/pagination";

import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";


// ===========================================================
// 🎯 PLAN INTERFACE
// ===========================================================
interface Plan {
    id: string;
    mealName: string;
    calories: number;
    mealType: string;
    date: string;
    assignedResident: string;
    notes: string;
    dietGroup: {
        conditions: any[];
        allergies: any[];
    };
    dietCategory?: string;
}



// ===========================================================
// 📌 MAIN COMPONENT
// ===========================================================
const NutritionAdminPage: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [searchText, setSearchText] = useState("");
    const [mealTypeFilter, setMealTypeFilter] = useState("");
    const [residentFilter, setResidentFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [groupFilter, setGroupFilter] = useState("");

    const [openDialog, setOpenDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [formData, setFormData] = useState({
        mealName: "",
        calories: "",
        mealType: "",
        date: "",
        assignedResident: "",
        dietGroup: {
            conditions: [] as string[],
            allergies: [] as string[],
        },
        notes: "",
    });

    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // do not select past dates
    const isFutureDate = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const picked = new Date(dateStr);
        picked.setHours(0, 0, 0, 0);

        return picked > today;
    };


    // ===========================================================
    // LOAD STORAGE
    // ===========================================================
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("nutritionPlans") || "[]");
        setPlans(stored);
    }, []);

    const savePlans = (updated: Plan[]) => {
        setPlans(updated);
        localStorage.setItem("nutritionPlans", JSON.stringify(updated));
    };


    // ===========================================================
    // AUTO-FILL ALLERGEN WHEN SELECTING A MEAL FROM MENU
    // ===========================================================
    const autoFillAllergens = (mealName: string) => {
        const found = mockMenuItems.find((m) => m.name === mealName);
        return found?.allergens.map((a) => a.name) || [];
    };


    // ===========================================================
    // HANDLE SUBMIT
    // ===========================================================
    const handleSubmit = () => {
        const mappedConditions = mapConditions(formData.dietGroup.conditions);
        const mappedAllergies = mapAllergies(formData.dietGroup.allergies);

        const dietCategory = detectDietGroup(mappedConditions);

        const newPlan: Plan = {
            id: editingPlan?.id || crypto.randomUUID(),
            mealName: formData.mealName,
            calories: Number(formData.calories),
            mealType: formData.mealType,
            date: formData.date,
            assignedResident: formData.assignedResident,
            notes: formData.notes,
            dietGroup: {
                conditions: mappedConditions,
                allergies: mappedAllergies,
            },
            dietCategory,
        };

        const updated = editingPlan
            ? plans.map((p) => (p.id === editingPlan.id ? newPlan : p))
            : [...plans, newPlan];

        savePlans(updated);
        setOpenDialog(false);
        setEditingPlan(null);

        setFormData({
            mealName: "",
            calories: "",
            mealType: "",
            date: "",
            assignedResident: "",
            dietGroup: { conditions: [], allergies: [] },
            notes: "",
        });
    };


    // ===========================================================
    // EDIT
    // ===========================================================
    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);

        setFormData({
            mealName: plan.mealName,
            calories: String(plan.calories),
            mealType: plan.mealType,
            date: plan.date,
            assignedResident: plan.assignedResident,
            dietGroup: {
                conditions: plan.dietGroup.conditions.map((c) => c.name),
                allergies: plan.dietGroup.allergies.map((a) => a.name),
            },
            notes: plan.notes,
        });

        setOpenDialog(true);
    };


    // ===========================================================
    // DELETE
    // ===========================================================
    const handleDelete = (id: string) => {
        const updated = plans.filter((p) => p.id !== id);
        savePlans(updated);
    };


    // ===========================================================
    // FILTER + SEARCH
    // ===========================================================
    const filteredPlans = useMemo(() => {
        const s = searchText.toLowerCase();

        return plans.filter((p) => {
            const matchSearch =
                p.mealName.toLowerCase().includes(s) ||
                p.notes.toLowerCase().includes(s) ||
                p.assignedResident.toLowerCase().includes(s);

            const matchMealType =
                mealTypeFilter === "" ||
                mealTypeFilter === "all" ||
                p.mealType === mealTypeFilter;

            const matchResident =
                residentFilter === "" ||
                residentFilter === "all" ||
                p.assignedResident === residentFilter;

            const matchDate =
                dateFilter === "" ||
                p.date === dateFilter;

            const matchGroup =
                groupFilter === "" ||
                groupFilter === "all" ||
                p.dietGroup.conditions.some((c) => c.name === groupFilter) ||
                p.dietGroup.allergies.some((a) => a.name === groupFilter);

            return (
                matchSearch &&
                matchMealType &&
                matchResident &&
                matchDate &&
                matchGroup
            );
        });
    }, [plans, searchText, mealTypeFilter, residentFilter, dateFilter, groupFilter]);



    const paginatedPlans = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPlans.slice(start, start + itemsPerPage);
    }, [filteredPlans, currentPage]);

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, mealTypeFilter, residentFilter, dateFilter, groupFilter]);


    // ===========================================================
    // RENDER
    // ===========================================================
    return (
        <div className="container mx-auto p-6 space-y-6">

            {/* <h1 className="text-3xl font-bold">Nutrition Plan Management</h1> */}


            {/* ==================== SEARCH + FILTER ==================== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md shadow-sm bg-white">

                {/* Search */}
                <div>
                    <Label>Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-8"
                            placeholder="Search plans..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Meal Type Filter */}
                <div>
                    <Label>Meal Type</Label>
                    <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Resident Filter */}
                <div>
                    <Label>Resident</Label>
                    <Select value={residentFilter} onValueChange={setResidentFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Residents" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {[...new Set(plans.map((p) => p.assignedResident))].map((r) => (
                                r ? (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ) : null
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Filter */}
                <div>
                    <Label>Date</Label>
                    <div className="relative">
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pr-10"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    <CalendarIcon className="h-5 w-5" />
                                </button>
                            </PopoverTrigger>

                            <PopoverContent align="end" className="p-0 scale-70">
                                <Calendar
                                    mode="single"
                                    selected={dateFilter ? new Date(dateFilter) : undefined}
                                    onSelect={(day) => {
                                        if (!day) return
                                        const iso = day.toISOString().split("T")[0]
                                        setDateFilter(iso)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>


                {/* Diet Group Filter */}
                <div>
                    <Label>Diet Group</Label>
                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {mockDietGroups.map((g) => (
                                <SelectItem key={g.id} value={g.name}>
                                    {g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            </div>




            {/* ==================== ADD BUTTON ==================== */}
            <div className="flex justify-end">
                <Button onClick={() => setOpenDialog(true)} className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" /> Add Plan
                </Button>
            </div>



            {/* ==================== TABLE ==================== */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-bold mb-3">Nutrition Plans</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-base font-semibold text-center">Meal</TableHead>
                            <TableHead className="text-base font-semibold text-center">Calories</TableHead>
                            <TableHead className="text-base font-semibold text-center">Type</TableHead>
                            <TableHead className="text-base font-semibold text-center">Date</TableHead>
                            <TableHead className="text-base font-semibold text-center">Resident</TableHead>
                            <TableHead className="text-base font-semibold text-center">Diet</TableHead>
                            <TableHead className="text-base font-semibold text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paginatedPlans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell>{plan.mealName}</TableCell>
                                <TableCell>{plan.calories}</TableCell>
                                <TableCell>{plan.mealType}</TableCell>
                                <TableCell>{plan.date}</TableCell>
                                <TableCell>{plan.assignedResident}</TableCell>

                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        {plan.dietGroup.conditions.map((c) => (
                                            <Badge key={c.id} className="bg-blue-100 text-blue-700">
                                                {c.name}
                                            </Badge>
                                        ))}
                                        {plan.dietGroup.allergies.map((a) => (
                                            <Badge
                                                key={a.id}
                                                variant="destructive"
                                                className="text-white"
                                            >
                                                {a.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>

                                <TableCell className="flex items-center justify-center gap-2">
                                    <Button size="sm" onClick={() => alert("Viewing...")}>
                                        <Eye className="w-4 h-4 text-black" />
                                    </Button>
                                    <Button size="sm" onClick={() => handleEdit(plan)}>
                                        <Edit className="w-4 h-4 text-black" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(plan.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>


            {/* ==================== PAGINATION ==================== */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>

                        <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        />

                        {Array.from({ length: totalPages }).map((_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    isActive={currentPage === i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationNext
                            onClick={() =>
                                setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                        />

                    </PaginationContent>
                </Pagination>
            )}



            {/* ==================== ADD/EDIT DIALOG ==================== */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-lg max-w-lg overflow-visible">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Add Nutrition Plan"}</DialogTitle>
                        <DialogDescription>
                            Fill in the nutrition plan information below.
                        </DialogDescription>
                    </DialogHeader>


                    <div className="space-y-4">

                        <div>
                            <Label>Meal Name</Label>
                            <Input
                                value={formData.mealName}
                                onChange={(e) => {
                                    const meal = e.target.value;

                                    setFormData((prev) => ({
                                        ...prev,
                                        mealName: meal,
                                        dietGroup: {
                                            ...prev.dietGroup,
                                            allergies: autoFillAllergens(meal),
                                        },
                                    }));
                                }}
                            />
                        </div>

                        <div>
                            <Label>Calories</Label>
                            <Input
                                type="number"
                                value={formData.calories}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, calories: e.target.value }))
                                }
                            />
                        </div>

                        <div>
                            <Label>Meal Type</Label>
                            <Select
                                value={formData.mealType}
                                onValueChange={(v) =>
                                    setFormData((prev) => ({ ...prev, mealType: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="breakfast">Breakfast</SelectItem>
                                    <SelectItem value="lunch">Lunch</SelectItem>
                                    <SelectItem value="dinner">Dinner</SelectItem>
                                    <SelectItem value="snack">Snack</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Date</Label>

                            <div className="relative">
                                <Input
                                    type="date"
                                    value={formData.date}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (!isFutureDate(value)) {
                                            alert("Do not select a past date!");
                                            return;
                                        }

                                        setFormData((prev) => ({ ...prev, date: value }));
                                    }}
                                    className="pr-10"
                                />


                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            <CalendarIcon className="h-5 w-5" />
                                        </button>
                                    </PopoverTrigger>

                                    <PopoverContent align="end" side="top" sideOffset={6} className="p-0 w-[200px] z-[99999]">
                                        <div className="scale-[0.75] origin-top-right">
                                            <Calendar
                                                mode="single"
                                                selected={formData.date ? new Date(formData.date) : undefined}
                                                onSelect={(day) => {
                                                    if (!day) return;

                                                    const iso = day.toISOString().split("T")[0];

                                                    if (!isFutureDate(iso)) {
                                                        alert("Do not select a past date!");
                                                        return; // Do not update input
                                                    }

                                                    setFormData((prev) => ({ ...prev, date: iso }));
                                                }}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>


                        <div>
                            <Label>Resident</Label>
                            <Input
                                value={formData.assignedResident}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        assignedResident: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <Label>Conditions (comma separated)</Label>
                            <Input
                                value={formData.dietGroup.conditions.join(", ")}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        dietGroup: {
                                            ...prev.dietGroup,
                                            conditions: normalizeList(e.target.value),
                                        },
                                    }))
                                }
                            />

                        </div>

                        <div>
                            <Label>Allergies (comma separated)</Label>
                            <Input
                                value={formData.dietGroup.allergies.join(", ")}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        dietGroup: {
                                            ...prev.dietGroup,
                                            allergies: normalizeList(e.target.value),
                                        },
                                    }))
                                }
                            />

                        </div>

                        <div>
                            <Label>Notes</Label>
                            <Input
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                                }
                            />
                        </div>

                        <Button onClick={handleSubmit} className="w-full bg-blue-600">
                            {editingPlan ? "Save Changes" : "Add Plan"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div >
    );
};

export default NutritionAdminPage;
