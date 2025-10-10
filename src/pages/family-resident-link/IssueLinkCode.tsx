import React, { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const PRIMARY = "#5985D8";
const BG = "#F4F6FB";
const TEXT = "#1F2937";
const MUTED = "#6B7280";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid I, O, 0, 1
function generateCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function formatCode(code: string) {
  if (!code) return "";
  return code.slice(0, 3) + " " + code.slice(3);
}

function formatCountdown(msLeft: number) {
  if (msLeft <= 0) return "00:00";
  const totalSec = Math.ceil(msLeft / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function IssueLinkCode() {
  // config
  const EXPIRE_MINUTES = 5;

  // state
  const [code, setCode] = useState<string>(() => generateCode());
  const [createdAt, setCreatedAt] = useState<number>(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // expiration time
  const expiresAt = useMemo(() => createdAt + EXPIRE_MINUTES * 60 * 1000, [createdAt]);
  const link = useMemo(() => `https://helicare.app/invite/${code}`, [code]);

  // countdown tick
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // copy link
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setToast("Link copied");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast("Failed to copy. Please copy manually.");
      setTimeout(() => setToast(null), 2500);
    }
  }, [link]);

  // regenerate code
  const handleRegenerate = useCallback(async () => {
    const newCode = generateCode();
    setCode(newCode);
    setCreatedAt(Date.now());
    setCopied(false);
    setToast("New code generated");
    setTimeout(() => setToast(null), 1400);

    try {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 400)); // simulate API
    } catch (e) {
      console.error(e);
      setToast("Server error while saving code");
    } finally {
      setSaving(false);
    }
  }, []);

  const expired = Date.now() >= expiresAt;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-full max-w-2xl mx-6">
        <div
          className="bg-white rounded-2xl shadow-soft p-10"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-[#5985D8]">HeLiCare</div>
            <h1 className="mt-3 text-2xl font-semibold" style={{ color: TEXT }}>
              Generate Link Code
            </h1>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              Create a secure invite link for family members to join HeLiCare.
            </p>
          </div>

          {/* Main content */}
          <div className="flex flex-col items-center gap-6">
            <div
              className="rounded-xl p-6 bg-white"
              style={{
                border: "1px solid rgba(99,102,241,0.03)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
              }}
            >
              {/* QR */}
              <div className="mx-auto w-52 h-52 bg-white rounded-lg flex items-center justify-center">
                <QRCodeCanvas value={link} size={200} bgColor="#ffffff" fgColor="#0f172a" level="Q" />
              </div>

              {/* Invite code */}
              <div className="mt-4 text-center">
                <div className="text-sm text-[#5985D8] font-medium mb-2">Invite Code</div>
                <div className="text-3xl font-mono tracking-widest" style={{ color: TEXT }}>
                  {formatCode(code)}
                </div>

                {/* Full link */}
                <div className="mt-3 text-xs text-[#6b7280] break-words max-w-[420px]">
                  <a
                    href={link}
                    className="underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(link, "_blank");
                    }}
                    style={{ color: MUTED }}
                  >
                    {link}
                  </a>
                </div>

                {/* Expiration */}
                <div className="mt-3 text-sm text-[#6b7280] flex items-center gap-3 justify-center">
                  <span>Expires in</span>
                  <span className="font-medium" style={{ color: PRIMARY }}>
                    {formatCountdown(Math.max(0, expiresAt - Date.now()))}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mt-2">
              <button
                onClick={handleCopy}
                className="px-6 py-2 rounded-lg text-white font-medium transition"
                style={{
                  background: PRIMARY,
                }}
                aria-label="Copy invite link"
              >
                {copied ? "Copied" : "Copy Link"}
              </button>

              <button
                onClick={handleRegenerate}
                disabled={saving}
                className="px-6 py-2 rounded-lg border text-[#5985D8] font-medium transition"
                style={{
                  borderColor: PRIMARY,
                }}
                aria-label="Regenerate code"
              >
                {saving ? "Generating..." : "Generate New Code"}
              </button>
            </div>

            {/* Small note */}
            <div className="text-xs text-[#6b7280] mt-2 text-center">
              💡 Tip: share the code or QR. The link will expire automatically.
            </div>

            {/* Toast notification */}
            {toast && (
              <div
                className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-white"
                style={{ background: PRIMARY }}
              >
                {toast}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
