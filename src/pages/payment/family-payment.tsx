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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

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
  getPaymentById,
  PaymentResponse,
  PaymentMethod,
  PaymentStatus,
  GetPaymentsQuery,
} from "@/apis/payment.api";
import { uploadImage } from "@/apis/media.api";

const PaymentModuleFamily: React.FC = () => {
  const [contracts, setContracts] = useState<ServiceContractResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<ServiceContractResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    PaymentMethod | "TRANSFER" | ""
  >("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentResponse | null>(null);
  const [isPaymentDetailModalOpen, setIsPaymentDetailModalOpen] =
    useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");

  // Filter states
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "ALL">(
    "ALL"
  );
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "ALL">(
    "ALL"
  );
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load payments when filters change
  useEffect(() => {
    if (!loading) {
      loadPayments();
    }
  }, [filterStatus, filterMethod, filterStartDate, filterEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load contracts và payments cùng lúc để có thể check payment status
      const [contractsRes, paymentsRes] = await Promise.all([
        getServiceContractsByFamily(),
        getPaymentsByFamily({}),
      ]);
      setContracts(contractsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const filterParams: any = {};
      if (filterStatus !== "ALL") {
        filterParams.status = filterStatus;
      }
      if (filterMethod !== "ALL") {
        filterParams.payment_method = filterMethod;
      }
      if (filterStartDate) {
        filterParams.start_date = new Date(filterStartDate).toISOString();
      }
      if (filterEndDate) {
        filterParams.end_date = new Date(filterEndDate).toISOString();
      }

      const paymentsRes = await getPaymentsByFamily(filterParams);
      setPayments(paymentsRes.data || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách thanh toán"
      );
    }
  };

  // Kiểm tra xem contract có payment thành công cho chu kỳ hiện tại (next_billing_date) không
  // Logic: Tính period dates dựa trên next_billing_date, nếu có payment SUCCESS cho period đó thì đã thanh toán
  const hasPaidForCurrentPeriod = (
    contract: ServiceContractResponse
  ): boolean => {
    if (!contract.is_active) return false;

    // Tính period dates cho chu kỳ cần thanh toán (dựa trên next_billing_date)
    const periodDates = calculatePeriodDates(contract);
    const periodStart = new Date(periodDates.start);
    const periodEnd = new Date(periodDates.end);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);

    // Kiểm tra xem có payment SUCCESS nào cho period này không
    return payments.some(
      (payment) =>
        payment.contract_id === contract.contract_id &&
        payment.status === "SUCCESS" &&
        new Date(payment.period_start).getTime() === periodStart.getTime() &&
        new Date(payment.period_end).getTime() === periodEnd.getTime()
    );
  };

  // Kiểm tra xem contract có cần thanh toán không
  // Logic: Khi đến next_billing_date (bắt đầu chu kỳ mới) thì có thể thanh toán
  const needsPayment = (contract: ServiceContractResponse): boolean => {
    if (!contract.is_active) return false;

    // Nếu đã thanh toán cho chu kỳ hiện tại thì không cần thanh toán
    if (hasPaidForCurrentPeriod(contract)) return false;

    // Kiểm tra xem đã đến ngày thanh toán chưa (next_billing_date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextBillingDate = new Date(contract.next_billing_date);
    nextBillingDate.setHours(0, 0, 0, 0);

    // Khi today >= next_billing_date thì có thể thanh toán (đã đến hạn)
    return today >= nextBillingDate;
  };

  // Tính toán period dates cho payment (period mà next_billing_date đang nằm trong đó)
  const calculatePeriodDates = (
    contract: ServiceContractResponse
  ): { start: string; end: string } => {
    const nextBilling = new Date(contract.next_billing_date);
    const start = new Date(nextBilling);
    start.setDate(1); // Ngày đầu tháng
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    if (contract.billing_cycle === "MONTHLY") {
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Ngày cuối tháng
    } else {
      end.setFullYear(end.getFullYear() + 1);
      end.setMonth(0);
      end.setDate(0); // Ngày cuối năm
    }
    end.setHours(23, 59, 59, 999);

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
        // Thanh toán VNPay gốc (Real VNPay - redirect đến trang VNPay)
        const periodDates = calculatePeriodDates(selectedContract);
        const response = await createVNPayPayment(
          {
            contract_id: selectedContract.contract_id,
            period_start: periodDates.start,
            period_end: periodDates.end,
          },
          false // false = real VNPay mode
        );

        // Real VNPay trả về: { data: { payment_url, payment_id, order_id } }
        if (response.data && "payment_url" in response.data) {
          console.log("✅ Redirecting to VNPay:", response.data.payment_url);
          // Redirect đến trang VNPay
          window.location.href = response.data.payment_url;
        } else {
          console.error("❌ ERROR: Unexpected response format:", response);
          toast.error("Lỗi: Không nhận được URL thanh toán VNPay");
        }
      } else if (paymentMethod === "TRANSFER") {
        // Chuyển khoản nhanh (Mock mode - xử lý ngay)
        const periodDates = calculatePeriodDates(selectedContract);
        const response = await createVNPayPayment(
          {
            contract_id: selectedContract.contract_id,
            period_start: periodDates.start,
            period_end: periodDates.end,
          },
          true // true = mock mode
        );

        // Mock mode trả về: { data: { status, payment_id, ... } }
        if (response.data && "status" in response.data) {
          console.log("✅ Mock payment result:", response.data.status);
          if (response.data.status === "SUCCESS") {
            toast.success("Thanh toán thành công!");
            // Reload để cập nhật danh sách contract
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            toast.error(response.message || "Thanh toán thất bại");
          }
        } else {
          console.error("❌ ERROR: Unexpected response format:", response);
          toast.error("Lỗi: Không nhận được kết quả thanh toán");
        }
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
      toast.error("Vui lòng chọn ảnh minh chứng");
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

      toast.success("Tải lên ảnh minh chứng thành công");
      setIsUploadModalOpen(false);
      setSelectedPayment(null);
      setProofFile(null);
      setTransactionRef("");
      setNotes("");
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải lên ảnh minh chứng"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy thanh toán này không?"))
      return;

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

  // Format payment number (short version of payment_id)
  const formatPaymentNumber = (paymentId: string): string => {
    return paymentId.substring(0, 8).toUpperCase();
  };

  // Get service name
  const getServiceName = (payment: PaymentResponse): string => {
    if (payment.contract?.institution?.name) {
      return payment.contract.institution.name;
    }
    if (payment.contract?.resident?.full_name) {
      return `Dịch vụ chăm sóc - ${payment.contract.resident.full_name}`;
    }
    return "Dịch vụ chăm sóc";
  };

  // Get paid at date
  const getPaidAt = (payment: PaymentResponse): string | null => {
    if (payment.status === "SUCCESS" && payment.verified_at) {
      return payment.verified_at;
    }
    if (payment.status === "SUCCESS" && payment.created_at) {
      return payment.created_at;
    }
    return null;
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterStatus("ALL");
    setFilterMethod("ALL");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // View payment detail
  const handleViewPaymentDetail = async (paymentId: string) => {
    try {
      const response = await getPaymentById(paymentId);
      setSelectedPayment(response.data);
      setIsPaymentDetailModalOpen(true);
    } catch (error: any) {
      toast.error("Không thể tải chi tiết thanh toán");
    }
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
        return <Badge className="text-lg">Không rõ</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case "VNPAY":
        return <Badge className="text-sm bg-blue-500">VNPay</Badge>;
      case "CASH":
        return <Badge className="text-sm bg-gray-500">Chuyển khoản</Badge>;
      default:
        return <Badge className="text-sm">Không rõ</Badge>;
    }
  };

  // Helper để hiển thị badge cho payment method (bao gồm TRANSFER)
  const getPaymentMethodBadgeWithTransfer = (
    method: PaymentMethod | "TRANSFER"
  ) => {
    if (method === "TRANSFER") {
      return <Badge className="text-sm bg-green-500">Chuyển khoản nhanh</Badge>;
    }
    return getPaymentMethodBadge(method);
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
                        Ngày thanh toán tiếp theo
                      </TableHead>
                      <TableHead className="text-lg">Trạng thái</TableHead>
                      <TableHead className="text-lg">Hành động</TableHead>
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
                          {hasPaidForCurrentPeriod(contract) ? (
                            <Badge
                              variant="default"
                              className="text-lg bg-green-500"
                            >
                              Đã thanh toán
                            </Badge>
                          ) : needsPayment(contract) ? (
                            <Badge variant="destructive" className="text-lg">
                              Cần thanh toán
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-lg">
                              Chưa đến hạn
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {needsPayment(contract) ? (
                            <Button
                              onClick={() => handlePayNow(contract)}
                              className="text-lg bg-[#5985d8] hover:bg-[#466bb3] text-white"
                            >
                              Thanh toán
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {/* Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="filter-status" className="text-sm mb-2 block">
                    Trạng thái
                  </Label>
                  <Select
                    value={filterStatus}
                    onValueChange={(value: string) =>
                      setFilterStatus(value as PaymentStatus | "ALL")
                    }
                  >
                    <SelectTrigger id="filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả</SelectItem>
                      <SelectItem value="PENDING">Đang chờ</SelectItem>
                      <SelectItem value="SUCCESS">Thành công</SelectItem>
                      <SelectItem value="FAILED">Thất bại</SelectItem>
                      <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-method" className="text-sm mb-2 block">
                    Phương thức
                  </Label>
                  <Select
                    value={filterMethod}
                    onValueChange={(value: string) =>
                      setFilterMethod(value as PaymentMethod | "ALL")
                    }
                  >
                    <SelectTrigger id="filter-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả</SelectItem>
                      <SelectItem value="VNPAY">VNPay</SelectItem>
                      <SelectItem value="CASH">Chuyển khoản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="filter-start-date"
                    className="text-sm mb-2 block"
                  >
                    Từ ngày
                  </Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="filter-end-date"
                    className="text-sm mb-2 block"
                  >
                    Đến ngày
                  </Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="w-full"
                  >
                    Đặt lại
                  </Button>
                </div>
              </div>

              {payments.length === 0 ? (
                <p className="text-center text-lg text-gray-500 py-8">
                  Chưa có thanh toán nào
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">Số thanh toán</TableHead>
                      <TableHead className="text-lg">Số tiền</TableHead>
                      <TableHead className="text-lg">Phương thức</TableHead>
                      <TableHead className="text-lg">Trạng thái</TableHead>
                      <TableHead className="text-lg">Ngày đến hạn</TableHead>
                      <TableHead className="text-lg">Ngày thanh toán</TableHead>
                      <TableHead className="text-lg">Tên dịch vụ</TableHead>
                      <TableHead className="text-lg">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell className="text-lg font-mono">
                          {formatPaymentNumber(payment.payment_id)}
                        </TableCell>
                        <TableCell className="text-lg font-bold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(payment.payment_method)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-lg">
                          {formatDate(payment.period_end)}
                        </TableCell>
                        <TableCell className="text-lg">
                          {getPaidAt(payment)
                            ? formatDate(getPaidAt(payment)!)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-lg">
                          {getServiceName(payment)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleViewPaymentDetail(payment.payment_id)
                            }
                            className="text-sm mr-2"
                          >
                            Chi tiết
                          </Button>
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
                                Tải minh chứng
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
                setPaymentMethod(value as PaymentMethod | "TRANSFER")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VNPAY" id="vnpay" />
                <Label htmlFor="vnpay" className="text-lg cursor-pointer">
                  VNPay (Thanh toán trực tuyến qua VNPay)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TRANSFER" id="transfer" />
                <Label htmlFor="transfer" className="text-lg cursor-pointer">
                  Chuyển khoản nhanh
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="text-lg cursor-pointer">
                  Chuyển khoản (Tải minh chứng)
                </Label>
              </div>
            </RadioGroup>
            {(paymentMethod === "CASH" || paymentMethod === "TRANSFER") && (
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
            <DialogTitle className="text-xl">Tải ảnh minh chứng</DialogTitle>
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
              <Label htmlFor="proof-file">Chọn hình ảnh minh chứng</Label>
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
              <Label htmlFor="transaction-ref">Mã giao dịch (tùy chọn)</Label>
              <Input
                id="transaction-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Nhập mã giao dịch nếu có"
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
              {uploading ? "Đang tải lên..." : "Tải minh chứng"}
            </Button>
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
            <DialogTitle className="text-xl">Chi tiết thanh toán</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Số thanh toán:</p>
                  <p className="text-lg font-semibold font-mono">
                    {formatPaymentNumber(selectedPayment.payment_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số tiền:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Phương thức thanh toán:
                  </p>
                  {getPaymentMethodBadge(selectedPayment.payment_method)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái:</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cư dân:</p>
                  <p className="text-lg font-semibold">
                    {selectedPayment.contract?.resident?.full_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tên dịch vụ:</p>
                  <p className="text-lg font-semibold">
                    {getServiceName(selectedPayment)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kỳ thanh toán:</p>
                  <p className="text-lg">
                    {formatDate(selectedPayment.period_start)} -{" "}
                    {formatDate(selectedPayment.period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày đến hạn:</p>
                  <p className="text-lg">
                    {formatDate(selectedPayment.period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày thanh toán:</p>
                  <p className="text-lg">
                    {getPaidAt(selectedPayment)
                      ? formatDate(getPaidAt(selectedPayment)!)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày tạo:</p>
                  <p className="text-lg">
                    {formatDate(selectedPayment.created_at)}
                  </p>
                </div>
              </div>
              {selectedPayment.proof_image_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Ảnh minh chứng:</p>
                  <img
                    src={selectedPayment.proof_image_url}
                    alt="Proof"
                    className="max-w-full h-auto border rounded"
                  />
                </div>
              )}
              {selectedPayment.transaction_ref && (
                <div>
                  <p className="text-sm text-gray-600">Mã giao dịch:</p>
                  <p className="text-lg">{selectedPayment.transaction_ref}</p>
                </div>
              )}
              {selectedPayment.vnpay_transaction_no && (
                <div>
                  <p className="text-sm text-gray-600">Mã giao dịch VNPay:</p>
                  <p className="text-lg">
                    {selectedPayment.vnpay_transaction_no}
                  </p>
                </div>
              )}
              {selectedPayment.notes && (
                <div>
                  <p className="text-sm text-gray-600">Ghi chú:</p>
                  <p className="text-lg">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentModuleFamily;
