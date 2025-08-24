"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API = "http://127.0.0.1:8000/api";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [hqs, setHqs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const DEFAULT_PAGE_SIZE = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [hq, setHq] = useState("");
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  // For popup
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  //  search and filter + pagination
  const fetchRows = async ({ q = "", hq = "", page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (hq) params.set("hq", hq);
      params.set("page", page);
      params.set("page_size", pageSize);

      const res = await fetch(`${API}/partners/?${params.toString()}`);
      const data = await res.json();

      setRows(data.results || []);
      setTotalPages(Math.ceil(data.count / pageSize));
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
    fetchRows({ q: query, hq, page: currentPage });
    fetchHqs();
  }, [currentPage]);

  const onSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRows({ q: query, hq, page: 1 });
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

  //Edit/Delete Logic 

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setFormData(row);
    setShowModal(true);
    setEditMode(false);
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/partners/${selectedRow.id}/`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== selectedRow.id));
      setShowModal(false);
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API}/partners/${selectedRow.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const updated = await res.json();

      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowModal(false);
    } catch (err) {
      console.error("Error updating:", err);
    }
  };

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
            ) : Array.isArray(rows) && rows.length ? (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="odd:bg-white even:bg-gray-50 cursor-pointer hover:bg-blue-50"
                  onClick={() => handleRowClick(r)}
                >
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

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal part*/}
{showModal && selectedRow && (
  <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] pointer-events-auto">
      {!editMode ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Manage Partner</h2>
          <p className="mb-4">Firm: {selectedRow.firm_name}</p>
          <div className="flex justify-end gap-3">
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded"
              onClick={() => setEditMode(true)}
            >
              Edit
            </button>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Edit Partner</h2>
          <div className="flex flex-col gap-3">
            <input
              className="border px-3 py-2 rounded"
              value={formData.firm_name}
              onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              value={formData.hq || ""}
              onChange={(e) => setFormData({ ...formData, hq: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              value={formData.focus_area || ""}
              onChange={(e) => setFormData({ ...formData, focus_area: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              value={formData.contact || ""}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              value={formData.donor_experience || ""}
              onChange={(e) => setFormData({ ...formData, donor_experience: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              value={formData.current_partnership_status || ""}
              onChange={(e) => setFormData({ ...formData, current_partnership_status: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleUpdate}
            >
              Update
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}


      {/* Admin link */}
      <div className="mt-4">
        <a href="/admin-ui" className="underline">
          Go to Admin UI
        </a>
      </div>
    </div>
  );
}
