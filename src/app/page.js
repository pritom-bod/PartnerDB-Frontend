"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API = "http://127.0.0.1:8000/api";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [hqs, setHqs] = useState([]);
  const [query, setQuery] = useState("");
  const [hq, setHq] = useState("");
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  // Fetch rows with search and filter
  const fetchRows = async ({ q = "", hq = "" } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (hq) params.set("hq", hq);

      const res = await fetch(`${API}/partners/?${params.toString()}`);
      const data = await res.json();
      setRows(data); // Pagination removed, data directly set
    } catch (err) {
      console.error("Error fetching rows:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch HQ options
  const fetchHqs = async () => {
    try {
      const res = await fetch(`${API}/hqs/`);
      const data = await res.json();
      const uniqueHqs = Array.from(new Set(data)).sort();
      setHqs(uniqueHqs);
    } catch (err) {
      console.error("Error fetching HQs:", err);
    }
  };

  useEffect(() => {
    fetchRows({});
    fetchHqs();
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchRows({ q: query, hq });
  };

  // WebSocket for live updates
  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/partners/");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const { action, partner } = msg;

      setRows((prev) => {
        if (action === "create") {
          const exists = prev.some((p) => p.id === partner.id);
          return exists ? prev.map((p) => (p.id === partner.id ? partner : p)) : [partner, ...prev];
        } else if (action === "update") {
          return prev.map((p) => (p.id === partner.id ? partner : p));
        } else if (action === "delete") {
          return prev.filter((p) => p.id !== partner.id);
        }
        return prev;
      });
    };

    return () => ws.close();
  }, []);

  const headers = useMemo(
    () => ["Firm Name", "HQ", "Focus Area", "Contact", "Donor Experience", "Current Partnership Status"],
    []
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Partner Database</h1>

      {/* Search + Filter */}
      <form onSubmit={onSearch} className="flex gap-3 mb-4 flex-wrap">
        <input
          className="border px-3 py-2 rounded w-full md:w-auto flex-1"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={hq}
          onChange={(e) => setHq(e.target.value)}
        >
          <option value="">All HQ</option>
          {hqs.map((c, idx) => (
            <option key={`${c}-${idx}`} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
      </form>

      {/* Table */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={headers.length}>
                  Loading...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 border-b">{r.firm_name}</td>
                  <td className="px-3 py-2 border-b">{r.hq || "-"}</td>
                  <td className="px-3 py-2 border-b">{r.focus_area || "-"}</td>
                  <td className="px-3 py-2 border-b">{r.contact || "-"}</td>
                  <td className="px-3 py-2 border-b">{r.donor_experience || "-"}</td>
                  <td className="px-3 py-2 border-b">{r.current_partnership_status || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={headers.length}>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin UI link */}
      <div className="mt-4">
        <a href="/admin-ui" className="underline">
          Go to Admin UI
        </a>
      </div>
    </div>
  );
}
