export const LocalStorageEventTarget = new EventTarget();

export function setAccessTokenToLS(access: string) {
  return localStorage.setItem("access_token", access);
}

export function getAccessTokenFromLS() {
  const raw = localStorage.getItem("access_token");
  if (!raw) return "";
  // Avoid treating string literals "null"/"undefined" as valid tokens
  if (raw === "null" || raw === "undefined") return "";
  return raw;
}

export function removeLocalStorage() {
  localStorage.clear();
  const clearEvent = new Event("clearLS");
  LocalStorageEventTarget.dispatchEvent(clearEvent);
}

export function setProfileToLS(profile: object) {
  const profileString = JSON.stringify(profile);
  return profileString ? localStorage.setItem("profile", profileString) : null;
}

export function getProfileFromLS() {
  const profile = localStorage.getItem("profile");
  return profile ? JSON.parse(profile) : null;
}

export function isValidAccessToken(token: string): boolean {
  if (!token) return false;
  if (token === "null" || token === "undefined") return false;
  return true;
}
