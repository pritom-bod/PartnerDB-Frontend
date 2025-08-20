"use client";

import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api/partners/";

const emptyForm = {
  firm_name: "",
  hq: "",
  focus_area: "",
  contact: "",
  donor_experience: "",
  current_partnership_status: "",
};

export default function AdminUI() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRows = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setRows(data);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API}${editingId}/` : API;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setForm(emptyForm);
      setEditingId(null);
      await fetchRows();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editRow = (r) => {
    setForm({
      firm_name: r.firm_name || "",
      hq: r.hq || "",
      focus_area: r.focus_area || "",
      contact: r.contact || "",
      donor_experience: r.donor_experience || "",
      current_partnership_status: r.current_partnership_status || "",
    });
    setEditingId(r.id);
  };

  const del = async (id) => {
    if (!confirm("Delete this partner?")) return;
    const res = await fetch(`${API}${id}/`, { method: "DELETE" });
    if (!res.ok) {
      alert("Delete failed");
      return;
    }
    await fetchRows();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin UI</h1>

      {/* Form */}
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <input className="border px-3 py-2 rounded" placeholder="Firm Name *" required
          value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} />
        <input className="border px-3 py-2 rounded" placeholder="HQ (Country)"
          value={form.hq} onChange={(e) => setForm({ ...form, hq: e.target.value })} />
        <input className="border px-3 py-2 rounded" placeholder="Contact"
          value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <input className="border px-3 py-2 rounded" placeholder="Current Partnership Status"
          value={form.current_partnership_status}
          onChange={(e) => setForm({ ...form, current_partnership_status: e.target.value })} />
        <textarea className="border px-3 py-2 rounded md:col-span-2" rows={3} placeholder="Focus Area"
          value={form.focus_area} onChange={(e) => setForm({ ...form, focus_area: e.target.value })} />
        <textarea className="border px-3 py-2 rounded md:col-span-2" rows={3} placeholder="Donor Experience"
          value={form.donor_experience} onChange={(e) => setForm({ ...form, donor_experience: e.target.value })} />

        <div className="md:col-span-2 flex gap-2">
          <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" className="px-4 py-2 rounded border" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Firm Name","HQ","Focus Area","Contact","Donor Experience","Current Partnership Status","Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2 font-semibold border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border-b">{r.firm_name}</td>
                <td className="px-3 py-2 border-b">{r.hq || "-"}</td>
                <td className="px-3 py-2 border-b">{r.focus_area || "-"}</td>
                <td className="px-3 py-2 border-b">{r.contact || "-"}</td>
                <td className="px-3 py-2 border-b">{r.donor_experience || "-"}</td>
                <td className="px-3 py-2 border-b">{r.current_partnership_status || "-"}</td>
                <td className="px-3 py-2 border-b">
                  <button className="px-3 py-1 rounded border mr-2" onClick={() => editRow(r)}>Edit</button>
                  <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => del(r.id)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td className="px-3 py-6 text-center" colSpan={7}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
