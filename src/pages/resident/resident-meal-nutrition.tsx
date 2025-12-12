import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Utensils } from "lucide-react";

const ResidentMealNutrition: React.FC = () => {
  return (
    <div className="min-h-screen space-y-6 p-4 md:p-6 bg-white">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Weekly Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Feature in development. You will be able to view weekly menus and
            nutrition information here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentMealNutrition;
