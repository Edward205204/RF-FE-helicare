import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { getPaymentById, PaymentResponse } from "@/apis/payment.api";
import { toast } from "react-toastify";
import path from "@/constants/path";

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    const statusParam = searchParams.get("status");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setStatus("failed");
      setLoading(false);
      return;
    }

    if (paymentId && statusParam) {
      setStatus(statusParam === "success" ? "success" : "failed");
      loadPayment(paymentId);
    } else {
      setError("Thông tin thanh toán không hợp lệ");
      setStatus("failed");
      setLoading(false);
    }
  }, [searchParams]);

  const loadPayment = async (paymentId: string) => {
    try {
      const response = await getPaymentById(paymentId);
      setPayment(response.data);
    } catch (error: any) {
      toast.error("Không thể tải thông tin thanh toán");
      setError("Không thể tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-lg">Đang xử lý...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Kết quả thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "success" && payment ? (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  Thanh toán thành công!
                </h2>
                <p className="text-gray-600">
                  Giao dịch của bạn đã được xử lý thành công.
                </p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã thanh toán:</span>
                  <span className="font-semibold">{payment.payment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cư dân:</span>
                  <span className="font-semibold">
                    {payment.contract?.resident?.full_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <Badge className="bg-blue-500">
                    {payment.payment_method === "VNPAY"
                      ? "VNPay"
                      : "Chuyển khoản"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kỳ thanh toán:</span>
                  <span className="font-semibold">
                    {formatDate(payment.period_start)} -{" "}
                    {formatDate(payment.period_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold">
                    {formatDate(payment.created_at)}
                  </span>
                </div>
                {payment.vnpay_transaction_no && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch VNPay:</span>
                    <span className="font-semibold">
                      {payment.vnpay_transaction_no}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4 pt-4">
                <Button
                  onClick={() => navigate(path.familyBillingAndPayment)}
                  className="bg-[#689bdf] hover:bg-[#5183c9] text-white"
                >
                  Xem lịch sử thanh toán
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(path.familyHome)}
                >
                  Về trang chủ
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">
                  Thanh toán thất bại
                </h2>
                <p className="text-gray-600 mb-4">
                  {error ||
                    "Giao dịch của bạn không thể được xử lý. Vui lòng thử lại."}
                </p>
                {payment && (
                  <div className="border-t pt-4 mt-4 space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã thanh toán:</span>
                      <span className="font-semibold">
                        {payment.payment_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-bold">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4 pt-4">
                <Button
                  onClick={() => navigate(path.familyBillingAndPayment)}
                  className="bg-[#689bdf] hover:bg-[#5183c9] text-white"
                >
                  Thử lại
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(path.familyHome)}
                >
                  Về trang chủ
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentResult;
