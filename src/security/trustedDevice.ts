const TRUSTED_DEVICE_KEY = "interventions-pcd:trusted-device";

export type TrustedDeviceRecord = { uid: string; token: string; confirmedAt: string };

export const getTrustedDevice = (): TrustedDeviceRecord | null => {
  try {
    const raw = window.localStorage.getItem(TRUSTED_DEVICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrustedDeviceRecord;
    if (!parsed.uid || !parsed.token || !parsed.confirmedAt) return null;
    return parsed;
  } catch { return null; }
};

export const isTrustedDevice = (uid: string): boolean => getTrustedDevice()?.uid === uid;

export const trustCurrentDevice = (uid: string): TrustedDeviceRecord => {
  const record: TrustedDeviceRecord = {
    uid,
    token: crypto.randomUUID(),
    confirmedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(TRUSTED_DEVICE_KEY, JSON.stringify(record));
  return record;
};

export const revokeCurrentDevice = (): void => window.localStorage.removeItem(TRUSTED_DEVICE_KEY);

export const TRUSTED_DEVICE_STORAGE_KEY = TRUSTED_DEVICE_KEY;
