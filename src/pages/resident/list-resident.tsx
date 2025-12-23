import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import path from "@/constants/path";
import {
  getResidents,
  type ResidentResponse,
  type ResidentListMeta,
  deleteResident as apiDeleteResident,
  updateResident as apiUpdateResident,
} from "@/apis/resident.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import { usePaginationQuerySync } from "@/hooks/use-pagination-query";
import { toast } from "react-toastify";
import { EyeIcon } from "lucide-react";

type Resident = ResidentResponse & {
  age?: number;
};

const RANGE = 2;
type PaginationItem = number | "ellipsis";

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) return [1];

  const candidates = new Set<number>();
  for (let i = currentPage - RANGE; i <= currentPage + RANGE; i += 1) {
    if (i >= 1 && i <= totalPages) {
      candidates.add(i);
    }
  }
  candidates.add(1);
  if (totalPages >= 2) {
    candidates.add(2);
    candidates.add(totalPages);
    if (totalPages - 1 > 0) {
      candidates.add(totalPages - 1);
    }
  }

  const sorted = Array.from(candidates).sort((a, b) => a - b);
  const result: PaginationItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (page - prev > 1) {
        result.push("ellipsis");
      }
    }
    result.push(page);
  });
  return result;
};

export default function ListResident(): React.JSX.Element {
  const navigate = useNavigate();
  const { page, limit, setPage, setLimit, searchParams, setQueryParams } =
    usePaginationQuerySync(10);
  const [data, setData] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editResident, setEditResident] = useState<Resident | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [pagination, setPagination] = useState<ResidentListMeta>({
    page,
    limit,
    total: 0,
    totalPages: 1,
  });
  const roomFilter = searchParams.get("room_id") ?? "all";
  const searchValue = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchValue);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const response = await getRooms();
      setRooms(response.rooms || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const fetchResidents = useCallback(async () => {
    try {
      setLoading(true);
      const { residents, pagination: paginationMeta } = await getResidents({
        page,
        limit,
        roomId: roomFilter !== "all" ? roomFilter : undefined,
        search: searchValue || undefined,
      });

      const residentsWithAge = residents.map((resident) => {
        const birthDate = new Date(resident.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return { ...resident, age };
      });

      setData(residentsWithAge);

      const fallbackTotal = Math.max(
        (page - 1) * limit + residents.length,
        residents.length
      );
      const fallbackMeta: ResidentListMeta = {
        page,
        limit,
        total: fallbackTotal,
        totalPages: Math.max(1, Math.ceil(fallbackTotal / limit)),
      };
      setPagination(paginationMeta || fallbackMeta);
    } catch (error: any) {
      console.error("Error fetching residents:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách cư dân"
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, roomFilter, searchValue]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const handleRowDoubleClick = (resident: Resident) => {
    navigate(
      `${path.residentDetail.replace(":resident_id", resident.resident_id)}`
    );
  };

  const today = new Date().toLocaleDateString("en-US");

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
      await apiUpdateResident(editResident.resident_id, {
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
      toast.success("Cập nhật cư dân thành công");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Cập nhật cư dân thất bại");
    }
  };

  const onClickDelete = (resident: Resident) => {
    setDeleteId(resident.resident_id);
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiDeleteResident(deleteId);
      toast.success("Đã xóa cư dân");
      setDeleteId(null);
      fetchResidents();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Xóa cư dân thất bại");
    }
  };

  const handleSearchSubmit = () => {
    setQueryParams(
      { search: searchInput.trim() ? searchInput.trim() : undefined },
      { resetPage: true }
    );
  };

  const handleRoomFilterChange = (value: string) => {
    setQueryParams(
      { room_id: value === "all" ? undefined : value },
      { resetPage: true }
    );
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setQueryParams(
      {
        search: undefined,
        room_id: undefined,
      },
      { resetPage: true }
    );
  };

  const paginationItems = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    return buildPaginationItems(page, totalPages);
  }, [page, pagination.totalPages]);

  const totalResidents = pagination.total ?? data.length;
  const showingFrom = totalResidents === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo =
    totalResidents === 0
      ? 0
      : Math.min(totalResidents, showingFrom + data.length - 1);
  const canGoPrev = page > 1;
  const canGoNext = page < pagination.totalPages;

  return (
    <div className="w-full min-h-screen max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <section className="w-full max-w-full rounded-3xl bg-white/95 ring-1 ring-black/5 shadow-lg flex flex-col">
          <header className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold" style={{ color: "#5985d8" }}>
                  Danh sách cư dân
                </h1>
                <p className="text-sm text-gray-500">{today}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-xs sm:text-sm text-gray-500 max-w-md">
                  <span className="font-medium">Lưu ý:</span> BP (Huyết áp), HR
                  (Nhịp tim), Temp (Nhiệt độ), RR (Nhịp thở), SpO₂ (Độ bão hòa
                  oxy)
                </div>
                <button
                  onClick={() => navigate(path.residentInformation)}
                  className="flex items-center justify-center w-10 h-10 bg-[#5985d8] text-white rounded-lg hover:bg-[#4a7bc8] transition-colors shadow-md font-bold text-xl flex-shrink-0 cursor-pointer"
                  aria-label="Add Resident"
                >
                  +
                </button>
              </div>
            </div>
          </header>

          <div className="px-6 pt-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600">
                  Tìm kiếm theo tên
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="Nhập tên cư dân..."
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5985d8]"
                  />
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="px-4 py-2 rounded-lg bg-[#5985d8] text-white text-sm hover:bg-[#4a74c2]"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>
              <div className="flex flex-col lg:w-56">
                <label className="text-sm font-medium text-gray-600">
                  Lọc theo phòng
                </label>
                <select
                  value={roomFilter}
                  onChange={(e) => handleRoomFilterChange(e.target.value)}
                  disabled={roomsLoading}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5985d8]"
                >
                  <option value="all">Tất cả phòng</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      Phòng {room.room_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex lg:w-auto">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="w-full overflow-x-hidden">
              <div className="rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-sm w-full">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[12%]">
                          Họ và tên
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                          Ngày sinh
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                          Phòng/Giường
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                          Bệnh mãn tính
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[18%]">
                          Dấu hiệu sinh tồn mới nhất
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[10%]">
                          Chế độ ăn
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[15%]">
                          Liên hệ gia đình
                        </th>
                        <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-[12%]">
                          Hành động
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
                            Đang tải danh sách cư dân...
                          </td>
                        </tr>
                      ) : data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            Không tìm thấy cư dân phù hợp. Nhấn + để thêm mới.
                          </td>
                        </tr>
                      ) : (
                        data.map((r) => {
                          const dob = new Date(
                            r.date_of_birth
                          ).toLocaleDateString("en-US");
                          const diseases =
                            r.chronicDiseases?.map((d) => d.name).join(", ") ||
                            "Không";
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
                                  ? `Phòng ${r.room.room_number}`
                                  : "Chưa phân phòng"}
                              </td>
                              <td className="px-4 py-4 text-gray-800">
                                {diseases === "None" ? "Không" : diseases}
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
                                    lastDate.toLocaleDateString("en-US", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    });
                                  const formattedTime =
                                    lastDate.toLocaleTimeString("en-US", {
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
                                {diseases !== "None" && diseases !== "Không"
                                  ? diseases.split(",")[0]
                                  : "-"}
                              </td>
                              <td className="px-4 py-4 text-gray-800 text-sm">
                                {familyEmail}
                              </td>
                              <td className="px-4 py-4 text-gray-800 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    className="bg-white rounded-full p-2 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickView(r);
                                    }}
                                  >
                                    <EyeIcon className="w-4 h-4 text-blue-500 bg-white" />
                                  </button>
                                  {/* <button
                                    className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickEdit(r);
                                    }}
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickDelete(r);
                                    }}
                                  >
                                    Xóa
                                  </button> */}
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

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>
                  Hiển thị {showingFrom}-{showingTo} / {pagination.total} cư dân
                </span>
                <label className="flex items-center gap-2">
                  <span className="text-gray-600 whitespace-nowrap">
                    Số hàng mỗi trang
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5985d8]"
                  >
                    {[10, 20, 50].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => canGoPrev && setPage(page - 1)}
                  disabled={!canGoPrev}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50 cursor-pointer"
                >
                  Trước
                </button>
                {paginationItems.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`px-3 py-1 rounded border text-sm cursor-pointer ${
                        item === page
                          ? "bg-[#5985d8] text-white border-[#5985d8]"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => canGoNext && setPage(page + 1)}
                  disabled={!canGoNext}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-center w-full">
              Xác nhận xoá cư dân
            </DialogTitle>
          </DialogHeader>
          <p className="text-left text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa cư dân này không? Hành động này không thể
            hoàn tác.
          </p>
          <DialogFooter className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setDeleteId(null)}
            >
              Hủy
            </button>
            <button
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              onClick={onConfirmDelete}
            >
              Xóa
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editResident)}
        onOpenChange={() => setEditResident(null)}
      >
        <DialogContent className="bg-white border-none">
          <DialogHeader>
            <DialogTitle className="text-center w-full">
              Chỉnh sửa cư dân
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-left">
            <div>
              <label className="text-sm text-gray-700">Họ và tên</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Ghi chú</label>
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
              Hủy
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={onConfirmEdit}
            >
              Lưu
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
