import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/contexts/app.context";
import {
  createStaffForInstitution,
  uploadStaffAvatar,
  type CreateStaffPayload,
  type UploadStaffAvatarResponse,
} from "@/apis/staff.api";
import { toast } from "react-toastify";
import { HTTP_STATUS } from "@/constants/http-status";
import type { AxiosError } from "axios";
import { CheckCircle2, Loader2, UploadCloud, Image, Copy } from "lucide-react";
import path from "@/constants/path";

type ServerErrorPayload = {
  errors?: Record<string, { msg?: { message?: string } | string }>;
  message?: string;
};

type CreateStaffFormValues = {
  avatar?: string;
  email: string;
  full_name: string;
  phone: string;
  hire_date: string;
  position: string;
  notes?: string;
};

const STAFF_POSITIONS: { value: string; label: string }[] = [
  { value: "NURSE", label: "Y tá" },
  { value: "CAREGIVER", label: "Người chăm sóc" },
  { value: "THERAPIST", label: "Nhà trị liệu" },
  { value: "PHYSICIAN", label: "Bác sĩ" },
  { value: "SOCIAL_WORKER", label: "Nhân viên Xã hội" },
  { value: "ACTIVITY_COORDINATOR", label: "Điều phối viên Hoạt động" },
  { value: "DIETITIAN", label: "Chuyên gia Dinh dưỡng" },
  { value: "OTHER", label: "Khác" },
];

const DEFAULT_INPUT_STYLE =
  "border-gray-200 focus-visible:ring-2 focus-visible:ring-[#5985d8] focus-visible:border-[#5985d8]";

const StaffOnboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useContext(AppContext);
  const defaultInstitutionId = useMemo(
    () => ((profile as any)?.institution_id as string | undefined) ?? "",
    [profile]
  );

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
    setError,
    setValue,
  } = useForm<CreateStaffFormValues>({
    defaultValues: {
      avatar: "",
      email: "",
      full_name: "",
      phone: "",
      hire_date: "",
      position: "",
      notes: "",
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [uploadedAvatar, setUploadedAvatar] =
    useState<UploadStaffAvatarResponse | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  useEffect(() => {
    if (uploadedAvatar?.url) {
      setValue("avatar", uploadedAvatar.url);
    }
  }, [uploadedAvatar, setValue]);

  useEffect(
    () => () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    },
    [previewObjectUrl]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewObjectUrl(objectUrl);
    setAvatarPreview(objectUrl);
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setUploadedAvatar(null);
    setValue("avatar", "");
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCopyAvatarUrl = async () => {
    if (!uploadedAvatar?.url) return;
    try {
      await navigator.clipboard.writeText(uploadedAvatar.url);
      toast.success("Đã sao chép URL ảnh vào clipboard");
    } catch {
      toast.error("Không thể sao chép URL. Vui lòng thử lại.");
    }
  };

  const onUploadAvatar = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const response = await uploadStaffAvatar(selectedFile);
      setUploadedAvatar(response.data);
      setValue("avatar", response.data.url);
      toast.success(response.message || "Tải ảnh thành công");
    } catch (error) {
      const err = error as AxiosError<ServerErrorPayload>;
      const message =
        err.response?.data?.message || err.message || "Tải ảnh thất bại";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onCreateStaff = async (values: CreateStaffFormValues) => {
    setIsCreatingStaff(true);
    try {
      const institutionId = defaultInstitutionId?.trim() ?? "";

      if (!institutionId) {
        toast.error(
          "Không tìm thấy institution ID trong thông tin đăng nhập. Vui lòng đăng nhập lại."
        );
        return;
      }

      const payload: CreateStaffPayload = {
        avatar: values.avatar?.trim() ? values.avatar.trim() : null,
        email: values.email.trim(),
        full_name: values.full_name.trim(),
        phone: values.phone.trim(),
        hire_date: values.hire_date
          ? new Date(`${values.hire_date}T00:00:00.000Z`).toISOString()
          : "",
        position: values.position,
        notes: values.notes?.trim() || undefined,
        institution_id: institutionId,
      };

      const response = await createStaffForInstitution(payload);
      toast.success(response.message || "Tạo nhân viên thành công");

      // Reset form
      reset({
        avatar: uploadedAvatar?.url ?? "",
        email: "",
        full_name: "",
        phone: "",
        hire_date: "",
        position: "",
        notes: "",
      });

      // Reset avatar state
      setSelectedFile(null);
      setSelectedFileName("");
      setAvatarPreview(null);
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl(null);
      }
      setUploadedAvatar(null);

      // Navigate về staff list với flag để refresh
      navigate(path.staffList, { state: { refreshStaffList: true } });
    } catch (error) {
      const err = error as AxiosError<ServerErrorPayload>;
      if (err.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        const fieldErrors = err.response.data?.errors;
        if (fieldErrors) {
          const formKeys: Array<keyof CreateStaffFormValues> = [
            "avatar",
            "email",
            "full_name",
            "phone",
            "hire_date",
            "position",
            "notes",
          ];

          Object.entries(fieldErrors).forEach(([key, value]) => {
            const message =
              typeof value?.msg === "string"
                ? value.msg
                : value?.msg?.message || "Thông tin không hợp lệ";

            if (key === "institution_id") {
              toast.error(message);
              return;
            }

            if (formKeys.includes(key as keyof CreateStaffFormValues)) {
              setError(key as keyof CreateStaffFormValues, {
                type: "server",
                message,
              });
              return;
            }

            toast.error(message);
          });
        }
      } else {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Tạo nhân viên thất bại";
        toast.error(message);
      }
    } finally {
      setIsCreatingStaff(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tuyển dụng Nhân viên & Cấp quyền truy cập
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Hoàn thiện quy trình mời nhân viên tham gia hệ thống: tải ảnh đại
            diện và tạo hồ sơ nhân viên. Nhân viên sẽ tự xác thực lời mời ở
            trang dành riêng cho họ.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5  w-full ">
          <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm col-span-3 ">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">
                Tạo nhân viên cho viện dưỡng lão
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Điền thông tin nhân viên. URL ảnh đại diện được lấy tự động từ
                bước tải ảnh bên trên.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onCreateStaff)}>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <input type="hidden" {...register("avatar")} />
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@example.com"
                    className={DEFAULT_INPUT_STYLE}
                    {...register("email", {
                      required: "Email là bắt buộc",
                    })}
                  />
                  <p className="min-h-[1rem] text-sm text-red-500">
                    {errors.email?.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm text-gray-700">
                    Họ và tên
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Nguyễn Văn A"
                    className={DEFAULT_INPUT_STYLE}
                    {...register("full_name", {
                      required: "Họ tên là bắt buộc",
                    })}
                  />
                  <p className="min-h-[1rem] text-sm text-red-500">
                    {errors.full_name?.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-gray-700">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    placeholder="0xxxxxxxxx"
                    className={DEFAULT_INPUT_STYLE}
                    {...register("phone", {
                      required: "Số điện thoại là bắt buộc",
                      pattern: {
                        value: /^0\d{9}$/,
                        message:
                          "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0",
                      },
                    })}
                  />
                  <p className="min-h-[1rem] text-sm text-red-500">
                    {errors.phone?.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date" className="text-sm text-gray-700">
                    Ngày bắt đầu làm việc
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    className={DEFAULT_INPUT_STYLE}
                    {...register("hire_date", {
                      required: "Vui lòng chọn ngày bắt đầu",
                    })}
                  />
                  <p className="min-h-[1rem] text-sm text-red-500">
                    {errors.hire_date?.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Chức vụ</Label>
                  <Controller
                    control={control}
                    name="position"
                    rules={{ required: "Vui lòng chọn chức vụ" }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={DEFAULT_INPUT_STYLE}>
                            <SelectValue placeholder="Chọn chức vụ" />
                          </SelectTrigger>
                          <SelectContent className="border border-gray-200 bg-white">
                            {STAFF_POSITIONS.map((position) => (
                              <SelectItem
                                key={position.value}
                                value={position.value}
                              >
                                {position.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                  <p className="min-h-[1rem] text-sm text-red-500">
                    {errors.position?.message}
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes" className="text-sm text-gray-700">
                    Ghi chú
                    <span className="ml-2 text-xs font-medium text-gray-400">
                      (Tùy chọn)
                    </span>
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Thông tin bổ sung về nhân viên"
                    className={DEFAULT_INPUT_STYLE}
                    {...register("notes")}
                  />
                  <p className="min-h-[1rem] text-sm text-red-500">
                    {errors.notes?.message}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4">
                <Button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="bg-[#5985d8] px-6 text-white hover:bg-[#4a74c2] cursor-pointer "
                >
                  {isCreatingStaff ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo nhân viên...
                    </span>
                  ) : (
                    "Tạo nhân viên"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          <div className="grid gap-6 md:col-span-2 h-1/2">
            <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Tải ảnh đại diện
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Chọn ảnh chân dung của nhân viên, xem trước và tải lên để nhận
                  URL lưu vào hồ sơ.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Ảnh đại diện
                  </Label>
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="mx-auto h-40 w-40 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-sm">
                        <Image className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        PNG, JPG hoặc JPEG. Kích thước tối đa 10MB.
                      </p>
                      {selectedFileName && (
                        <p className="text-sm font-medium text-gray-700">
                          {selectedFileName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFilePicker}
                        className="border-gray-200 text-[#5985d8] hover:bg-blue-50 cursor-pointer "
                      >
                        Chọn ảnh
                      </Button>
                      <Button
                        type="button"
                        onClick={onUploadAvatar}
                        disabled={isUploadingAvatar}
                        className="bg-[#5985d8] text-white hover:bg-[#4a74c2] cursor-pointer"
                      >
                        {isUploadingAvatar ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <UploadCloud className="h-4 w-4" />
                            Tải ảnh
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {uploadedAvatar?.url && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      URL ảnh đã tải lên
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        readOnly
                        value={uploadedAvatar.url}
                        className={`${DEFAULT_INPUT_STYLE} bg-gray-50`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyAvatarUrl}
                        className="border-gray-200 text-[#5985d8] hover:bg-blue-50"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Sao chép
                      </Button>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      URL đã sẵn sàng để sử dụng ở biểu mẫu tạo nhân viên.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffOnboard;
