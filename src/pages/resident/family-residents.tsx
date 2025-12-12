import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui";
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import {
  Loader2,
  User,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import path from "@/constants/path";

type Resident = ResidentResponse & {
  age?: number;
  institution?: {
    institution_id: string;
    name: string;
    address: string;
  };
};

const FamilyResidents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoading(true);
        const response = await getResidentsByFamily();
        const residentsData = response.data || [];

        // Tính tuổi cho mỗi resident
        const residentsWithAge = residentsData.map(
          (resident: ResidentResponse) => {
            const birthDate = new Date(resident.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age--;
            }
            return { ...resident, age };
          }
        );

        setResidents(residentsWithAge);
      } catch (error: any) {
        console.error("Error fetching residents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAddress = (address: any): string => {
    if (typeof address === "string") {
      return address;
    }
    if (typeof address === "object" && address !== null) {
      const parts = [
        address.house_number,
        address.street,
        address.ward,
        address.district,
        address.province,
      ].filter(Boolean);
      return parts.join(", ");
    }
    return "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5985d8]" />
      </div>
    );
  }

  if (residents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <User className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No linked residents
        </h3>
        <p className="text-gray-500">
          You have not linked with any residents. Please contact the institution
          for support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Relatives</h1>
        <p className="text-gray-600">
          List of residents linked to your account
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {residents.map((resident) => (
          <Card
            key={resident.resident_id}
            role="button"
            tabIndex={0}
            aria-label={`View health profile of ${resident.full_name}`}
            onClick={() =>
              navigate(
                `${path.familyHealthCare}?residentId=${resident.resident_id}`
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                navigate(
                  `${path.familyHealthCare}?residentId=${resident.resident_id}`
                );
              }
            }}
            className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5985d8]"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                    {resident.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {resident.full_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {resident.gender === "male" ? "Male" : "Female"},{" "}
                      {resident.age} years old
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Institution Info */}
              {resident.institution && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {resident.institution.name}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {formatAddress(resident.institution.address)}
                    </p>
                  </div>
                </div>
              )}

              {/* Room Info */}
              {resident.room && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Room {resident.room.room_number}</span>
                </div>
              )}

              {/* Chronic Diseases */}
              {resident.chronicDiseases &&
                resident.chronicDiseases.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Chronic Diseases:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resident.chronicDiseases.slice(0, 3).map((disease) => (
                        <Badge
                          key={disease.id}
                          variant="secondary"
                          className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                        >
                          {disease.name}
                        </Badge>
                      ))}
                      {resident.chronicDiseases.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-600 border-gray-200"
                        >
                          +{resident.chronicDiseases.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

              {/* Allergies */}
              {resident.allergies && resident.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Allergies:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {resident.allergies.slice(0, 3).map((allergy) => (
                      <Badge
                        key={allergy.id}
                        variant="secondary"
                        className="text-xs bg-red-50 text-red-700 border-red-200"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {allergy.substance}
                      </Badge>
                    ))}
                    {resident.allergies.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gray-100 text-gray-600 border-gray-200"
                      >
                        +{resident.allergies.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Health Assessment */}
              {resident.healthAssessments &&
                resident.healthAssessments.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Latest Health Assessment:
                    </p>
                    <div className="space-y-1 text-xs text-gray-600">
                      {resident.healthAssessments[0].temperature_c && (
                        <div className="flex justify-between">
                          <span>Temperature:</span>
                          <span className="font-medium">
                            {resident.healthAssessments[0].temperature_c}°C
                          </span>
                        </div>
                      )}
                      {resident.healthAssessments[0]
                        .blood_pressure_systolic && (
                        <div className="flex justify-between">
                          <span>Blood Pressure:</span>
                          <span className="font-medium">
                            {
                              resident.healthAssessments[0]
                                .blood_pressure_systolic
                            }
                            /
                            {
                              resident.healthAssessments[0]
                                .blood_pressure_diastolic
                            }{" "}
                            mmHg
                          </span>
                        </div>
                      )}
                      <div className="text-gray-400 text-xs mt-2">
                        {formatDate(resident.healthAssessments[0].created_at)}
                      </div>
                    </div>
                  </div>
                )}

              {/* Admission Date */}
              {resident.admission_date && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Admission Date: {formatDate(resident.admission_date)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FamilyResidents;
