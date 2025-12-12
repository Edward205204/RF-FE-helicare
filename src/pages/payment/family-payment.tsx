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
      toast.error(error.response?.data?.message || "Không thể tải dữ liệu");
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
      toast.error(error.response?.data?.message || "Không thể tạo thanh toán");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedPayment || !proofFile) {
      toast.error("Vui lòng chọn ảnh chứng từ");
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

      toast.success("Đã upload ảnh chứng từ thành công");
      setIsUploadModalOpen(false);
      setSelectedPayment(null);
      setProofFile(null);
      setTransactionRef("");
      setNotes("");
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể upload ảnh chứng từ"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!window.confirm("Bạn có chắc muốn hủy thanh toán này?")) return;

    try {
      await cancelPayment(paymentId);
      toast.success("Đã hủy thanh toán");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể hủy thanh toán");
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
            Thành công
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary" className="text-lg bg-yellow-500">
            Đang chờ
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="text-lg">
            Thất bại
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="outline" className="text-lg">
            Đã hoàn tiền
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
        return <Badge className="text-sm bg-gray-500">Chuyển khoản</Badge>;
      default:
        return <Badge className="text-sm">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-lg">Đang tải dữ liệu...</p>
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
            Thanh toán dịch vụ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contracts">Hợp đồng dịch vụ</TabsTrigger>
              <TabsTrigger value="payments">Lịch sử thanh toán</TabsTrigger>
            </TabsList>

            <TabsContent value="contracts" className="space-y-4">
              {contracts.length === 0 ? (
                <p className="text-center text-lg text-gray-500 py-8">
                  Chưa có hợp đồng dịch vụ nào
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">Cư dân</TableHead>
                      <TableHead className="text-lg">Chu kỳ</TableHead>
                      <TableHead className="text-lg">Số tiền</TableHead>
                      <TableHead className="text-lg">
                        Ngày thanh toán tiếp
                      </TableHead>
                      <TableHead className="text-lg">Trạng thái</TableHead>
                      <TableHead className="text-lg">Thao tác</TableHead>
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
                            ? "Hàng tháng"
                            : "Hàng năm"}
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
                              Cần thanh toán
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="text-lg bg-green-500"
                            >
                              Đã thanh toán
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {needsPayment(contract) && (
                            <Button
                              onClick={() => handlePayNow(contract)}
                              className="text-lg"
                            >
                              Thanh toán ngay
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
                      <TableHead className="text-lg">Cư dân</TableHead>
                      <TableHead className="text-lg">Số tiền</TableHead>
                      <TableHead className="text-lg">Phương thức</TableHead>
                      <TableHead className="text-lg">Kỳ thanh toán</TableHead>
                      <TableHead className="text-lg">Trạng thái</TableHead>
                      <TableHead className="text-lg">Thao tác</TableHead>
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
                                Upload chứng từ
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
                              Hủy
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
              Chọn phương thức thanh toán
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContract && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Cư dân:</p>
                  <p className="text-lg font-semibold">
                    {selectedContract.resident?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số tiền:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedContract.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kỳ thanh toán:</p>
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
                  VNPay (Thanh toán online)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="text-lg cursor-pointer">
                  Chuyển khoản (Upload chứng từ)
                </Label>
              </div>
            </RadioGroup>
            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú nếu có"
                />
              </div>
            )}
            <Button
              onClick={handlePaymentSubmit}
              disabled={!paymentMethod}
              className="w-full text-lg"
            >
              Xác nhận thanh toán
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Proof Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload ảnh chứng từ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div>
                <p className="text-sm text-gray-600">Số tiền:</p>
                <p className="text-lg font-bold">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="proof-file">Chọn ảnh chứng từ chuyển khoản</Label>
              <Input
                id="proof-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2"
              />
              {proofFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Đã chọn: {proofFile.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="transaction-ref">
                Mã tham chiếu giao dịch (tùy chọn)
              </Label>
              <Input
                id="transaction-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Nhập mã tham chiếu nếu có"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="upload-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="upload-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú nếu có"
              />
            </div>
            <Button
              onClick={handleUploadProof}
              disabled={!proofFile || uploading}
              className="w-full text-lg"
            >
              {uploading ? "Đang upload..." : "Upload chứng từ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentModuleFamily;
