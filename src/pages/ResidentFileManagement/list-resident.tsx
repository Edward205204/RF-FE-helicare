import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";

type Resident = {
  id: number;
  fullName: string;
  dob: string;
  age: number;
  gender: string;
};

export default function ListResident(): React.JSX.Element {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  // Mock data
  const [data] = useState<Resident[]>([
    { id: 1, fullName: "John Doe", dob: "1965-08-12", age: 60, gender: "Male" },
    { id: 2, fullName: "Jane Smith", dob: "1958-03-22", age: 67, gender: "Female" },
    { id: 3, fullName: "Nguyen Van A", dob: "1951-12-04", age: 73, gender: "Male" },
    { id: 4, fullName: "Tran Thi B", dob: "1956-07-19", age: 69, gender: "Female" },
  ]);

  const slice = data; // Simplified for demonstration

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Nền radial */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)]" />

      <div className="relative h-full overflow-y-auto pt-4 md:pt-8 lg:pt-0">
        <div className="flex min-h-full gap-4 lg:gap-6">
          <aside className="w-[240px] shrink-0">
            <div className="h-full flex flex-col items-start">
              <div className="mt-4 w-full rounded-2xl bg-white/90 backdrop-blur-md ring-1 ring-black/5 shadow-md flex flex-col py-4 gap-5">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/medical')}
                >
                  Medical & Health Record Management
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/nutrition')}
                >
                  Daily Life & Nutrition Management
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/incident')}
                >
                  Incident & Emergency Handling
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/room')}
                >
                  Room & Facility Management
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/communication')}
                >
                  Communication & Reporting
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/visitation')}
                >
                  Visitation & Access Control
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/resident-management/payments')}
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
                  <div className="flex-col items-center gap-2 text-left">
                    <h1 className="text-xl font-semibold text-gray-900">Resident List</h1>
                    <p className="text-sm text-gray-500">Manage resident profiles consistent with HeLiCare style</p>
                  </div>
                </div>
              </header>

              <div className="overflow-auto px-6 py-6">
                <table className="w-full table-auto border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[100px]">Full name</th>
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[100px]">Date of Birth</th>
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[50px]">Age</th>
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[120px]">Room/Bed</th>
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[180px]">Last vital sign</th>
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[100px]">Diet group</th>
                      <th className="text-left px-6 py-3 whitespace-nowrap min-w-[120px]">Last alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 rounded-xl">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-left">{r.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">{r.dob}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">{r.age}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-left relative" style={{ minWidth: '120px' }}>
                          Room 101 / Bed 1
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left relative" style={{ minWidth: '180px' }}>
                          BP: 120/80, HR: 72
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              className="cursor-pointer text-gray-500 hover:text-gray-700 p-1 focus:outline-none focus:shadow-none"
                              onClick={() => setShowDropdown(showDropdown === r.id ? null : r.id)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {showDropdown === r.id && (
                              <div className="absolute right-0 mt-1 w-24 bg-white border rounded shadow-lg">
                                <button
                                  type="button"
                                  style={{ fontSize: '14px !important', fontWeight: 'normal', outline: 'none', boxShadow: 'none' }}
                                  className="block w-full px-2 py-1 text-left text-gray-700 hover:bg-gray-100 focus:outline-none focus:shadow-none"
                                  onClick={() => console.log(`Details for Last vital sign`)}
                                >
                                  Detail
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">Diabetes</td>
                        <td className="px-6 py-4 whitespace-nowrap text-left relative" style={{ minWidth: '120px' }}>
                          Last alert: 2 recent
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              className="cursor-pointer text-gray-500 hover:text-gray-700 p-1 focus:outline-none focus:shadow-none"
                              onClick={() => setShowDropdown(showDropdown === r.id ? null : r.id)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {showDropdown === r.id && (
                              <div className="absolute right-0 mt-1 w-24 bg-white border rounded shadow-lg">
                                <button
                                  type="button"
                                  style={{ fontSize: '14px !important', fontWeight: 'normal', outline: 'none', boxShadow: 'none' }}
                                  className="block w-full px-2 py-1 text-left text-gray-700 hover:bg-gray-100 focus:outline-none focus:shadow-none"
                                  onClick={() => console.log(`Details for Last alert`)}
                                >
                                  Detail
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
