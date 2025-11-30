import React, { useState, createContext, useEffect } from "react";
import {
  getAccessTokenFromLS,
  getProfileFromLS,
  LocalStorageEventTarget,
  isValidAccessToken,
} from "@/utils/local-storage";
import User from "@/types/user";

export interface AppContextInterface {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  profile: User | null;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
  emailToVerify: string | null;
  setEmailToVerify: React.Dispatch<React.SetStateAction<string | null>>;
  reset: () => void;
  familyUnreadNotifications?: number;
  setFamilyUnreadNotifications?: React.Dispatch<React.SetStateAction<number>>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const getInitialAppContext: () => AppContextInterface = () => ({
  isAuthenticated: isValidAccessToken(getAccessTokenFromLS()),
  setIsAuthenticated: () => null,
  profile: getProfileFromLS(),
  setProfile: () => null,
  emailToVerify: null,
  setEmailToVerify: () => null,
  reset: () => null,
  familyUnreadNotifications: 0,
  setFamilyUnreadNotifications: () => null,
});
const initialState = getInitialAppContext();
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext<AppContextInterface>(initialState);

export const AppProvider = ({
  children,
  defaultValue = initialState,
}: {
  children: React.ReactNode;
  defaultValue?: AppContextInterface;
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    defaultValue.isAuthenticated
  );
  const [profile, setProfile] = useState<User | null>(defaultValue.profile);
  const [emailToVerify, setEmailToVerify] = useState<string | null>(
    defaultValue.emailToVerify
  );
  const [familyUnreadNotifications, setFamilyUnreadNotifications] =
    useState<number>(defaultValue.familyUnreadNotifications ?? 0);
  const reset = () => {
    setIsAuthenticated(false);
    setProfile(null);
  };

  useEffect(() => {
    const handler = () => {
      setIsAuthenticated(false);
      setProfile(null);
    };
    LocalStorageEventTarget.addEventListener("clearLS", handler);
    return () =>
      LocalStorageEventTarget.removeEventListener("clearLS", handler);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        profile,
        setProfile,
        emailToVerify,
        setEmailToVerify,
        reset,
        familyUnreadNotifications,
        setFamilyUnreadNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
