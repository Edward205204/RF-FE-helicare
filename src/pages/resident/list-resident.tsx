import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import path from "@/constants/path";
import {
  getResidents,
  type ResidentResponse,
  deleteResident as apiDeleteResident,
  updateResident as apiUpdateResident,
} from "@/apis/resident.api";
import { toast } from "react-toastify";

type Resident = ResidentResponse & {
  age?: number;
};

export default function ListResident(): React.JSX.Element {
  const navigate = useNavigate();
  const [data, setData] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editResident, setEditResident] = useState<Resident | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  // Fetch residents from BE
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoading(true);
        const response = await getResidents();
        const residents = response.data || [];

        // Calculate age for each resident
        const residentsWithAge = residents.map((resident: ResidentResponse) => {
          const birthDate = new Date(resident.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          return { ...resident, age };
        });

        setData(residentsWithAge);
      } catch (error: any) {
        console.error("Error fetching residents:", error);
        toast.error(
          error.response?.data?.message || "Failed to load residents"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  const slice = data;

  const handleRowDoubleClick = (resident: Resident) => {
    navigate(
      `${path.residentDetail.replace(":resident_id", resident.resident_id)}`
    );
  };

  const today = new Date().toLocaleDateString();

  const onClickView = (resident: Resident) => {
    navigate(
      `${path.residentDetail.replace(":resident_id", resident.resident_id)}`
    );
  };

  const onClickEdit = (resident: Resident) => {
    setEditResident(resident);
    setEditName(resident.full_name);
    setEditNotes(resident.notes || "");
  };

  const onConfirmEdit = async () => {
    if (!editResident) return;
    try {
      const res = await apiUpdateResident(editResident.resident_id, {
        full_name: editName,
        notes: editNotes,
      });
      const updated: Resident = {
        ...editResident,
        full_name: editName,
        notes: editNotes,
      };
      setData((prev) =>
        prev.map((r) => (r.resident_id === updated.resident_id ? updated : r))
      );
      setEditResident(null);
      toast.success("Resident updated");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update resident");
    }
  };

  const onClickDelete = (resident: Resident) => {
    setDeleteId(resident.resident_id);
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiDeleteResident(deleteId);
      setData((prev) => prev.filter((r) => r.resident_id !== deleteId));
      setDeleteId(null);
      toast.success("Resident deleted");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete resident");
    }
  };

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <section className="w-full h-full max-w-full rounded-3xl bg-white/95 ring-1 ring-black/5 shadow-lg overflow-hidden flex flex-col">
          <header className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold" style={{ color: "#5985d8" }}>
                  Resident List
                </h1>
                <p className="text-sm text-gray-500">{today}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-xs sm:text-sm text-gray-500 max-w-md">
                  <span className="font-medium">Note:</span> BP (Blood
                  Pressure), HR (Heart Rate), Temp (Temperature), RR
                  (Respiration Rate), SpO₂ (Oxygen Saturation)
                </div>
                <button
                  onClick={() => navigate(path.residentInformation)}
                  className="flex items-center justify-center w-10 h-10 bg-[#5985d8] text-white rounded-lg hover:bg-[#4a7bc8] transition-colors shadow-md font-bold text-xl flex-shrink-0"
                  aria-label="Add Resident"
                >
                  +
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden p-6 min-h-0">
            <div className="w-full h-full overflow-y-auto overflow-x-hidden">
              <div className="rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-sm w-full">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[12%]">
                          Full name
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                          Date of Birth
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                          Room/Bed
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                          Comorbidity
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[18%]">
                          Last vital sign
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                          Diet group
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                          Family's Contact
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[12%]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            Loading residents...
                          </td>
                        </tr>
                      ) : slice.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            No residents found. Click the + button to add a new
                            resident.
                          </td>
                        </tr>
                      ) : (
                        slice.map((r) => {
                          const dob = new Date(
                            r.date_of_birth
                          ).toLocaleDateString();
                          const diseases =
                            r.chronicDiseases?.map((d) => d.name).join(", ") ||
                            "None";

                          // Get family email from link
                          const familyEmail =
                            r.familyResidentLinks?.[0]?.family_email || "-";

                          return (
                            <tr
                              key={r.resident_id}
                              className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                              onDoubleClick={() => handleRowDoubleClick(r)}
                            >
                              <td className="px-4 py-4 text-gray-800 font-medium">
                                {r.full_name}
                              </td>
                              <td className="px-4 py-4 text-gray-800">{dob}</td>
                              <td className="px-4 py-4 text-gray-800">
                                {r.room?.room_number
                                  ? `Room ${r.room.room_number}`
                                  : "Not assigned"}
                              </td>
                              <td className="px-4 py-4 text-gray-800">
                                {diseases}
                              </td>
                              <td className="px-4 py-4 text-gray-800 text-sm">
                                {(() => {
                                  const lastAssessment =
                                    r.healthAssessments?.[0];
                                  if (!lastAssessment) {
                                    return (
                                      <div className="text-gray-400">-</div>
                                    );
                                  }
                                  const lastDate = new Date(
                                    lastAssessment.created_at
                                  );
                                  const formattedDate =
                                    lastDate.toLocaleDateString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    });
                                  const formattedTime =
                                    lastDate.toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    });
                                  return (
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {formattedDate}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {formattedTime}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-4 text-gray-800">
                                {diseases !== "None"
                                  ? diseases.split(",")[0]
                                  : "-"}
                              </td>
                              <td className="px-4 py-4 text-gray-800 text-sm">
                                {familyEmail}
                              </td>
                              <td className="px-4 py-4 text-gray-800 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickView(r);
                                    }}
                                  >
                                    View
                                  </button>
                                  <button
                                    className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickEdit(r);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickDelete(r);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-center w-full">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-left">
            Are you sure you want to delete this resident? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              onClick={onConfirmDelete}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editResident)}
        onOpenChange={() => setEditResident(null)}
      >
        <DialogContent className="bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-center w-full">
              Edit Resident
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-left">
            <div>
              <label className="text-sm text-gray-700">Full name</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Notes</label>
              <textarea
                className="mt-1 w-full border rounded px-3 py-2"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setEditResident(null)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={onConfirmEdit}
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
