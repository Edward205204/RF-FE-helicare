import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Settings } from "lucide-react";

const AdminSettings: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Settings className="mr-2 h-6 w-6" />
            Cài đặt Hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-600">
            Trang cài đặt sẽ được phát triển trong tương lai.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
