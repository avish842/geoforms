import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Responses = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    /* ─── Fetch form + responses ─── */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [formRes, respRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/form/${formId}`, {
                        credentials: "include",
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/form/${formId}/responses`, {
                        credentials: "include",
                    }),
                ]);

                const formData = await formRes.json();
                const respData = await respRes.json();

                if (formRes.ok && formData.data) {
                    setForm(formData.data);
                } else {
                    setError("Could not load form.");
                    setLoading(false);
                    return;
                }

                if (respRes.ok && respData.data) {
                    setResponses(respData.data);
                } else {
                    setError(respData.message || "Could not load responses.");
                }
            } catch {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [formId]);

    /* ─── Helpers ─── */
    const fieldLabel = (fieldId) => {
        const field = form?.fields?.find((f) => f.id === fieldId);
        return field?.label || fieldId;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderValue = (value) => {
        if (value === null || value === undefined || value === "") return <span className="text-neutral-300">—</span>;
        if (Array.isArray(value)) return value.join(", ");
        if (typeof value === "object") {
            // File attachment
            if (value.url) {
                return (
                    <a
                        href={value.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                    >
                        {value.filename || "View file"}
                    </a>
                );
            }
            return JSON.stringify(value);
        }
        return String(value);
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-400 text-lg">Loading responses...</p>
                </div>
            </div>
        );
    }

    /* ─── Error ─── */
    if (error && !form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="bg-white rounded-xl border-2 border-red-200 p-8 max-w-md text-center shadow-sm">
                    <h2 className="text-xl font-semibold text-red-500 mb-2">Oops!</h2>
                    <p className="text-neutral-600">{error}</p>
                </div>
            </div>
        );
    }

    /* ─── Page ─── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate(`/form/${formId}/edit`)}
                            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-1 flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to editor
                        </button>
                        <h1 className="text-2xl font-semibold text-neutral-900">
                            Responses — {form?.title || "Untitled Form"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-50 text-blue-600 text-sm font-medium px-3 py-1.5 rounded-full">
                            {responses.length} response{responses.length !== 1 ? "s" : ""}
                        </span>
                        <button
                            onClick={() => navigate(`/form/${formId}/settings`)}
                            className="text-sm font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-xl transition-colors"
                        >
                            Settings
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl px-5 py-3 text-red-600 text-sm mb-6">
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {responses.length === 0 && (
                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-700 mb-1">No responses yet</h2>
                        <p className="text-neutral-400 mb-5">Share the form link to collect responses.</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/form/${formId}/fill`);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
                        >
                            Copy Share Link
                        </button>
                    </div>
                )}

                {/* Table view for wider screens */}
                {responses.length > 0 && form?.fields && (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block bg-white rounded-xl border-2 border-neutral-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-neutral-50 border-b border-neutral-200">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                                                #
                                            </th>
                                            {form.fields.map((field) => (
                                                <th
                                                    key={field.id}
                                                    className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide max-w-[200px] truncate"
                                                >
                                                    {field.label}
                                                </th>
                                            ))}
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                                                Submitted
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {responses.map((resp, idx) => (
                                            <tr
                                                key={resp._id}
                                                className="border-b border-neutral-100 hover:bg-blue-50/40 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-neutral-400 font-medium">
                                                    {idx + 1}
                                                </td>
                                                {form.fields.map((field) => {
                                                    const answer = resp.answers?.find((a) => a.fieldId === field.id);
                                                    return (
                                                        <td
                                                            key={field.id}
                                                            className="px-4 py-3 text-neutral-700 max-w-[200px] truncate"
                                                        >
                                                            {renderValue(answer?.value)}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-neutral-400 text-xs whitespace-nowrap">
                                                    {formatDate(resp.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile card list */}
                        <div className="md:hidden space-y-4">
                            {responses.map((resp, idx) => (
                                <div
                                    key={resp._id}
                                    className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedId(expandedId === resp._id ? null : resp._id)}
                                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                                    >
                                        <div>
                                            <span className="text-sm font-semibold text-neutral-800">
                                                Response #{idx + 1}
                                            </span>
                                            <p className="text-xs text-neutral-400 mt-0.5">
                                                {formatDate(resp.createdAt)}
                                            </p>
                                        </div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`w-4 h-4 text-neutral-400 transition-transform ${expandedId === resp._id ? "rotate-180" : ""}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {expandedId === resp._id && (
                                        <div className="border-t border-neutral-100 px-5 py-4 space-y-3">
                                            {resp.answers?.map((answer) => (
                                                <div key={answer.fieldId}>
                                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                                                        {fieldLabel(answer.fieldId)}
                                                    </p>
                                                    <p className="text-sm text-neutral-800 mt-0.5">
                                                        {renderValue(answer.value)}
                                                    </p>
                                                </div>
                                            ))}
                                            {resp.submitterEmail && (
                                                <div>
                                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Email</p>
                                                    <p className="text-sm text-neutral-800 mt-0.5">{resp.submitterEmail}</p>
                                                </div>
                                            )}
                                            {resp.location?.lat && (
                                                <div>
                                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Location</p>
                                                    <p className="text-sm text-neutral-800 mt-0.5">
                                                        {resp.location.lat.toFixed(5)}, {resp.location.lng.toFixed(5)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Responses;
