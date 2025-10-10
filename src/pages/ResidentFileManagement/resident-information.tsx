import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Progress } from "../components/ui/progress";
import {
    FileText,
    AlertTriangle,
    Camera,
    X,
    LayoutGrid,
    Stethoscope,
    ClipboardList,
    ArrowLeft
} from "lucide-react";

type Medication = {
    id: string;
    name: string;
    dose: string;
    freq: string;
};

type EmergencyContact = {
    name: string;
    relation: string;
    phone: string;
};

type UploadItem = {
    id: string;
    file: File;
    progress: number; // 0..100
    status: "queued" | "uploading" | "done" | "error";
    error?: string;
};

const uid = () => Math.random().toString(36).slice(2);

function ageFromDob(dobStr?: string): string {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return String(Math.max(0, age));
}

function isValidDob(dobStr: string): boolean {
  const dob = new Date(dobStr);
  const now = new Date();
  const minYear = now.getFullYear() - 130; // Ngưỡng tối đa: 130 tuổi
  const maxYear = now.getFullYear(); // Ngưỡng tối thiểu: ≤ ngày hôm nay

  if (isNaN(dob.getTime())) return false; // Không phải ngày hợp lệ
  if (dob > now) return false; // Không thể lớn hơn ngày hiện tại
  if (dob.getFullYear() < minYear || dob.getFullYear() > maxYear) return false; // Giới hạn tuổi hợp lý

  return true;
}

function isValidPhone(phone: string): boolean {
  const regex = /^(0\d{9}|\+84\d{9})$/; // Bắt đầu bằng 0 hoặc +84, theo sau là 9 chữ số
  return regex.test(phone);
}

