import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Tag, X, Percent, IndianRupee, Copy } from "lucide-react";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const defaultForm = {
  code: "",
  type: "percentage" as "percentage" | "flat",
  value: "",
  minOrder: "",
  maxUses: "",
  active: true,
  expiresAt: "",
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCoupons = async () => {
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      type: c.type as "percentage" | "flat",
      value: String(c.value),
      minOrder: String(c.minOrder),
      maxUses: c.maxUses > 0 ? String(c.maxUses) : "",
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : "",
    });
    setEditId(c.id);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.code.trim()) { setError("Coupon code is required"); return; }
    if (!form.value || Number(form.value) <= 0) { setError("Discount value must be > 0"); return; }
    if (form.type === "percentage" && Number(form.value) > 100) { setError("Percentage cannot exceed 100%"); return; }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxUses: form.maxUses ? Number(form.maxUses) : 0,
        active: form.active,
        expiresAt: form.expiresAt || null,
      };

      if (editId) {
        const prev = [...coupons];
        setCoupons(coupons.map(c => c.id === editId ? { ...c, ...payload } : c));
        setShowForm(false);
        try {
          await adminApi.updateCoupon(editId, payload);
          showToast("Coupon updated");
        } catch (err2: any) {
          setCoupons(prev);
          showToast(err2.message || "Failed to update", "error");
        }
      } else {
        const tempId = -Date.now();
        const tempCoupon = { ...payload, id: tempId, usedCount: 0, createdAt: new Date().toISOString() } as any;
        setCoupons(prev => [...prev, tempCoupon]);
        setShowForm(false);
        try {
          const created = await adminApi.createCoupon(payload);
          setCoupons(prev => prev.map(c => c.id === tempId ? { ...tempCoupon, ...created } : c));
          showToast("Coupon created");
        } catch (err2: any) {
          setCoupons(prev => prev.filter(c => c.id !== tempId));
          showToast(err2.message || "Failed to create", "error");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this coupon?")) return;
    const prev = [...coupons];
    setCoupons(coupons.filter(c => c.id !== id));
    try {
      await adminApi.deleteCoupon(id);
      showToast("Coupon deleted");
    } catch (err: any) { setCoupons(prev); showToast(err.message || "Failed to delete", "error"); }
  };

  const handleToggle = async (c: Coupon) => {
    const prev = [...coupons];
    setCoupons(coupons.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
    try {
      await adminApi.updateCoupon(c.id, { active: !c.active });
      showToast(c.active ? "Coupon disabled" : "Coupon enabled");
    } catch (err: any) { setCoupons(prev); showToast(err.message || "Failed to update", "error"); }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Coupons</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button onClick={openCreate} className="h-10 px-4 text-[13px] font-bold rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a]">
          <Plus className="w-4 h-4 mr-1.5" /> Add Coupon
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="text-[18px] font-bold text-gray-900 mb-5">{editId ? "Edit Coupon" : "Create Coupon"}</h2>

            {error && <div className="bg-red-50 text-red-600 text-[12px] font-medium p-3 rounded-xl mb-4">{error}</div>}

            <div className="space-y-4">
              <div>
                <Label className="text-[13px] font-medium text-gray-700">Coupon Code</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME20"
                  className="mt-1.5 h-10 rounded-xl uppercase font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[13px] font-medium text-gray-700">Discount Type</Label>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: "percentage" })}
                      className={`flex-1 h-10 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 border-2 transition-all ${form.type === "percentage" ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-200 text-gray-600"}`}
                    >
                      <Percent className="w-3.5 h-3.5" /> Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: "flat" })}
                      className={`flex-1 h-10 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 border-2 transition-all ${form.type === "flat" ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-200 text-gray-600"}`}
                    >
                      <IndianRupee className="w-3.5 h-3.5" /> Flat
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-[13px] font-medium text-gray-700">
                    Value {form.type === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="number"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === "percentage" ? "e.g. 10" : "e.g. 50"}
                    className="mt-1.5 h-10 rounded-xl"
                    min="0"
                    max={form.type === "percentage" ? "100" : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[13px] font-medium text-gray-700">Min. Order (₹)</Label>
                  <Input
                    type="number"
                    value={form.minOrder}
                    onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="0"
                    className="mt-1.5 h-10 rounded-xl"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-[13px] font-medium text-gray-700">Max Uses</Label>
                  <Input
                    type="number"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    className="mt-1.5 h-10 rounded-xl"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[13px] font-medium text-gray-700">Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? "bg-[#0c831f]" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${form.active ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
                <span className="text-[13px] font-medium text-gray-700">{form.active ? "Active" : "Inactive"}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 h-10 rounded-xl text-[13px] font-medium">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-xl text-[13px] font-bold bg-[#0c831f] hover:bg-[#0a6f1a]">
                  {saving ? "Saving..." : editId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-[16px] font-bold text-gray-900 mb-1">No coupons yet</h3>
          <p className="text-[13px] text-gray-500 mb-4">Create your first coupon to offer discounts to customers.</p>
          <Button onClick={openCreate} className="h-10 px-5 text-[13px] font-bold rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a]">
            <Plus className="w-4 h-4 mr-1.5" /> Create Coupon
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 transition-all ${c.active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${c.active ? "bg-[#e6f4ea]" : "bg-gray-100"}`}>
                    <Tag className={`w-4 h-4 ${c.active ? "text-[#0c831f]" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[15px] text-gray-900 tracking-wider">{c.code}</span>
                      <button onClick={() => navigator.clipboard.writeText(c.code)} className="p-0.5 hover:bg-gray-100 rounded">
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="bg-[#f8f9fa] rounded-lg p-3 mb-3">
                <div className="text-center">
                  <span className="text-[28px] font-extrabold text-gray-900">
                    {c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}
                  </span>
                  <p className="text-[11px] text-gray-500 font-medium">OFF</p>
                </div>
              </div>

              <div className="space-y-1.5 text-[12px] text-gray-600">
                {c.minOrder > 0 && (
                  <div className="flex justify-between">
                    <span>Min. order</span>
                    <span className="font-medium text-gray-900">₹{c.minOrder}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Usage</span>
                  <span className="font-medium text-gray-900">{c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : " / ∞"}</span>
                </div>
                {c.expiresAt && (
                  <div className="flex justify-between">
                    <span>Expires</span>
                    <span className="font-medium text-gray-900">{new Date(c.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleToggle(c)}
                  className={`w-full h-8 rounded-lg text-[12px] font-bold transition-colors ${c.active ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-[#e6f4ea] text-[#0c831f] hover:bg-[#d4edda]"}`}
                >
                  {c.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-[13px] font-semibold ${toast.type === "error" ? "bg-red-500 text-white" : "bg-[#0c831f] text-white"}`}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}
