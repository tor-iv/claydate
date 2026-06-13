export const DB_PATH = process.env.DB_PATH ?? "./data/claydate.db";
export const UPLOAD_DIR = process.env.DATA_DIR ?? "./data/uploads";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_LOCATION = "Slo Slo Studio";

// Passcodes — override via env in production
export const FRIEND_PASSCODE = (process.env.FRIEND_PASSCODE ?? "sloslo").toLowerCase().trim();
export const GUEST_PASSCODE = (process.env.GUEST_PASSCODE ?? "throw").toLowerCase().trim();
