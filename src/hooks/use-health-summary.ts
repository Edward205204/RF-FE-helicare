import { useQuery } from "@tanstack/react-query";
import {
  getHealthSummary,
  type HealthSummaryResponse,
} from "@/apis/assessment.api";

export const useHealthSummary = (residentId?: string | null) =>
  useQuery<HealthSummaryResponse, Error>({
    queryKey: ["health-summary", residentId],
    queryFn: async () => {
      if (!residentId) {
        throw new Error("Resident id is required");
      }
      const response = await getHealthSummary(residentId);
      return response.data;
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 5,
  });

