import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, "../../.whatsapp-auth");

interface WhatsAppState {
  status: "disconnected" | "qr_ready" | "connecting" | "connected";
  qrDataUrl: string | null;
  phoneNumber: string | null;
  connectedAt: string | null;
  error: string | null;
}

let sock: any = null;
let state: WhatsAppState = {
  status: "disconnected",
  qrDataUrl: null,
  phoneNumber: null,
  connectedAt: null,
  error: null,
};
let stateListeners: Array<(s: WhatsAppState) => void> = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function notifyListeners() {
  for (const fn of stateListeners) {
    try { fn({ ...state }); } catch {}
  }
}

export function onStateChange(fn: (s: WhatsAppState) => void) {
  stateListeners.push(fn);
  return () => {
    stateListeners = stateListeners.filter(l => l !== fn);
  };
}

export function getWhatsAppState(): WhatsAppState {
  return { ...state };
}

async function credentialsExist(): Promise<boolean> {
  const fs = await import("fs/promises");
  try {
    await fs.access(path.join(AUTH_DIR, "creds.json"));
    return true;
  } catch {
    return false;
  }
}

export async function startWhatsAppSession(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (sock) {
    try { sock.end(undefined); } catch {}
    sock = null;
  }

  state = { status: "connecting", qrDataUrl: null, phoneNumber: null, connectedAt: null, error: null };
  notifyListeners();

  try {
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      browser: ["Store", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2, color: { dark: "#075e54", light: "#ffffff" } });
          state = { ...state, status: "qr_ready", qrDataUrl: dataUrl, error: null };
          notifyListeners();
        } catch (err) {
          console.error("QR generation error:", err);
        }
      }

      if (connection === "open") {
        const me = sock?.user;
        const phoneNum = me?.id ? `+${me.id.split(":")[0].split("@")[0]}` : null;
        state = {
          status: "connected",
          qrDataUrl: null,
          phoneNumber: phoneNum,
          connectedAt: new Date().toISOString(),
          error: null,
        };
        notifyListeners();
        console.log("[WhatsApp] Connected as", phoneNum);
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log("[WhatsApp] Connection closed, status:", statusCode, "reconnect:", shouldReconnect);

        if (shouldReconnect) {
          state = { ...state, status: "connecting", qrDataUrl: null, error: null };
          notifyListeners();
          reconnectTimer = setTimeout(() => startWhatsAppSession(), 5000);
        } else {
          const fs = await import("fs/promises");
          try { await fs.rm(AUTH_DIR, { recursive: true, force: true }); } catch {}
          state = { status: "disconnected", qrDataUrl: null, phoneNumber: null, connectedAt: null, error: "Logged out from WhatsApp" };
          sock = null;
          notifyListeners();
        }
      }
    });

  } catch (err: any) {
    console.error("[WhatsApp] Init error:", err);
    state = { status: "disconnected", qrDataUrl: null, phoneNumber: null, connectedAt: null, error: err.message || "Failed to initialize" };
    sock = null;
    notifyListeners();
    reconnectTimer = setTimeout(() => startWhatsAppSession(), 10000);
  }
}

export async function autoReconnectIfCredentialsExist(): Promise<void> {
  if (await credentialsExist()) {
    console.log("[WhatsApp] Found saved credentials, reconnecting automatically...");
    await startWhatsAppSession();
  }
}

export async function disconnectWhatsApp(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sock) {
    try { await sock.logout(); } catch {}
    try { sock.end(undefined); } catch {}
    sock = null;
  }
  const fs = await import("fs/promises");
  try { await fs.rm(AUTH_DIR, { recursive: true, force: true }); } catch {}
  state = { status: "disconnected", qrDataUrl: null, phoneNumber: null, connectedAt: null, error: null };
  notifyListeners();
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!sock || state.status !== "connected") {
    return { success: false, error: "WhatsApp not connected" };
  }

  try {
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "91" + cleanPhone.substring(1);
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send" };
  }
}

export async function sendWhatsAppDocument(phone: string, buffer: Buffer, fileName: string, caption?: string): Promise<{ success: boolean; error?: string }> {
  if (!sock || state.status !== "connected") {
    return { success: false, error: "WhatsApp not connected" };
  }
  try {
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "91" + cleanPhone.substring(1);
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { document: buffer, mimetype: "application/pdf", fileName, caption: caption || "" });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send document" };
  }
}

export function isWhatsAppConnected(): boolean {
  return state.status === "connected";
}
