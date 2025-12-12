import React, { useState } from "react";
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
  const [imageLoaded, setImageLoaded] = useState(false);
  // Generate QR code image URL using an online API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    qrCodeData
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCodeData);
    toast.success("QR Code copied");
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-code-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("QR Code downloaded");
    } catch (error) {
      console.error("Failed to download QR code:", error);
      toast.error("Cannot download QR Code");
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US");
  };

  return (
    <Card className="p-6 max-w-md mx-auto border-none shadow-sm bg-white">
      <div className="text-center">
        <div className="mb-4">
          <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            QR Code Check-in
          </h3>
          <p className="text-sm text-gray-600">
            Use this code to check-in when visiting
          </p>
        </div>

        {/* QR Code Image */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-none shadow-sm">
          <img
            src={qrCodeImageUrl}
            alt="QR Code"
            className="w-full max-w-[300px] mx-auto"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              toast.error("Cannot load QR Code");
            }}
          />
          {!imageLoaded && (
            <div className="text-xs text-gray-500 mt-2">Loading QR Code...</div>
          )}
        </div>

        {/* QR Code Data (for backup) */}
        {/* <div className="mb-4 p-4 bg-gray-50 rounded-lg border-none shadow-sm">
          <div className="text-xs font-mono break-all text-gray-700">
            {qrCodeData}
          </div>
        </div> */}

        <div className="mb-4 text-sm text-gray-600">
          <p>
            <strong>Expires:</strong> {formatExpiryDate(expiresAt)}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2 border-none shadow-sm cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadImage}
            className="flex items-center gap-2 border-none shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="mt-4 w-full border-none shadow-sm cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
          >
            Close
          </Button>
        )}
      </div>
    </Card>
  );
}
