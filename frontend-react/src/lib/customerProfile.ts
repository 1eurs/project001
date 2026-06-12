// Returning-customer identity on this device. The profile autofills the checkout form;
// the device token (random UUID, created on first order) is the credential the backend
// accepts for reading back this device's profile and favorites — we never look up by phone.
//
// Besides the last-used values we keep a short history of distinct phones and cars
// (family phone vs. own, two cars, ...) so checkout can offer them as one-tap choices.
const PROFILE_KEY = 'cafeqr_profile';
const DEVICE_KEY = 'cafeqr_device';
const MAX_SAVED = 3;

export interface SavedCar {
  plateNum: string;
  plateCode: string;
  carColor: string;
}

export interface StoredProfile {
  name: string;
  phone: string; // last used
  plateNum: string; // last used car
  plateCode: string;
  carColor: string;
  phones?: string[]; // distinct, most recent first
  cars?: SavedCar[]; // distinct by plate, most recent first
}

export function getStoredProfile(): StoredProfile | null {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? (JSON.parse(s) as StoredProfile) : null;
  } catch {
    return null;
  }
}

/** Saves the values just used and folds them into the phone/car history. */
export function saveStoredProfile(p: Omit<StoredProfile, 'phones' | 'cars'>) {
  const prev = getStoredProfile();
  const phones = [p.phone, ...(prev?.phones ?? (prev?.phone ? [prev.phone] : []))]
    .filter((v, i, a) => v.trim() !== '' && a.indexOf(v) === i)
    .slice(0, MAX_SAVED);
  const prevCars = prev?.cars ?? (prev?.plateNum ? [{ plateNum: prev.plateNum, plateCode: prev.plateCode, carColor: prev.carColor }] : []);
  const cars = [{ plateNum: p.plateNum, plateCode: p.plateCode, carColor: p.carColor }, ...prevCars]
    .filter((c, i, a) => c.plateNum.trim() !== ''
      && a.findIndex((x) => x.plateNum === c.plateNum && x.plateCode === c.plateCode) === i)
    .slice(0, MAX_SAVED);
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...p, phones, cars }));
}

/** The device token, creating it when `create` is set. Null until the first order is placed. */
export function deviceToken(create = false): string | null {
  let t = localStorage.getItem(DEVICE_KEY);
  if (!t && create) {
    t = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, t);
  }
  return t;
}
