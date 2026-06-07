export interface CheckoutState {
  couponCode: string;
  couponApplied: boolean;
  couponDiscount: number;
  couponMessage: string;
  selectedAddressId?: number;
  addressLabel?: string;
  addressFull?: string;
  addressLandmark?: string;
  addressCity?: string;
  addressPincode?: string;
  name: string;
  phone: string;
  selectedDay: number;
  selectedSlot: number;
  deliverySlotLabel: string;
  paymentMethod: string;
  upiId: string;
  deliveryInstructions: string;
  deliveryFee: number;
}

const KEY = "mks_checkout";

const DEFAULTS: CheckoutState = {
  couponCode: "", couponApplied: false, couponDiscount: 0, couponMessage: "",
  name: "", phone: "",
  selectedDay: 0, selectedSlot: 0, deliverySlotLabel: "",
  paymentMethod: "cash", upiId: "", deliveryInstructions: "",
  deliveryFee: 0,
};

export function getCheckoutState(): CheckoutState {
  try {
    const s = sessionStorage.getItem(KEY);
    return s ? { ...DEFAULTS, ...JSON.parse(s) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

export function saveCheckoutState(patch: Partial<CheckoutState>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...getCheckoutState(), ...patch }));
  } catch {}
}

export function clearCheckoutState(): void {
  try { sessionStorage.removeItem(KEY); } catch {}
}
