import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getResidentById,
  type ResidentResponse,
  getFamilyMembersByResident,
  type FamilyMemberResponse,
} from "@/apis/resident.api";
import {
  getAssessmentsByResident,
  type AssessmentResponse,
} from "@/apis/assessment.api";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin } from "lucide-react";
import path from "@/constants/path";

export default function ResidentDetail(): React.JSX.Element {
  const { resident_id } = useParams<{ resident_id: string }>();
  const navigate = useNavigate();
  const [resident, setResident] = useState<ResidentResponse | null>(null);
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resident_id) {
      toast.error("Resident ID không hợp lệ");
      navigate(path.residentList);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch resident info
        const residentResponse = await getResidentById(resident_id);
        setResident(residentResponse.data);

        // Fetch assessments
        const assessmentsResponse = await getAssessmentsByResident(resident_id);
        setAssessments(assessmentsResponse.data || []);

        // Fetch family members
        const familyResponse = await getFamilyMembersByResident(resident_id);
        setFamilyMembers(familyResponse.data || []);
      } catch (error: any) {
        console.error("Error fetching resident detail:", error);
        toast.error(
          error.response?.data?.message || "Không thể tải thông tin resident"
        );
        navigate(path.residentList);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resident_id, navigate]);

  if (loading) {
    return (
      <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
        <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
        <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Không tìm thấy thông tin resident</p>
          </div>
        </div>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <section className="w-full h-full max-w-full rounded-3xl bg-white/95 ring-1 ring-black/5 shadow-lg overflow-hidden flex flex-col">
          <header className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate(path.residentList)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Quay lại</span>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold" style={{ color: "#5985d8" }}>
                Chi tiết Resident
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Thông tin cơ bản */}
              <div className="lg:col-span-1">
                <Card className="rounded-2xl border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Họ và tên
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {resident.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Ngày sinh
                      </p>
                      <p className="text-base text-gray-800">
                        {formatDate(resident.date_of_birth)} (
                        {calculateAge(resident.date_of_birth)} tuổi)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Giới tính
                      </p>
                      <p className="text-base text-gray-800 capitalize">
                        {resident.gender === "male" ? "Nam" : "Nữ"}
                      </p>
                    </div>
                    {resident.room && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Phòng
                        </p>
                        <p className="text-base text-gray-800">
                          Phòng {resident.room.room_number}
                        </p>
                      </div>
                    )}
                    {resident.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Ghi chú
                        </p>
                        <p className="text-base text-gray-800">
                          {resident.notes}
                        </p>
                      </div>
                    )}
                    {resident.chronicDiseases &&
                      resident.chronicDiseases.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Bệnh mãn tính
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {resident.chronicDiseases.map((disease) => (
                              <Badge key={disease.id} variant="secondary">
                                {disease.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {resident.allergies && resident.allergies.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Dị ứng
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {resident.allergies.map((allergy) => (
                            <Badge key={allergy.id} variant="destructive">
                              {allergy.substance}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Danh sách Assessment và Người thân */}
              <div className="lg:col-span-2 space-y-6">
                {/* Danh sách Assessment */}
                <Card className="rounded-2xl border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Danh sách Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assessments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Chưa có assessment nào
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ngày giờ</TableHead>
                              <TableHead>Nhiệt độ (°C)</TableHead>
                              <TableHead>Huyết áp</TableHead>
                              <TableHead>Nhịp tim</TableHead>
                              <TableHead>Nhịp thở</TableHead>
                              <TableHead>SpO₂ (%)</TableHead>
                              <TableHead>Ghi chú</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessments.map((assessment) => (
                              <TableRow key={assessment.assessment_id}>
                                <TableCell>
                                  {formatDateTime(assessment.created_at)}
                                </TableCell>
                                <TableCell>
                                  {assessment.temperature_c
                                    ? `${assessment.temperature_c}°C`
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {assessment.blood_pressure_systolic &&
                                  assessment.blood_pressure_diastolic
                                    ? `${assessment.blood_pressure_systolic}/${assessment.blood_pressure_diastolic}`
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {assessment.heart_rate
                                    ? `${assessment.heart_rate} bpm`
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {assessment.respiratory_rate
                                    ? `${assessment.respiratory_rate} /phút`
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {assessment.oxygen_saturation
                                    ? `${assessment.oxygen_saturation}%`
                                    : "-"}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {assessment.notes || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Danh sách Người thân */}
                <Card className="rounded-2xl border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Người thân liên kết
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {familyMembers.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Chưa có người thân nào được liên kết
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {familyMembers.map((member) => (
                          <div
                            key={member.link_id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {member.full_name}
                              </h3>
                              <Badge
                                variant={
                                  member.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {member.status === "active"
                                  ? "Đang hoạt động"
                                  : member.status}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              {member.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{member.family_email}</span>
                              </div>
                              {member.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{member.address}</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-2">
                                Liên kết từ: {formatDate(member.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