const ResidentFileInformation: React.FC = () => {
    // Personal
    const [fullName, setFullName] = useState<string>("");
    const [dob, setDob] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const age = useMemo(() => ageFromDob(dob), [dob]);

    // Emergency contact
    const [ec, setEc] = useState<EmergencyContact>({ name: "", relation: "", phone: "" });

    // Health
    const [allergyInput, setAllergyInput] = useState<string>("");
    const [allergies, setAllergies] = useState<string[]>([]);
    const [medications, setMedications] = useState<Medication[]>([{ id: uid(), name: "", dose: "", freq: "" }]);
    const [notes, setNotes] = useState<string>("");

    // Uploads
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [showNotification, setShowNotification] = useState<boolean>(false);

    const requiredOk = Boolean(
      fullName.trim() &&
      dob.trim() &&
      isValidDob(dob) &&
      ec.name.trim() &&
      isValidPhone(ec.phone) &&
      medications.every((m) => m.name.trim() && m.dose.trim() && m.freq.trim())
    );

    // Allergies
    const addAllergy = (): void => {
        const v = allergyInput.trim();
        if (!v) return;
        if (!allergies.includes(v)) setAllergies((prev) => [...prev, v]);
        setAllergyInput("");
    };
    const removeAllergy = (v: string): void => setAllergies((prev) => prev.filter((x) => x !== v));

    // Medications
    const setMed = (id: string, patch: Partial<Medication>): void =>
        setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const addMedicationRow = (): void => setMedications((prev) => [...prev, { id: uid(), name: "", dose: "", freq: "" }]);
    const removeMedicationRow = (id: string): void => setMedications((prev) => prev.filter((m) => m.id !== id));

    // Files
    const onPickFiles = (files: FileList | null): void => {
        if (!files) return;
        const valid: UploadItem[] = Array.from(files)
            .filter((x) => ["application/pdf", "image/jpeg", "image/png"].includes(x.type) && x.size <= 20 * 1024 * 1024)
            .map((f) => ({ id: uid(), file: f, progress: 0, status: "queued" }));
        setUploads((old) => [...old, ...valid]);
    };
    const removeUpload = (id: string): void => setUploads((prev) => prev.filter((u) => u.id !== id));

    const simulateUpload = async (): Promise<void> => {
        if (!uploads.length) return;
        setUploading(true);
        for (const u of uploads) {
            if (u.status !== "queued") continue;
            setUploads(prev => prev.map(x => (x.id === u.id ? { ...x, status: "uploading", progress: 0 } : x)));
            await new Promise<void>((resolve) => {
                const iv = setInterval(() => {
                    setUploads(prev => prev.map(x => {
                        if (x.id !== u.id) return x;
                        const inc = Math.floor(10 + Math.random() * 20);
                        const next = Math.min(100, x.progress + inc);
                        return { ...x, progress: next, status: next >= 100 ? "done" : "uploading" };
                    }));
                }, 250);
                setTimeout(() => {
                    clearInterval(iv);
                    setUploads(prev => prev.map(x => (x.id === u.id ? { ...x, progress: 100, status: "done" } : x)));
                    resolve();
                }, 1800 + Math.random() * 1200);
            });
        }
        setUploading(false);
    };

    // Submit (prototype)
    const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      if (!requiredOk) {
        alert("Please fill in all required fields.");
        return;
      }
      const payload = {
        full_name: fullName,
        dob,
        age,
        gender,
        emergency_contact: ec,
        allergies,
        medications: medications.filter((m) => (m.name + m.dose + m.freq).trim() !== "").map(({ id, ...rest }) => rest),
        notes,
        documents: uploads.filter((u) => u.status === "done").map((u) => ({ name: u.file.name, size: u.file.size })),
      };
      console.log(payload);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000); // Thông báo sẽ biến mất sau 3 giây
    };

    useEffect(() => {
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;
        const prevHtmlMargin = document.documentElement.style.margin;
        const prevBodyMargin = document.body.style.margin;
        const prevHtmlPadding = document.documentElement.style.padding;
        const prevBodyPadding = document.body.style.padding;

        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.documentElement.style.margin = "0";
        document.body.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.padding = "0";

        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
            document.documentElement.style.margin = prevHtmlMargin;
            document.body.style.margin = prevBodyMargin;
            document.documentElement.style.padding = prevHtmlPadding;
            document.body.style.padding = prevBodyPadding;
        };
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden">
            <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)]" />

            <div className="relative h-full overflow-y-auto pt-4 md:pt-8 lg:pt-0">
                <div className="flex min-h-full gap-4 lg:gap-6">
                    <aside className="w-[240px] shrink-0">
                        <div className="h-full flex flex-col items-start">
                            <div className="mt-4 w-full rounded-2xl bg-white/90 backdrop-blur-md ring-1 ring-black/5 shadow-md flex flex-col py-4 gap-5">
                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "Medical" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("Medical")}
                                >
                                    Medical & Health Record Management
                                </button>

                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "DailyLife" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("DailyLife")}
                                >
                                    Daily Life & Nutrition Management
                                </button>

                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "Incident" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("Incident")}
                                >
                                    Incident & Emergency Handling
                                </button>

                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "Room" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("Room")}
                                >
                                    Room & Facility Management
                                </button>

                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "Communication" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("Communication")}
                                >
                                    Communication & Reporting
                                </button>

                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "Visitation" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("Visitation")}
                                >
                                    Visitation & Access Control
                                </button>

                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 font-semibold ${
                                        activeButton === "Payments" ? "bg-[#5985D8] text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setActiveButton("Payments")}
                                >
                                    Payments & Additional Services
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1 pr-6">
                        <section className="w-full rounded-3xl bg-white/95 ring-1 ring-black/5 shadow-md overflow-hidden">
                            <header className="px-6 py-7 border-b border-gray-200">
                                <div className="relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600 hidden md:block">
                                        <span className="font-medium">Audit:</span> staff & timestamp will be recorded on create.
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-xl font-semibold text-gray-900">Resident Information</h1>
                                        <p className="text-sm text-gray-500">August 12, 2021</p>
                                    </div>
                                </div>
                            </header>

                            <div className="overflow-auto px-6 py-6">
                                <div className="max-w-6xl mx-0">
                                    <header className="mb-6">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-slate-900">Create Resident</h2>
                                            <p className="text-sm text-slate-500">Form for personal info & initial health status</p>
                                        </div>
                                        <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600 md:hidden text-center">
                                            <span className="font-medium">Audit:</span> staff & timestamp will be recorded on create.
                                        </div>
                                    </header>

                                    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                        <div className="lg:col-span-2">
                                            <Card className="rounded-2xl">
                                                <CardHeader>
                                                    <CardTitle>Personal Information</CardTitle>
                                                    <CardDescription>Required fields are marked with *</CardDescription>
                                                </CardHeader>
                                                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div className="flex flex-col gap-1">
                                                        <Label>Full name *</Label>
                                                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label>Date of Birth *</Label>
                                                        <Input
                                                            type="date"
                                                            value={dob}
                                                            onChange={(e) => {
                                                              const value = e.target.value;
                                                              if (isValidDob(value)) {
                                                                setDob(value);
                                                              } else {
                                                                alert("Invalid Date of Birth. Please enter a valid date.");
                                                              }
                                                            }}
                                                            placeholder="YYYY-MM-DD"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label>Age</Label>
                                                        <Input value={age} readOnly className="bg-slate-50" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label>Gender</Label>
                                                        <Select value={gender} onValueChange={(v) => setGender(v)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="— Select —" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <Card className="rounded-2xl">
                                                <CardHeader>
                                                    <CardTitle>Emergency Contact *</CardTitle>
                                                </CardHeader>
                                                <CardContent className="grid grid-cols-1 gap-4">
                                                    <div className="flex flex-col gap-1">
                                                      <Label>Name</Label>
                                                      <Input value={ec.name} onChange={(e) => setEc({ ...ec, name: e.target.value })} />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                      <Label>Relationship</Label>
                                                      <Input value={ec.relation} onChange={(e) => setEc({ ...ec, relation: e.target.value })} placeholder="Son/Daughter…" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                      <Label>Phone *</Label>
                                                      <Input
                                                        value={ec.phone}
                                                        onChange={(e) => {
                                                          const value = e.target.value;
                                                          if (isValidPhone(value)) {
                                                            setEc({ ...ec, phone: value });
                                                          } else {
                                                            alert("Invalid phone number. Please enter a valid phone number.");
                                                          }
                                                        }}
                                                        placeholder="+84xxxxxxxxx or 0xxxxxxxxx"
                                                      />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="lg:col-span-2">
                                            <Card className="rounded-2xl">
                                                <CardHeader>
                                                    <CardTitle>Initial Health Status</CardTitle>
                                                    <CardDescription>Allergies & current medications</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div>
                                                        <Label>Allergies</Label>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {allergies.map((a) => (
                                                                <Badge key={a} variant="secondary" className="gap-1">
                                                                    {a}
                                                                    <button type="button" aria-label={`Remove ${a}`} onClick={() => removeAllergy(a)} className="ml-1 inline-flex size-4 items-center justify-center rounded hover:bg-slate-200">
                                                                        <X className="size-3" />
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Input
                                                                value={allergyInput}
                                                                onChange={(e) => setAllergyInput(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        addAllergy();
                                                                    }
                                                                }}
                                                                placeholder="Enter allergy and press Enter"
                                                            />
                                                            <Button type="button" onClick={addAllergy}>Add</Button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <Label>Current medications</Label>
                                                            <Button type="button" variant="secondary" onClick={addMedicationRow}>
                                                                + Add row
                                                            </Button>
                                                        </div>
                                                        <div className="overflow-hidden rounded-xl border">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Medication Name</TableHead>
                                                                        <TableHead>Dosage</TableHead>
                                                                        <TableHead>Frequency</TableHead>
                                                                        <TableHead className="w-12"></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {medications.map((m) => (
                                                                        <TableRow key={m.id}>
                                                                            <TableCell>
                                                                                <Input
                                                                                    value={m.name}
                                                                                    onChange={(e) => setMed(m.id, { name: e.target.value })}
                                                                                    placeholder="Amlodipine"
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Input
                                                                                    value={m.dose}
                                                                                    onChange={(e) => setMed(m.id, { dose: e.target.value })}
                                                                                    placeholder="5mg"
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Input
                                                                                    value={m.freq}
                                                                                    onChange={(e) => setMed(m.id, { freq: e.target.value })}
                                                                                    placeholder="Once daily"
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => removeMedicationRow(m.id)}
                                                                                >
                                                                                    <X className="size-4" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label>Additional notes</Label>
                                                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter any additional health notes…" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <Card className="rounded-2xl">
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-bold text-gray-900">Upload Documents</CardTitle>
                                                    <CardDescription className="text-sm text-gray-700 hover:text-gray-900">PDF, JPG, PNG up to 20MB each</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".pdf,image/jpeg,image/png"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            onPickFiles(e.target.files);
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        className="w-full mb-3 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition duration-300"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploading}
                                                    >
                                                        Select files
                                                    </Button>
                                                    <div className="space-y-2">
                                                        {uploads.map((u) => (
                                                            <div key={u.id} className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                                                                <div className="flex-1 truncate font-medium text-gray-800">{u.file.name}</div>
                                                                <div className="w-24">
                                                                    <Progress value={u.progress} />
                                                                </div>
                                                                <Button type="button" size="icon" variant="ghost" onClick={() => removeUpload(u.id)}>
                                                                    <X className="size-4 text-red-500 hover:text-red-600" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        className="w-full mt-3 bg-[#5985D8] text-white font-semibold hover:bg-[#4a74c1]"
                                                        onClick={simulateUpload}
                                                        disabled={uploading || uploads.length === 0}
                                                    >
                                                        {uploading ? "Uploading..." : "Upload"}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="lg:col-span-3 flex justify-end gap-4">
                                            <Button
                                                type="button"
                                                className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-md"
                                                onClick={() => console.log("Cancel clicked")}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-blue-500 text-white font-semibold hover:bg-blue-600 px-4 py-2 rounded-md"
                                                disabled={!requiredOk || uploading}
                                            >
                                                Save & Create
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResidentFileInformation;