// search and select residents component
import React, { useState, useEffect } from "react";
import { Input } from "../ui";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";

interface Resident {
  id: string;
  name: string;
  room: string;
  dob: string;
}

interface ResidentSelectorProps {
  selectedResidentIds: string[];
  onChange: (ids: string[], residents: Resident[]) => void;
  initialSelectedResidents?: Resident[];
}

const mockSearchResidents = async (query: string): Promise<Resident[]> => {
  const all: Resident[] = [
    { id: "r1", name: "Nguyen Thi Thoa", room: "301", dob: "1945-01-01" },
    { id: "r2", name: "Nguyen Thi Thoa", room: "203", dob: "1940-02-12" },
    { id: "r3", name: "Tran Van B", room: "105", dob: "1938-07-09" },
  ];

  const keyword = query.toLowerCase().trim();
  if (!keyword) return [];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        all.filter(
          (r) =>
            r.name.toLowerCase().includes(keyword) ||
            (r.room && r.room.toLowerCase().includes(keyword))
        )
      );
    }, 300);
  });
};

const ResidentSelector: React.FC<ResidentSelectorProps> = ({
  selectedResidentIds,
  onChange,
  initialSelectedResidents = [],
}) => {
  const [searchResident, setSearchResident] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [selectedResidents, setSelectedResidents] = useState<Resident[]>(
    initialSelectedResidents
  );

  useEffect(() => {
    const keyword = searchResident.trim();

    if (!keyword) {
      setResidents([]);
      setLoadingResidents(false);
      return;
    }

    setLoadingResidents(true);

    const handler = setTimeout(async () => {
      try {
        const result = await mockSearchResidents(keyword);
        setResidents(result);
      } catch (e) {
        console.error("Error searching residents:", e);
      } finally {
        setLoadingResidents(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchResident]);

  const toggleResident = (resident: Resident) => {
    const updatedIds = selectedResidentIds.includes(resident.id)
      ? selectedResidentIds.filter((id) => id !== resident.id)
      : [...selectedResidentIds, resident.id];

    const updatedResidents = selectedResidents.some((r) => r.id === resident.id)
      ? selectedResidents.filter((r) => r.id !== resident.id)
      : [...selectedResidents, resident];

    onChange(updatedIds, updatedResidents);
  };

  return (
    <div>
      {/* <label className="block text-sm font-medium mb-2">Select Residents</label>

      <Input
        placeholder="Search residents by name or room..."
        value={searchResident}
        onChange={(e) => setSearchResident(e.target.value)}
        className="mb-3"
      /> */}

      {/* <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
        {searchResident.trim().length === 0 && (
          <p className="text-xs text-gray-500">
            Type a name or room number to search residents.
          </p>
        )}

        {searchResident.trim().length > 0 && loadingResidents && (
          <p className="text-xs text-gray-500">Searching residents...</p>
        )}

        {searchResident.trim().length > 0 &&
          !loadingResidents &&
          residents.length === 0 && (
            <p className="text-xs text-gray-500">
              No residents found. Try another keyword.
            </p>
          )}

        {!loadingResidents &&
          residents.map((r) => (
            <label
              key={r.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selectedResidentIds.includes(r.id)}
                onCheckedChange={() => toggleResident(r)}
              />
              <span>
                {r.name}
                {r.room && (
                  <span className="text-gray-500"> — Room {r.room}</span>
                )}
              </span>
            </label>
          ))}
      </div> */}

      {selectedResidents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedResidents.map((r) => (
            <Badge
              key={r.id}
              variant="secondary"
              className="flex items-center gap-2 text-xs"
            >
              {r.name}
              {r.room && ` — Room ${r.room}`}
              <button
                type="button"
                className="ml-1 text-[10px]"
                onClick={() => toggleResident(r)}
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResidentSelector;
