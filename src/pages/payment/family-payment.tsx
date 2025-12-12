import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { RadioGroup, RadioGroupItem } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { toast } from "react-toastify";
import {
  getServiceContractsByFamily,
  ServiceContractResponse,
} from "@/apis/service-contract.api";
import {
  getPaymentsByFamily,
  createPayment,
  createVNPayPayment,
  uploadProof,
  cancelPayment,
  PaymentResponse,
  PaymentMethod,
  PaymentStatus,
} from "@/apis/payment.api";
import { uploadImage } from "@/apis/media.api";

const PaymentModuleFamily: React.FC = () => {
  const [contracts, setContracts] = useState<ServiceContractResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<ServiceContractResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsRes, paymentsRes] = await Promise.all([
        getServiceContractsByFamily(),
        getPaymentsByFamily(),
      ]);
      setContracts(contractsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra xem contract có cần thanh toán không
  const needsPayment = (contract: ServiceContractResponse): boolean => {
    const today = new Date();
    const nextBillingDate = new Date(contract.next_billing_date);
    return today >= nextBillingDate && contract.is_active;
  };

  // Tính toán period dates cho payment
  const calculatePeriodDates = (
    contract: ServiceContractResponse
  ): { start: string; end: string } => {
    const nextBilling = new Date(contract.next_billing_date);
    const start = new Date(nextBilling);
    start.setDate(1); // Ngày đầu tháng

    const end = new Date(start);
    if (contract.billing_cycle === "MONTHLY") {
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Ngày cuối tháng
    } else {
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(0);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const handlePayNow = (contract: ServiceContractResponse) => {
    setSelectedContract(contract);
    setIsPaymentModalOpen(true);
    setPaymentMethod("");
  };

  const handlePaymentSubmit = async () => {
    if (!selectedContract || !paymentMethod) return;

    try {
      if (paymentMethod === "VNPAY") {
        // Thanh toán VNPay
        const periodDates = calculatePeriodDates(selectedContract);
        const response = await createVNPayPayment({
          contract_id: selectedContract.contract_id,
          period_start: periodDates.start,
          period_end: periodDates.end,
        });

        // Redirect đến VNPay
        window.location.href = response.data.payment_url;
      } else if (paymentMethod === "CASH") {
        // Tạo payment với CASH (cần upload proof)
        const periodDates = calculatePeriodDates(selectedContract);
        const response = await createPayment({
          contract_id: selectedContract.contract_id,
          payment_method: "CASH",
          amount: selectedContract.amount,
          period_start: periodDates.start,
          period_end: periodDates.end,
          notes: notes || undefined,
        });

        // Mở modal upload proof
        setSelectedPayment(response.data);
        setIsPaymentModalOpen(false);
        setIsUploadModalOpen(true);
        setNotes("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create payment");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedPayment || !proofFile) {
      toast.error("Please select a proof image");
      return;
    }

    try {
      setUploading(true);
      // Upload ảnh
      const uploadResult = await uploadImage([proofFile]);
      if (!uploadResult || uploadResult.length === 0) {
        throw new Error("Upload ảnh thất bại");
      }

      // Upload proof
      await uploadProof(selectedPayment.payment_id, {
        proof_image_url: uploadResult[0].url,
        transaction_ref: transactionRef || undefined,
        notes: notes || undefined,
      });

      toast.success("Proof image uploaded successfully");
      setIsUploadModalOpen(false);
      setSelectedPayment(null);
      setProofFile(null);
      setTransactionRef("");
      setNotes("");
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to upload proof image"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this payment?")) return;

    try {
      await cancelPayment(paymentId);
      toast.success("Payment cancelled");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel payment");
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

  const getStatusBadge = (status: PaymentStatus) => {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Service Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contracts">Service Contracts</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="contracts" className="space-y-4">
              {contracts.length === 0 ? (
                <p className="text-center text-lg text-gray-500 py-8">
                  No service contracts yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">Resident</TableHead>
                      <TableHead className="text-lg">Billing Cycle</TableHead>
                      <TableHead className="text-lg">Amount</TableHead>
                      <TableHead className="text-lg">
                        Next Payment Date
                      </TableHead>
                      <TableHead className="text-lg">Status</TableHead>
                      <TableHead className="text-lg">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.contract_id}>
                        <TableCell className="text-lg">
                          {contract.resident?.full_name || "N/A"}
                        </TableCell>
                        <TableCell className="text-lg">
                          {contract.billing_cycle === "MONTHLY"
                            ? "Monthly"
                            : "Yearly"}
                        </TableCell>
                        <TableCell className="text-lg font-bold">
                          {formatCurrency(contract.amount)}
                        </TableCell>
                        <TableCell className="text-lg">
                          {formatDate(contract.next_billing_date)}
                        </TableCell>
                        <TableCell>
                          {needsPayment(contract) ? (
                            <Badge variant="destructive" className="text-lg">
                              Payment Required
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="text-lg bg-green-500"
                            >
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {needsPayment(contract) && (
                            <Button
                              onClick={() => handlePayNow(contract)}
                              className="text-lg"
                            >
                              Pay Now
                            </Button>
                          )}
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
                  Chưa có thanh toán nào
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">Resident</TableHead>
                      <TableHead className="text-lg">Amount</TableHead>
                      <TableHead className="text-lg">Payment Method</TableHead>
                      <TableHead className="text-lg">Payment Period</TableHead>
                      <TableHead className="text-lg">Status</TableHead>
                      <TableHead className="text-lg">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell className="text-lg">
                          {payment.contract?.resident?.full_name || "N/A"}
                        </TableCell>
                        <TableCell className="text-lg font-bold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(payment.payment_method)}
                        </TableCell>
                        <TableCell className="text-lg">
                          {formatDate(payment.period_start)} -{" "}
                          {formatDate(payment.period_end)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.status === "PENDING" &&
                            payment.payment_method === "CASH" &&
                            !payment.proof_image_url && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setIsUploadModalOpen(true);
                                }}
                                className="text-sm"
                              >
                                Upload Proof
                              </Button>
                            )}
                          {payment.status === "PENDING" && (
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleCancelPayment(payment.payment_id)
                              }
                              className="text-sm ml-2"
                            >
                              Cancel
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

      {/* Payment Method Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Select Payment Method
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContract && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Resident:</p>
                  <p className="text-lg font-semibold">
                    {selectedContract.resident?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedContract.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Period:</p>
                  <p className="text-lg">
                    {formatDate(calculatePeriodDates(selectedContract).start)} -{" "}
                    {formatDate(calculatePeriodDates(selectedContract).end)}
                  </p>
                </div>
              </>
            )}
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VNPAY" id="vnpay" />
                <Label htmlFor="vnpay" className="text-lg cursor-pointer">
                  VNPay (Online Payment)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="text-lg cursor-pointer">
                  Bank Transfer (Upload Proof)
                </Label>
              </div>
            </RadioGroup>
            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes if any"
                />
              </div>
            )}
            <Button
              onClick={handlePaymentSubmit}
              disabled={!paymentMethod}
              className="w-full text-lg"
            >
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Proof Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Proof Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div>
                <p className="text-sm text-gray-600">Amount:</p>
                <p className="text-lg font-bold">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="proof-file">Select Bank Transfer Proof Image</Label>
              <Input
                id="proof-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2"
              />
              {proofFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {proofFile.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="transaction-ref">
                Transaction Reference (optional)
              </Label>
              <Input
                id="transaction-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter transaction reference if any"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="upload-notes">Notes (optional)</Label>
              <Textarea
                id="upload-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes if any"
              />
            </div>
            <Button
              onClick={handleUploadProof}
              disabled={!proofFile || uploading}
              className="w-full text-lg"
            >
              {uploading ? "Uploading..." : "Upload Proof"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentModuleFamily;
