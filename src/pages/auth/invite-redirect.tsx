import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import path from "@/constants/path";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

type DecodedInviteToken = {
  role?: string;
  token_type?: string;
};

const decodeTokenSafely = (token: string): DecodedInviteToken | null => {
  try {
    const [header, payload] = token.split(".");
    if (!header || !payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as DecodedInviteToken;
  } catch {
    return null;
  }
};

const InviteRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams]
  );

  useEffect(() => {
    if (!token) {
      setError("Token not found in URL.");
      return;
    }

    const decoded = decodeTokenSafely(token);
    if (!decoded?.token_type) {
      setError("Token is invalid or expired.");
      return;
    }

    if (decoded.token_type === "StaffInviteToken") {
      navigate(`${path.verifyStaffInvite}?token=${encodeURIComponent(token)}`, {
        replace: true,
      });
      return;
    }

    if (decoded.token_type === "AdminInviteToken") {
      toast.info("Admin invitation is not supported on this interface.");
      setError("Admin invitation is not supported.");
      return;
    }

    setError("Unsupported token type.");
  }, [token, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="rounded-xl border border-red-100 bg-white px-6 py-4 text-center shadow-md">
          <p className="text-base font-semibold text-red-600">{error}</p>
          <p className="mt-2 text-sm text-gray-500">
            Please check the link in your email or contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-md">
        <Loader2 className="h-5 w-5 animate-spin text-[#5985d8]" />
        <p className="text-sm text-gray-600">Redirecting, please wait...</p>
      </div>
    </div>
  );
};

export default InviteRedirect;
