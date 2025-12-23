import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui";
import {
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { X, CalendarIcon, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createResident } from "@/apis/resident.api";
import { checkUserByEmail, createFamilyAccount } from "@/apis/auth.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import { getAllergenTags } from "@/apis/menu-planner.api";
import {
  getMedications,
  type Medication as ApiMedication,
} from "@/apis/medication-careplan.api";
import { toast } from "react-toastify";
import path from "@/constants/path";

type Medication = {
  id: string;
  name: string;
  dose: string;
  freq: string;
};

type FamilyContactInfo = {
  email: string;
  user_id?: string;
  full_name?: string;
  phone?: string;
  verified?: boolean;
};

type UploadItem = {
  id: string;
  file: File;
  progress: number; // 0..100
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

const uid = () => Math.random().toString(36).slice(2);

function isValidDob(dobStr: string): boolean {
  const dob = new Date(dobStr);
  const now = new Date();
  const minYear = now.getFullYear() - 130;
  const maxYear = now.getFullYear(); //≤ ngày hôm nay

  if (isNaN(dob.getTime())) return false; // Không phải ngày hợp lệ
  if (dob > now) return false; // Không thể lớn hơn ngày hiện tại
  if (dob.getFullYear() < minYear || dob.getFullYear() > maxYear) return false; // Giới hạn tuổi

  return true;
}

function isValidPhone(phone: string): boolean {
  const regex = /^(0\d{9}|\+84\d{9})$/; // Bắt đầu bằng 0 hoặc +84, theo sau là 9 chữ số
  return regex.test(phone);
}

const ResidentInformation: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Allergies và Medications từ API
  const [allergenList, setAllergenList] = useState<string[]>([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  const [medicationList, setMedicationList] = useState<ApiMedication[]>([]);
  const [loadingMedications, setLoadingMedications] = useState(false);

  const [familyContact, setFamilyContact] = useState<FamilyContactInfo>({
    email: "",
    verified: false,
  });
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    full_name: "",
    email: "",
  });

  // Fetch rooms (chỉ lấy phòng còn trống)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const response = await getRooms(); // Lấy từ token, không cần institutionId
        const allRooms = response.rooms || [];
        // Chỉ hiển thị phòng còn trống
        const availableRooms = allRooms.filter(
          (room: RoomResponse) => room.current_occupancy < room.capacity
        );
        setRooms(availableRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Không tải được danh sách phòng");
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // Fetch allergens từ API
  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        setLoadingAllergens(true);
        const response = await getAllergenTags();
        setAllergenList(response.data || []);
      } catch (error) {
        console.error("Error fetching allergens:", error);
        toast.error("Không tải được danh sách dị ứng");
      } finally {
        setLoadingAllergens(false);
      }
    };
    fetchAllergens();
  }, []);

  // Fetch medications từ API
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoadingMedications(true);
        const response = await getMedications({ is_active: true });
        setMedicationList(response.data || []);
      } catch (error) {
        console.error("Error fetching medications:", error);
        toast.error("Không tải được danh sách thuốc");
      } finally {
        setLoadingMedications(false);
      }
    };
    fetchMedications();
  }, []);

  // Comorbidities
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [comorbiditiesInput, setComorbiditiesInput] = useState<string>("");
  const addComorbidity = (v?: string): void => {
    const val = (v ?? comorbiditiesInput).trim();
    if (!val) return;
    setComorbidities((prev) => {
      const updated = prev.includes(val) ? prev : [...prev, val];
      console.log("Updated comorbidities:", updated);
      return updated;
    });
    // if called without an explicit value, it came from the input so clear it
    if (v === undefined) setComorbiditiesInput("");
  };
  const removeComorbidity = (v: string): void =>
    setComorbidities((prev) => prev.filter((x) => x !== v));

  // Health
  const [allergyInput, setAllergyInput] = useState<string>("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<Medication[]>([
    { id: uid(), name: "", dose: "", freq: "" },
  ]);
  const [notes, setNotes] = useState<string>("");

  // Uploads
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // const [activeButton, setActiveButton] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [generatedAccount, setGeneratedAccount] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  // Current date string used in the header
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US");
  }, []);

  // Check email handler
  const handleCheckEmail = async () => {
    const email = familyContact.email.trim();
    if (!email) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }

    try {
      setCheckingEmail(true);
      const response = await checkUserByEmail(email);
      const userData = response.data;

      // Accept family user even without complete profile
      const fullName = userData.familyProfile?.full_name || email;
      const phone = userData.familyProfile?.phone;

      setFamilyContact({
        email,
        user_id: userData.user_id,
        full_name: fullName,
        phone: phone,
        verified: true,
      });

      toast.success(`Tìm thấy thành viên gia đình: ${fullName}`, {
        autoClose: 2000,
      });
    } catch (error: any) {
      console.error("Error checking email:", error);
      setFamilyContact({
        email,
        verified: false,
      });
      // Nếu không tìm thấy, hiển thị thông báo và cho phép tạo tài khoản
      toast.error(
        error.response?.data?.message ||
          "Không tìm thấy thành viên gia đình hoặc chưa đăng ký"
      );
      // Không reset verified để có thể hiển thị nút tạo tài khoản
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleCreateFamilyAccount = async () => {
    const email = createAccountForm.email.trim();
    const fullName = createAccountForm.full_name.trim();

    if (!email) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }

    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    try {
      setCreatingAccount(true);
      const response = await createFamilyAccount({
        email,
        full_name: fullName,
      });

      toast.success(
        "Tài khoản đã được tạo thành công! Email kích hoạt đã được gửi. Bạn có thể tiếp tục tạo cư dân và về nhà kích hoạt tài khoản sau.",
        { autoClose: 5000 }
      );

      // Đóng popup và cập nhật familyContact để form có thể submit
      setShowCreateAccountDialog(false);
      setCreateAccountForm({ full_name: "", email: "" });
      setFamilyContact({
        email,
        user_id: response.data?.user_id, // Lưu user_id để có thể submit form
        full_name: fullName,
        verified: false, // Chưa verify email nhưng đã có tài khoản
      });
    } catch (error: any) {
      console.error("Error creating family account:", error);
      toast.error(
        error.response?.data?.message || "Không thể tạo tài khoản gia đình"
      );
    } finally {
      setCreatingAccount(false);
    }
  };

  const requiredOk = Boolean(
    fullName.trim() &&
      dob.trim() &&
      isValidDob(dob) &&
      gender &&
      familyContact.email.trim() &&
      (familyContact.verified || familyContact.user_id) // Cho phép submit nếu đã verified hoặc đã có user_id (đã tạo tài khoản)
  );

  // Allergies
  const addAllergy = (value?: string): void => {
    const v = (value || allergyInput).trim();
    if (!v) return;
    if (!allergies.includes(v)) setAllergies((prev) => [...prev, v]);
    setAllergyInput("");
  };
  const removeAllergy = (v: string): void =>
    setAllergies((prev) => prev.filter((x) => x !== v));

  // Medications
  const setMed = (id: string, patch: Partial<Medication>): void =>
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  const handleMedicationSelect = (id: string, medicationId: string): void => {
    const selectedMed = medicationList.find(
      (m) => m.medication_id === medicationId
    );
    if (selectedMed) {
      setMed(id, {
        name: selectedMed.name,
        dose: selectedMed.dosage,
        freq: selectedMed.frequency,
      });
    }
  };
  const addMedicationRow = (): void =>
    setMedications((prev) => [
      ...prev,
      { id: uid(), name: "", dose: "", freq: "" },
    ]);
  const removeMedicationRow = (id: string): void =>
    setMedications((prev) => prev.filter((m) => m.id !== id));

  // Files
  const onPickFiles = (files: FileList | null): void => {
    if (!files) return;
    const valid: UploadItem[] = Array.from(files)
      .filter(
        (x) =>
          ["application/pdf", "image/jpeg", "image/png"].includes(x.type) &&
          x.size <= 20 * 1024 * 1024
      )
      .map((f) => ({ id: uid(), file: f, progress: 0, status: "queued" }));
    setUploads((old) => [...old, ...valid]);
  };
  const removeUpload = (id: string): void =>
    setUploads((prev) => prev.filter((u) => u.id !== id));

  const simulateUpload = async (): Promise<void> => {
    if (!uploads.length) return;
    setUploading(true);
    for (const u of uploads) {
      if (u.status !== "queued") continue;
      setUploads((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, status: "uploading", progress: 0 } : x
        )
      );
      await new Promise<void>((resolve) => {
        const iv = setInterval(() => {
          setUploads((prev) =>
            prev.map((x) => {
              if (x.id !== u.id) return x;
              const inc = Math.floor(10 + Math.random() * 20);
              const next = Math.min(100, x.progress + inc);
              return {
                ...x,
                progress: next,
                status: next >= 100 ? "done" : "uploading",
              };
            })
          );
        }, 250);
        setTimeout(() => {
          clearInterval(iv);
          setUploads((prev) =>
            prev.map((x) =>
              x.id === u.id ? { ...x, progress: 100, status: "done" } : x
            )
          );
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
      alert("Vui lòng điền tất cả các trường bắt buộc.");
      return;
    }
    const payload = {
      full_name: fullName,
      dob,
      gender,
      family_contact: familyContact,
      allergies,
      medications: medications
        .filter((m) => (m.name + m.dose + m.freq).trim() !== "")
        .map(({ id, ...rest }) => rest),
      notes,
      documents: uploads
        .filter((u) => u.status === "done")
        .map((u) => ({ name: u.file.name, size: u.file.size })),
    };
    console.log(payload);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);

    // Navigate to Resident Detail page with payload
    //navigate("/resident-detail", { state: { residentInfo: payload } });
  };

  const handleConfirm = async () => {
    // Cho phép submit nếu đã verified hoặc đã có user_id (đã tạo tài khoản)
    if (!familyContact.verified && !familyContact.user_id) {
      toast.error("Vui lòng xác minh email gia đình hoặc tạo tài khoản trước");
      return;
    }

    try {
      // Prepare data for API
      const residentData = {
        full_name: fullName,
        gender: gender as "male" | "female",
        date_of_birth: dob, // Should be ISO date string
        notes: notes || undefined,
        room_id:
          selectedRoom && selectedRoom.trim() !== "" ? selectedRoom : undefined, // Add room_id (chỉ gửi nếu có value)
        family_user_id: familyContact.user_id, // Link với family member (có thể chưa verify email)
        chronicDiseases: comorbidities.map((disease) => ({
          name: disease,
          severity: "MODERATE" as const, // Default severity
          status: "ACTIVE" as const,
        })),
        allergies: allergies.map((allergy) => ({
          substance: allergy,
          severity: "MODERATE" as const, // Default severity
        })),
      };

      // Call API to create resident
      const response = await createResident(residentData);

      // Check if account was generated
      if (response.data?.account) {
        setGeneratedAccount({
          username: response.data.account.username,
          password: response.data.account.password,
        });
        toast.success(
          "Tạo cư dân thành công! Vui lòng kiểm tra thông tin tài khoản."
        );
      } else {
        toast.success("Tạo cư dân và liên kết với gia đình thành công!");
        // Navigate to list-resident page if no account generated
        setTimeout(() => {
          navigate(path.residentList);
        }, 2000);
      }
      console.log("Created resident:", response);
    } catch (error: any) {
      console.error("Error creating resident:", error);
      toast.error(error.response?.data?.message || "Không thể tạo cư dân");
    }
  };

  useEffect(() => {
    // Remove overflow-hidden styles to allow scrolling
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <div className="flex min-h-full gap-4 lg:gap-6">
          {/* main content */}
          <div className="flex-1">
            <section className="w-full rounded-3xl bg-white/95 ring-1 ring-gray-200 shadow-md overflow-hidden flex flex-col">
              <header className="px-6 py-7 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
                <div className="relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600 hidden md:block">
                    <span className="font-medium">Kiểm toán:</span> Nhân viên &
                    thời gian sẽ được ghi lại khi tạo.
                  </div>
                  <div className="text-left">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Thông tin cư dân
                    </h1>
                    <p className="text-sm text-gray-500">{today}</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-6xl mx-0">
                  <header className="mb-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Tạo cư dân
                      </h2>
                      <p className="text-sm text-slate-500">
                        Thông tin cá nhân & tình trạng sức khỏe ban đầu
                      </p>
                    </div>
                    <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600 md:hidden text-center">
                      <span className="font-medium">Kiểm toán:</span> Nhân viên
                      & thời gian sẽ được ghi lại khi tạo.
                    </div>
                  </header>

                  <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-3"
                  >
                    <div className="lg:col-span-2">
                      <Card className="rounded-2xl border-gray-200">
                        <CardHeader>
                          <CardTitle>Thông tin cá nhân</CardTitle>
                          <CardDescription>
                            Các trường bắt buộc được đánh dấu *
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <Label>Họ và tên *</Label>
                            <Input
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Vd: Nguyễn Văn A"
                              className="border border-gray-200 shadow-none bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label>Ngày sinh *</Label>
                            <div className="relative">
                              <CalendarIcon
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer z-10"
                                onClick={() => {
                                  const input = document.getElementById(
                                    "dob"
                                  ) as HTMLInputElement;
                                  if (
                                    input &&
                                    typeof input.showPicker === "function"
                                  ) {
                                    input.showPicker();
                                  }
                                }}
                              />
                              <Input
                                id="dob"
                                name="dob"
                                type="date"
                                value={dob}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (isValidDob(value)) {
                                    setDob(value);
                                  } else {
                                    alert(
                                      "Ngày sinh không hợp lệ. Vui lòng nhập ngày hợp lệ."
                                    );
                                  }
                                }}
                                placeholder="dd/mm/yyyy"
                                className="pl-10 bg-white pr-10 border border-gray-200 shadow-none"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label>Giới tính</Label>
                            <Select
                              value={gender}
                              onValueChange={(v) => setGender(v)}
                            >
                              <SelectTrigger className="!bg-white border border-gray-200 shadow-none">
                                <SelectValue placeholder="— Chọn —" />
                              </SelectTrigger>
                              <SelectContent className="border border-gray-200 shadow-none bg-white">
                                <SelectItem value="male">Nam</SelectItem>
                                <SelectItem value="female">Nữ</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label>Phòng (Tùy chọn)</Label>
                            <Select
                              value={selectedRoom}
                              onValueChange={(v) => setSelectedRoom(v)}
                              disabled={loadingRooms}
                            >
                              <SelectTrigger className="!bg-white border border-gray-200 shadow-none">
                                <SelectValue
                                  placeholder={
                                    loadingRooms
                                      ? "Đang tải..."
                                      : "— Chưa phân phòng —"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="border border-gray-200 shadow-none bg-white">
                                {rooms.map((room) => (
                                  <SelectItem
                                    key={room.room_id}
                                    value={room.room_id}
                                  >
                                    Phòng {room.room_number} (
                                    {room.current_occupancy}/{room.capacity})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedRoom && (
                              <button
                                type="button"
                                onClick={() => setSelectedRoom("")}
                                className="text-xs text-blue-600 hover:underline mt-1 text-left"
                              >
                                Xóa lựa chọn phòng
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {/* family contact */}
                    <div className="lg:col-span-1">
                      <Card className="rounded-2xl border-gray-200">
                        <CardHeader>
                          <CardTitle>Liên hệ gia đình (Khẩn cấp) *</CardTitle>
                          <CardDescription>
                            Nhập email của thành viên gia đình đã đăng ký
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label>Email gia đình *</Label>
                            <div className="flex gap-2">
                              <Input
                                type="email"
                                value={familyContact.email}
                                onChange={(e) =>
                                  setFamilyContact({
                                    ...familyContact,
                                    email: e.target.value,
                                    verified: false,
                                  })
                                }
                                placeholder="family@example.com"
                                className="border border-gray-200 shadow-none bg-white"
                                disabled={checkingEmail}
                              />
                              <Button
                                type="button"
                                onClick={handleCheckEmail}
                                disabled={
                                  checkingEmail || !familyContact.email.trim()
                                }
                                className="whitespace-nowrap"
                              >
                                {checkingEmail
                                  ? "Đang kiểm tra..."
                                  : "Xác minh"}
                              </Button>
                            </div>
                            {familyContact.verified &&
                              familyContact.full_name && (
                                <div className="text-sm text-green-600 flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50"
                                  >
                                    ✓ Đã xác minh
                                  </Badge>
                                  <span>
                                    {familyContact.full_name}
                                    {familyContact.phone &&
                                      ` (${familyContact.phone})`}
                                  </span>
                                </div>
                              )}
                            {!familyContact.verified && (
                              <div className="flex flex-col gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setCreateAccountForm({
                                      email: "",
                                      full_name: "",
                                    });
                                    setShowCreateAccountDialog(true);
                                  }}
                                  className="w-full bg-blue-500 text-white hover:bg-blue-600"
                                  size="sm"
                                >
                                  Tạo tài khoản
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {/* initial healt */}
                    <div className="lg:col-span-2">
                      <Card className="rounded-2xl border-gray-200">
                        <CardHeader>
                          <CardTitle>Tình trạng sức khỏe ban đầu</CardTitle>
                          <CardDescription>
                            Dị ứng & thuốc hiện tại
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-left">
                          <div>
                            <Label>Bệnh lý đi kèm</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {comorbidities.map((c) => (
                                <Badge
                                  key={c}
                                  variant="secondary"
                                  className="gap-1"
                                >
                                  {c}
                                  <button
                                    type="button"
                                    aria-label={`Delete ${c}`}
                                    onClick={() => removeComorbidity(c)}
                                    className="ml-1 inline-flex size-4 items-center justify-center rounded hover:bg-slate-200"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Input
                                value={comorbiditiesInput}
                                onChange={(e) =>
                                  setComorbiditiesInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addComorbidity();
                                  }
                                }}
                                placeholder="Nhập bệnh lý và nhấn Enter"
                                className="border border-gray-200 shadow-none bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Dị ứng</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {allergies.map((a) => (
                                <Badge
                                  key={a}
                                  variant="secondary"
                                  className="gap-1"
                                >
                                  {a}
                                  <button
                                    type="button"
                                    aria-label={`Delete ${a}`}
                                    onClick={() => removeAllergy(a)}
                                    className="ml-1 inline-flex size-4 items-center justify-center rounded hover:bg-slate-200"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {allergenList.length > 0 ? (
                                <Select
                                  value=""
                                  onValueChange={(value) => {
                                    if (value) {
                                      addAllergy(value);
                                    }
                                  }}
                                  disabled={loadingAllergens}
                                >
                                  <SelectTrigger className="flex-1 !bg-white border border-gray-200 shadow-none">
                                    <SelectValue
                                      placeholder={
                                        loadingAllergens
                                          ? "Đang tải dị ứng..."
                                          : "— Chọn dị ứng —"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="border border-gray-200 shadow-none bg-white">
                                    {allergenList
                                      .filter(
                                        (allergen) =>
                                          !allergies.includes(allergen)
                                      )
                                      .map((allergen) => (
                                        <SelectItem
                                          key={allergen}
                                          value={allergen}
                                        >
                                          {allergen}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <>
                                  <Input
                                    value={allergyInput}
                                    onChange={(e) =>
                                      setAllergyInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addAllergy();
                                      }
                                    }}
                                    placeholder={
                                      loadingAllergens
                                        ? "Đang tải dị ứng..."
                                        : "Nhập dị ứng thủ công"
                                    }
                                    disabled={loadingAllergens}
                                    className="flex-1 border border-gray-200 shadow-none bg-white"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => addAllergy()}
                                    disabled={
                                      !allergyInput.trim() || loadingAllergens
                                    }
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                  >
                                    Thêm
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <Label>Thuốc đang dùng</Label>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={addMedicationRow}
                              >
                                + Thêm hàng
                              </Button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-gray-200">
                                    <TableHead className="border-gray-200">
                                      Tên thuốc
                                    </TableHead>
                                    <TableHead className="border-gray-200">
                                      Liều lượng
                                    </TableHead>
                                    <TableHead className="border-gray-200">
                                      Tần suất
                                    </TableHead>
                                    <TableHead className="w-12 border-gray-200"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {medications.map((m) => (
                                    <TableRow
                                      key={m.id}
                                      className="border-gray-200"
                                    >
                                      <TableCell className="border-gray-200">
                                        {medicationList.length > 0 ? (
                                          <Select
                                            value={
                                              medicationList.find(
                                                (med) => med.name === m.name
                                              )?.medication_id || ""
                                            }
                                            onValueChange={(value) =>
                                              handleMedicationSelect(
                                                m.id,
                                                value
                                              )
                                            }
                                            disabled={loadingMedications}
                                          >
                                            <SelectTrigger className="!bg-white border border-gray-200 shadow-none">
                                              <SelectValue
                                                placeholder={
                                                  loadingMedications
                                                    ? "Đang tải..."
                                                    : m.name || "— Chọn thuốc —"
                                                }
                                              />
                                            </SelectTrigger>
                                            <SelectContent className="border border-gray-200 shadow-none bg-white">
                                              {medicationList.map((med) => (
                                                <SelectItem
                                                  key={med.medication_id}
                                                  value={med.medication_id}
                                                >
                                                  {med.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <Input
                                            value={m.name}
                                            onChange={(e) =>
                                              setMed(m.id, {
                                                name: e.target.value,
                                              })
                                            }
                                            placeholder={
                                              loadingMedications
                                                ? "Đang tải thuốc..."
                                                : "Amlodipine"
                                            }
                                            disabled={loadingMedications}
                                            className="border border-gray-200 shadow-none bg-white"
                                          />
                                        )}
                                      </TableCell>
                                      <TableCell className="border-gray-200">
                                        <Input
                                          value={m.dose}
                                          onChange={(e) =>
                                            setMed(m.id, {
                                              dose: e.target.value,
                                            })
                                          }
                                          placeholder="5mg"
                                          className="border border-gray-200 shadow-none bg-white"
                                        />
                                      </TableCell>
                                      <TableCell className="border-gray-200">
                                        <Input
                                          value={m.freq}
                                          onChange={(e) =>
                                            setMed(m.id, {
                                              freq: e.target.value,
                                            })
                                          }
                                          placeholder="Một lần một ngày"
                                          className="border border-gray-200 shadow-none bg-white"
                                        />
                                      </TableCell>
                                      <TableCell className="border-gray-200">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            removeMedicationRow(m.id)
                                          }
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
                            <Label>Ghi chú thêm</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Nhập ghi chú sức khỏe thêm..."
                              className="border border-gray-200 shadow-none bg-white"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {/* upload documents */}
                    {/* <div className="lg:col-span-1">
                      <Card className="rounded-2xl border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold text-gray-900">
                            Upload Documents
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-700 hover:text-gray-900">
                            PDF, JPG, PNG up to 20MB each
                          </CardDescription>
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
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
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
                              <div
                                key={u.id}
                                className="flex items-center gap-2 bg-gray-100 p-2 rounded-md"
                              >
                                <div className="flex-1 truncate font-medium text-gray-800">
                                  {u.file.name}
                                </div>
                                <div className="w-24">
                                  <Progress value={u.progress} />
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeUpload(u.id)}
                                >
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
                    </div> */}

                    <div className="lg:col-span-3 flex justify-end gap-4">
                      <Button
                        type="button"
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-md"
                        onClick={() => navigate("/list-resident")}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-500 text-white font-semibold hover:bg-blue-600 px-4 py-2 rounded-md"
                        disabled={!requiredOk || uploading}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!requiredOk) {
                            alert("Vui lòng điền tất cả các trường bắt buộc.");
                            return;
                          }

                          if (comorbiditiesInput.trim()) addComorbidity();
                          if (allergyInput.trim()) addAllergy();

                          // Gọi API tạo resident luôn
                          handleConfirm();
                        }}
                      >
                        Tiếp tục
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Account Info Dialog */}
      <Dialog
        open={!!generatedAccount}
        onOpenChange={(open) => {
          if (!open) {
            setGeneratedAccount(null);
            navigate(path.residentList);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Tài khoản cư dân đã được tạo thành công
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Vui lòng lưu thông tin đăng nhập này. Mật khẩu có thể được thay
              đổi sau khi đăng nhập.
            </DialogDescription>
          </DialogHeader>
          {generatedAccount && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tên đăng nhập
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedAccount.username}
                    readOnly
                    className="border-gray-200 shadow-none bg-gray-50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAccount.username);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast.success("Đã sao chép tên đăng nhập!");
                    }}
                    className="border-gray-200"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Mật khẩu tạm thời
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedAccount.password}
                    readOnly
                    type="text"
                    className="border-gray-200 shadow-none bg-gray-50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAccount.password);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast.success("Đã sao chép mật khẩu!");
                    }}
                    className="border-gray-200"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Lưu ý:</strong> Vui lòng lưu thông tin này. Bạn sẽ cần
                  nó cho lần đăng nhập đầu tiên.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Username: ${generatedAccount.username}\nPassword: ${generatedAccount.password}`
                    );
                    toast.success("Đã sao chép thông tin đăng nhập!");
                  }}
                  variant="outline"
                  className="flex-1 border-gray-200"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép tất cả
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setGeneratedAccount(null);
                    navigate(path.residentList);
                  }}
                  className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                >
                  Hoàn tất
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Family Account Dialog */}
      <Dialog
        open={showCreateAccountDialog}
        onOpenChange={setShowCreateAccountDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Tạo tài khoản gia đình
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Điền thông tin để tạo tài khoản cho thành viên gia đình. Email
              kích hoạt sẽ được gửi đến địa chỉ email này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Họ và tên *
              </Label>
              <Input
                value={createAccountForm.full_name}
                onChange={(e) =>
                  setCreateAccountForm({
                    ...createAccountForm,
                    full_name: e.target.value,
                  })
                }
                placeholder="Nhập họ và tên"
                className="border-gray-200 shadow-none bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Địa chỉ email *
              </Label>
              <Input
                type="email"
                value={createAccountForm.email}
                onChange={(e) =>
                  setCreateAccountForm({
                    ...createAccountForm,
                    email: e.target.value,
                  })
                }
                placeholder="family@example.com"
                className="border-gray-200 shadow-none bg-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateAccountDialog(false);
                  setCreateAccountForm({ full_name: "", email: "" });
                }}
                className="flex-1 border-gray-200"
                disabled={creatingAccount}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleCreateFamilyAccount}
                className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                disabled={
                  creatingAccount ||
                  !createAccountForm.email.trim() ||
                  !createAccountForm.full_name.trim()
                }
              >
                {creatingAccount ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResidentInformation;
