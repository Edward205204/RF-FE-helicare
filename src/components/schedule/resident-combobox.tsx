import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";

interface ResidentComboboxProps {
  value: string | null;
  onChange: (v: string | null) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
}

export function ResidentCombobox({
  value,
  onChange,
  options,
  placeholder,
}: ResidentComboboxProps) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={(v: string) => onChange(v || null)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
