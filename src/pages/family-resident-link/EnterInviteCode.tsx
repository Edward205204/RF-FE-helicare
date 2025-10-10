import React, { useState } from "react";

const PRIMARY = "#5985D8";
const BG = "#F4F6FB";
const TEXT = "#1F2937";
const MUTED = "#6B7280";

export default function EnterInviteCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("⚠️ Invite code must be 6 characters");
      return;
    }
    alert(`✅ Code ${code.toUpperCase()} is valid! (Demo success 🎉)`);
    setError("");
  };

  const handleScanQR = () => {
    alert("📷 QR scanning feature will be supported soon!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Logo / Title */}
        <div className="text-2xl font-bold text-[#5985D8]">HeLiCare</div>
        <h1 className="mt-3 text-2xl font-medium" style={{ color: TEXT }}>
          Enter Invite Code to Join HeLiCare
        </h1>

        <p className="mt-2 text-sm" style={{ color: MUTED }}>
          Please enter the 6-character code you received from our staff.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center gap-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="Enter invite code"
            className="w-full text-center text-2xl py-3 rounded-lg border focus:outline-none focus:ring-2 transition"
            style={{
              borderColor: error ? "red" : "#d1d5db",
              color: TEXT,
              letterSpacing: "0.2em", // reduced from 0.4em to 0.2em
            }}
          />

          {error && <div className="text-sm text-red-500 mt-1">{error}</div>}

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-medium text-lg transition hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            Confirm
          </button>

          {/* Divider */}
          <div className="flex items-center w-full my-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-3 text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* QR Scan Button */}
          <button
            type="button"
            onClick={handleScanQR}
            className="w-full py-3 rounded-lg border font-medium text-[#5985D8] hover:bg-[#f0f4ff] transition"
            style={{ borderColor: PRIMARY }}
          >
            📷 Scan QR Code Instead
          </button>
        </form>

        {/* Note */}
        <p className="mt-4 text-xs text-gray-500">
          💡 If you don’t have a code yet, please contact HeLiCare staff.
        </p>
      </div>
    </div>
  );
}