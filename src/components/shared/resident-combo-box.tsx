import * as React from "react";
import { ChevronsUpDown, Check, User } from "lucide-react";
import { Button } from "@/components/ui";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

export interface Resident {
  resident_id: string;
  full_name: string;
  room?: {
    room_number: string;
  };
  institution?: {
    name: string;
  };
}

interface ResidentComboBoxProps {
  onSelect: (residentId: string) => void;
  value?: string;
  placeholder?: string;
}

export function ResidentComboBox({
  onSelect,
  value,
  placeholder = "Select resident...",
}: ResidentComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [residents, setResidents] = React.useState<Resident[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch residents when component mounts
  React.useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const { getResidents } = await import("@/apis/resident.api");
      const response = await getResidents();
      const residentsData = (response.residents || []).map((r: any) => ({
        resident_id: r.resident_id,
        full_name: r.full_name,
        room: r.room ? { room_number: r.room.room_number } : undefined,
        institution: r.institution ? { name: r.institution.name } : undefined,
      }));
      setResidents(residentsData);
    } catch (error) {
      toast.error("Cannot load resident list");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResidents = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter(
      (resident) =>
        resident.full_name.toLowerCase().includes(q) ||
        resident.room?.room_number.toLowerCase().includes(q) ||
        resident.institution?.name.toLowerCase().includes(q)
    );
  }, [residents, query]);

  const selectedResident = residents.find((r) => r.resident_id === value);

  const handleSelect = (resident: Resident) => {
    onSelect(resident.resident_id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedResident ? (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="truncate">
                {selectedResident.full_name}
                {selectedResident.room && (
                  <span className="text-sm text-gray-500 ml-1">
                    - Room {selectedResident.room.room_number}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-gray-500">
              {isLoading ? "Loading..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search residents..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandEmpty>
            {isLoading ? "Loading..." : "No residents found"}
          </CommandEmpty>

          <CommandGroup>
            {filteredResidents.map((resident) => (
              <CommandItem
                key={resident.resident_id}
                value={resident.full_name}
                onSelect={() => handleSelect(resident)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">{resident.full_name}</span>
                    <div className="text-sm text-gray-500">
                      {resident.room && (
                        <span>Room {resident.room.room_number}</span>
                      )}
                      {resident.institution && (
                        <span className="ml-2">
                          • {resident.institution.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === resident.resident_id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
