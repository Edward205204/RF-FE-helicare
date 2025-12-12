import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { assignTaskToStaff, type AssignTaskPayload } from "@/apis/staff.api";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { ResidentComboBox } from "@/components/shared/resident-combo-box";

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  onSuccess?: () => void;
}

const TASK_TYPES = [
  { value: "meal", label: "Meal" },
  { value: "exercise", label: "Exercise" },
  { value: "hygiene", label: "Hygiene" },
  { value: "medication", label: "Medication" },
  { value: "custom", label: "Custom" },
];

export function AssignTaskDialog({
  open,
  onOpenChange,
  staffId,
  onSuccess,
}: AssignTaskDialogProps) {
  const [taskType, setTaskType] = useState<string>("");
  const [residentId, setResidentId] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);

  useEffect(() => {
    if (open) {
      fetchResidents();
      // Set default due time to current time + 1 hour
      const now = new Date();
      now.setHours(now.getHours() + 1);
      setDueTime(now.toISOString().slice(0, 16));
    } else {
      // Reset form when dialog closes
      setTaskType("");
      setResidentId("");
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const fetchResidents = async () => {
    try {
      const { residents } = await getResidents();
      setResidents(residents);
    } catch (error: any) {
      console.error("Error fetching residents:", error);
      toast.error("Cannot load residents list");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskType || !title || !dueTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AssignTaskPayload = {
        task_type: taskType,
        resident_id: residentId || undefined,
        due_time: new Date(dueTime).toISOString(),
        description: description || undefined,
        title: title,
      };

      await assignTaskToStaff(staffId, payload);
      toast.success("Task assigned successfully");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error assigning task:", error);
      toast.error(error.response?.data?.message || "Cannot assign task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Task to Staff</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label>Task Type *</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="border border-gray-200 bg-white">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent className="border border-gray-200 bg-white">
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="border border-gray-200 bg-white"
                required
              />
            </div>

            <div>
              <Label>Resident (Optional)</Label>
              <ResidentComboBox
                value={residentId}
                onSelect={setResidentId}
                placeholder="Select resident (optional)"
              />
            </div>

            <div>
              <Label>Due Date *</Label>
              <Input
                type="datetime-local"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="border border-gray-200 bg-white"
                required
              />
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
                className="border border-gray-200 bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#5985d8] text-white hover:bg-[#4a74c2]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </span>
              ) : (
                "Assign Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
