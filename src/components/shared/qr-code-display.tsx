import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, QrCode } from "lucide-react";
import { toast } from "react-toastify";

interface QRCodeDisplayProps {
  qrCodeData: string;
  expiresAt: string;
  onClose?: () => void;
}

export function QRCodeDisplay({
  qrCodeData,
  expiresAt,
  onClose,
}: QRCodeDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(qrCodeData);
    toast.success("Đã sao chép QR Code");
  };

  const handleDownload = () => {
    // Create a simple text file with QR code data
    const blob = new Blob([qrCodeData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-code-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống QR Code");
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="mb-4">
          <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            QR Code Check-in
          </h3>
          <p className="text-sm text-gray-600">
            Sử dụng mã này để check-in khi đến thăm viếng
          </p>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-xs font-mono break-all text-gray-700">
            {qrCodeData}
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          <p>
            <strong>Hết hạn:</strong> {formatExpiryDate(expiresAt)}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Sao chép
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Tải xuống
          </Button>
        </div>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4 w-full">
            Đóng
          </Button>
        )}
      </div>
    </Card>
  );
}
