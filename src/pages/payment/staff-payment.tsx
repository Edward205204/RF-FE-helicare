import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { toast } from "react-toastify";
import { getResidents, ResidentResponse } from "@/apis/resident.api";
import {
  getServiceContracts,
  createServiceContract,
  updateServiceContract,
  deleteServiceContract,
  ServiceContractResponse,
  BillingCycle,
} from "@/apis/service-contract.api";
import {
  getPayments,
  getPaymentById,
  verifyPayment,
  PaymentResponse,
  PaymentStatus,
  PaymentMethod,
} from "@/apis/payment.api";

// --- STYLES ---
const CARD_STYLE = "bg-white border-none shadow-sm";
const INPUT_STYLE =
  "bg-gray-50 border-gray-200 text-lg transition-colors " +
  "focus:bg-white focus:border-blue-400 " +
  "focus-visible:ring-0 focus:ring-0 focus:outline-none";

const PaymentModuleStaff: React.FC = () => {
  // Contracts state
  const [contracts, setContracts] = useState<ServiceContractResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contracts");

  // Contract form state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] =
    useState<ServiceContractResponse | null>(null);
  const [contractFormData, setContractFormData] = useState({
    resident_id: "",
    billing_cycle: "MONTHLY" as BillingCycle,
    amount: "",
    start_date: "",
    next_billing_date: "",
  });

  // Payment detail modal
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentResponse | null>(null);
  const [isPaymentDetailModalOpen, setIsPaymentDetailModalOpen] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsRes, paymentsRes, residentsRes] = await Promise.all([
        getServiceContracts({ is_active: true }),
        getPayments({ status: "PENDING" }),
        getResidents({ limit: 1000 }),
      ]);
      setContracts(contractsRes.contracts || []);
      setPayments(paymentsRes.payments || []);
      setResidents(residentsRes.residents || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = () => {
    setEditingContract(null);
    setContractFormData({
      resident_id: "",
      billing_cycle: "MONTHLY",
      amount: "",
      start_date: "",
      next_billing_date: "",
    });
    setIsContractModalOpen(true);
  };

  const handleEditContract = (contract: ServiceContractResponse) => {
    setEditingContract(contract);
    setContractFormData({
      resident_id: contract.resident_id,
      billing_cycle: contract.billing_cycle,
      amount: contract.amount.toString(),
      start_date: contract.start_date.split("T")[0],
      next_billing_date: contract.next_billing_date.split("T")[0],
    });
    setIsContractModalOpen(true);
  };

  const handleSubmitContract = async () => {
    if (
      !contractFormData.resident_id ||
      !contractFormData.amount ||
      !contractFormData.next_billing_date
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const amount = parseFloat(contractFormData.amount);
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      const data = {
        resident_id: contractFormData.resident_id,
        billing_cycle: contractFormData.billing_cycle,
        amount,
        start_date: contractFormData.start_date || undefined,
        next_billing_date: contractFormData.next_billing_date,
      };

      if (editingContract) {
        await updateServiceContract(editingContract.contract_id, data);
        toast.success("Contract updated successfully");
      } else {
        await createServiceContract(data);
        toast.success("Contract created successfully");
      }

      setIsContractModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save contract");
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this contract? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteServiceContract(contractId);
      toast.success("Contract deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete contract");
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    if (!window.confirm("Are you sure you want to verify this payment?")) return;

    try {
      await verifyPayment(paymentId);
      toast.success("Payment verified");
      setIsPaymentDetailModalOpen(false);
      setSelectedPayment(null);
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to verify payment"
      );
    }
  };

  const handleViewPayment = async (paymentId: string) => {
    try {
      const response = await getPaymentById(paymentId);
      setSelectedPayment(response.data);
      setIsPaymentDetailModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to load payment details");
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge variant="default" className="text-lg bg-green-500">
            Success
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary" className="text-lg bg-yellow-500">
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="text-lg">
            Failed
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="outline" className="text-lg">
            Refunded
          </Badge>
        );
      default:
        return <Badge className="text-lg">Unknown</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case "VNPAY":
        return <Badge className="text-sm bg-blue-500">VNPay</Badge>;
      case "CASH":
        return <Badge className="text-sm bg-gray-500">Bank Transfer</Badge>;
      default:
        return <Badge className="text-sm">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-lg">Loading data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className={CARD_STYLE}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Payment Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contracts">Service Contracts</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="contracts" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateContract}
                  className="bg-[#689bdf] hover:bg-[#5183c9] text-white"
                >
                  Create New Contract
                </Button>
              </div>
              {contracts.length === 0 ? (
                <p className="text-center text-lg text-gray-500 py-8">
                  No contracts yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="text-lg text-gray-600">
                        Resident
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Billing Cycle
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Amount
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Next Payment Date
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Status
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow
                        key={contract.contract_id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell className="text-lg">
                          {contract.resident?.full_name || "N/A"}
                        </TableCell>
                        <TableCell className="text-lg">
                          {contract.billing_cycle === "MONTHLY"
                            ? "Monthly"
                            : "Yearly"}
                        </TableCell>
                        <TableCell className="text-lg font-medium">
                          {formatCurrency(contract.amount)}
                        </TableCell>
                        <TableCell className="text-lg">
                          {formatDate(contract.next_billing_date)}
                        </TableCell>
                        <TableCell>
                          {contract.is_active ? (
                            <Badge className="text-sm bg-green-500">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="text-sm bg-gray-500">
                              Cancelled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handleEditContract(contract)}
                            className="text-sm"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleDeleteContract(contract.contract_id)
                            }
                            className="text-sm"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-center text-lg text-gray-500 py-8">
                  No pending payments
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="text-lg text-gray-600">
                        Cư dân
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Số tiền
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Phương thức
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Kỳ thanh toán
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Trạng thái
                      </TableHead>
                      <TableHead className="text-lg text-gray-600">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow
                        key={payment.payment_id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell className="text-lg">
                          {payment.contract?.resident?.full_name || "N/A"}
                        </TableCell>
                        <TableCell className="text-lg font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(payment.payment_method)}
                        </TableCell>
                        <TableCell className="text-lg">
                          {formatDate(payment.period_start)} -{" "}
                          {formatDate(payment.period_end)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleViewPayment(payment.payment_id)
                            }
                            className="text-sm"
                          >
                            Details
                          </Button>
                          {payment.status === "PENDING" &&
                            payment.payment_method === "CASH" && (
                              <Button
                                onClick={() =>
                                  handleVerifyPayment(payment.payment_id)
                                }
                                className="text-sm ml-2 bg-green-500 hover:bg-green-600"
                              >
                                Verify
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contract Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingContract ? "Edit Contract" : "Create New Contract"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resident_id" className="text-base mb-3">
                Resident <span className="text-red-500">*</span>
              </Label>
              <Select
                value={contractFormData.resident_id}
                onValueChange={(value) =>
                  setContractFormData((prev) => ({
                    ...prev,
                    resident_id: value,
                  }))
                }
                disabled={!!editingContract}
              >
                <SelectTrigger className={INPUT_STYLE}>
                  <SelectValue placeholder="Select resident" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {residents.map((resident) => (
                    <SelectItem
                      key={resident.resident_id}
                      value={resident.resident_id}
                    >
                      {resident.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="billing_cycle" className="text-base mb-3">
                Billing Cycle <span className="text-red-500">*</span>
              </Label>
              <Select
                value={contractFormData.billing_cycle}
                onValueChange={(value) =>
                  setContractFormData((prev) => ({
                    ...prev,
                    billing_cycle: value as BillingCycle,
                  }))
                }
              >
                <SelectTrigger className={INPUT_STYLE}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="text-base mb-3">
                Amount (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                value={contractFormData.amount}
                onChange={(e) =>
                  setContractFormData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="Enter amount"
                className={INPUT_STYLE}
              />
            </div>
            <div>
              <Label htmlFor="start_date" className="text-base mb-3">
                Start Date (optional)
              </Label>
              <Input
                id="start_date"
                type="date"
                value={contractFormData.start_date}
                onChange={(e) =>
                  setContractFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className={INPUT_STYLE}
              />
            </div>
            <div>
              <Label htmlFor="next_billing_date" className="text-base mb-3">
                Ngày thanh toán tiếp theo{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="next_billing_date"
                type="date"
                value={contractFormData.next_billing_date}
                onChange={(e) =>
                  setContractFormData((prev) => ({
                    ...prev,
                    next_billing_date: e.target.value,
                  }))
                }
                className={INPUT_STYLE}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsContractModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitContract}
                className="bg-[#689bdf] hover:bg-[#5183c9] text-white"
              >
                {editingContract ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Modal */}
      <Dialog
        open={isPaymentDetailModalOpen}
        onOpenChange={setIsPaymentDetailModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Resident:</p>
                  <p className="text-lg font-semibold">
                    {selectedPayment.contract?.resident?.full_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  {getPaymentMethodBadge(selectedPayment.payment_method)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status:</p>
                  {getPaymentStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Period:</p>
                  <p className="text-lg">
                    {formatDate(selectedPayment.period_start)} -{" "}
                    {formatDate(selectedPayment.period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At:</p>
                  <p className="text-lg">
                    {formatDate(selectedPayment.created_at)}
                  </p>
                </div>
              </div>
              {selectedPayment.proof_image_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Proof Image:</p>
                  <img
                    src={selectedPayment.proof_image_url}
                    alt="Proof"
                    className="max-w-full h-auto border rounded"
                  />
                </div>
              )}
              {selectedPayment.transaction_ref && (
                <div>
                  <p className="text-sm text-gray-600">Transaction Reference:</p>
                  <p className="text-lg">{selectedPayment.transaction_ref}</p>
                </div>
              )}
              {selectedPayment.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="text-lg">{selectedPayment.notes}</p>
                </div>
              )}
              {selectedPayment.status === "PENDING" &&
                selectedPayment.payment_method === "CASH" && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        handleVerifyPayment(selectedPayment.payment_id)
                      }
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Verify Payment
                    </Button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentModuleStaff;
