import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
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
import { Label } from "@/components/ui";

// Mock data for invoices
const mockInvoices = [
  {
    id: 1,
    serviceName: "Home Care Service",
    description: "Weekly home care visit",
    amount: 500000, // VND
    vat: 50000,
    total: 550000,
    status: "unpaid" as "paid" | "unpaid" | "failed",
  },
  {
    id: 2,
    serviceName: "Medical Checkup",
    description: "Monthly health check",
    amount: 300000,
    vat: 30000,
    total: 330000,
    status: "paid" as "paid" | "unpaid" | "failed",
  },
  {
    id: 3,
    serviceName: "Emergency Assistance",
    description: "One-time emergency call",
    amount: 200000,
    vat: 20000,
    total: 220000,
    status: "failed" as "paid" | "unpaid" | "failed",
  },
];

const PaymentModuleFamily: React.FC = () => {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<
    (typeof mockInvoices)[0] | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handlePayNow = (invoice: (typeof mockInvoices)[0]) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedInvoice || !paymentMethod) return;

    // Mock API call for payment
    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? { ...inv, status: "paid" as const }
            : inv
        )
      );
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      setPaymentMethod("");
      setSelectedInvoice(null);
    }, 1000); // Simulate delay
  };

  const handleDownloadPDF = (invoice: (typeof mockInvoices)[0]) => {
    // Mock download
    alert(`Downloading PDF for invoice ${invoice.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="text-lg">
            Paid
          </Badge>
        );
      case "unpaid":
        return (
          <Badge variant="secondary" className="text-lg">
            Unpaid
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-lg">
            Failed
          </Badge>
        );
      default:
        return <Badge className="text-lg">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Payment Module - Family Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg">Service Name</TableHead>
                <TableHead className="text-lg">Description</TableHead>
                <TableHead className="text-lg">Amount (VND)</TableHead>
                <TableHead className="text-lg">VAT (VND)</TableHead>
                <TableHead className="text-lg">Total (VND)</TableHead>
                <TableHead className="text-lg">Status</TableHead>
                <TableHead className="text-lg">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="text-lg">
                    {invoice.serviceName}
                  </TableCell>
                  <TableCell className="text-lg">
                    {invoice.description}
                  </TableCell>
                  <TableCell className="text-lg">
                    {invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-lg">
                    {invoice.vat.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-lg font-bold">
                    {invoice.total.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="space-x-2">
                    {invoice.status === "unpaid" && (
                      <Button
                        onClick={() => handlePayNow(invoice)}
                        className="text-lg"
                      >
                        Pay Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPDF(invoice)}
                      className="text-lg"
                    >
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-lg">Invoice: {selectedInvoice?.serviceName}</p>
            <p className="text-lg">
              Total: {selectedInvoice?.total.toLocaleString()} VND
            </p>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="momo" id="momo" />
                <Label htmlFor="momo" className="text-lg">
                  MoMo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zalopay" id="zalopay" />
                <Label htmlFor="zalopay" className="text-lg">
                  ZaloPay
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="text-lg">
                  PayPal
                </Label>
              </div>
            </RadioGroup>
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

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Payment Successful</DialogTitle>
          </DialogHeader>
          <p className="text-lg">
            Your payment has been processed successfully.
          </p>
          <Button
            onClick={() => setIsSuccessModalOpen(false)}
            className="w-full text-lg"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentModuleFamily;
