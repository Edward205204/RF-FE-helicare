import request from "@/utils/request";

export interface FamilyLastSeenResponse {
  last_seen: string | null;
}

export interface FamilyReadIdsResponse {
  ids: string[];
}

export const getFamilyNotificationsLastSeen = async () => {
  const response = await request.get<{
    message: string;
    data: FamilyLastSeenResponse;
  }>("/api/notifications/family/last-seen");
  return response.data;
};

export const markFamilyNotificationsAllRead = async () => {
  const response = await request.post<{
    message: string;
    data: FamilyLastSeenResponse;
  }>("/api/notifications/family/mark-all-read");
  return response.data;
};

export const getFamilyReadNotificationIds = async () => {
  const response = await request.get<{
    message: string;
    data: FamilyReadIdsResponse;
  }>("/api/notifications/family/read-ids");
  return response.data;
};

export const markFamilyNotificationsRead = async (ids: string[]) => {
  const response = await request.post<{
    message: string;
    data: FamilyReadIdsResponse;
  }>("/api/notifications/family/mark-read", { ids });
  return response.data;
};
