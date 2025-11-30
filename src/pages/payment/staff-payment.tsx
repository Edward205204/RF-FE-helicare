import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { Badge } from "@/components/ui";

// Mock data for service requests
const initialRequests = [
  {
    id: 1,
    residentName: "Nguyen Van A",
    serviceType: "Home Care",
    notes: "Weekly visits needed",
    price: 500000,
    status: "Pending admin approval" as
      | "Pending admin approval"
      | "Approved"
      | "Rejected",
  },
  {
    id: 2,
    residentName: "Tran Thi B",
    serviceType: "Medical Checkup",
    notes: "Monthly health check",
    price: 300000,
    status: "Approved" as "Pending admin approval" | "Approved" | "Rejected",
  },
];

// --- STYLES ---
const CARD_STYLE = "bg-white border-none shadow-sm";

// ĐÃ UPDATE: Thêm focus-visible:ring-0 focus:ring-0 để loại bỏ viền đen mặc định đè lên
const INPUT_STYLE =
  "bg-gray-50 border-gray-200 text-lg transition-colors " +
  "focus:bg-white focus:border-blue-400 " +
  "focus-visible:ring-0 focus:ring-0 focus:outline-none"; // <-- Fix lỗi viền đen ở đây

const PaymentModuleStaff: React.FC = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [formData, setFormData] = useState({
    residentName: "",
    serviceType: "",
    notes: "",
    price: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.residentName || !formData.serviceType || !formData.price)
      return;

    const newRequest = {
      id: requests.length + 1,
      residentName: formData.residentName,
      serviceType: formData.serviceType,
      notes: formData.notes,
      price: parseInt(formData.price),
      status: "Pending admin approval" as const,
    };

    // Mock API call
    setTimeout(() => {
      setRequests((prev) => [...prev, newRequest]);
      setFormData({ residentName: "", serviceType: "", notes: "", price: "" });
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending admin approval":
        return (
          <Badge
            variant="secondary"
            className="text-lg shadow-sm text-white bg-[#689bdf]"
          >
            Pending
          </Badge>
        );
      case "Approved":
        return (
          <Badge
            variant="default"
            className="text-lg shadow-sm text-white bg-[#22c55e]"
          >
            Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge
            variant="destructive"
            className="text-lg shadow-sm text-white bg-[#f59e0b]"
          >
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="text-lg shadow-sm text-white bg-[#689bdf]">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className={CARD_STYLE}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Payment Module - Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="residentName" className="text-base mb-3">
                Resident Name
              </Label>
              <Input
                id="residentName"
                value={formData.residentName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("residentName", e.target.value)
                }
                placeholder="Enter resident name"
                className={INPUT_STYLE}
              />
            </div>
            <div>
              <Label htmlFor="serviceType" className="text-base mb-3">
                Service Type
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) =>
                  handleInputChange("serviceType", value)
                }
              >
                <SelectTrigger className={INPUT_STYLE}>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Home Care">Home Care</SelectItem>
                  <SelectItem value="Medical Checkup">
                    Medical Checkup
                  </SelectItem>
                  <SelectItem value="Emergency Assistance">
                    Emergency Assistance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="text-base mb-3">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange("notes", e.target.value)
                }
                placeholder="Additional notes"
                className={INPUT_STYLE}
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-base mb-3">
                Price (VND)
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("price", e.target.value)
                }
                placeholder="Enter price"
                className={INPUT_STYLE}
              />
            </div>
            <div className="w-full text-center">
              <Button
                onClick={handleSubmit}
                className="text-lg bg-[#689bdf] hover:bg-[#5183c9] shadow-sm cursor-pointer text-white text-base"
              >
                Submit Service Request
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={CARD_STYLE}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            My Service Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100">
                <TableHead className="text-lg text-gray-600">
                  Resident Name
                </TableHead>
                <TableHead className="text-lg text-gray-600">
                  Service Type
                </TableHead>
                <TableHead className="text-lg text-gray-600">Notes</TableHead>
                <TableHead className="text-lg text-gray-600">
                  Price (VND)
                </TableHead>
                <TableHead className="text-lg text-gray-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <TableCell className="text-lg">
                    {request.residentName}
                  </TableCell>
                  <TableCell className="text-lg">
                    {request.serviceType}
                  </TableCell>
                  <TableCell className="text-lg text-gray-500">
                    {request.notes}
                  </TableCell>
                  <TableCell className="text-lg font-medium">
                    {request.price.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModuleStaff;
