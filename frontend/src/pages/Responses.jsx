import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Responses = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    // ─── Core State ───
    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // ─── UI & Filter State ───
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all"); // "all" | "today" | "7days" | "30days"
    const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"
    const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeResponseId, setActiveResponseId] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportNotice, setExportNotice] = useState(null);

    const drawerRef = useRef(null);

    /* ─── Fetch Data ─── */
    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

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
                setError(formData.message || "Failed to load form details.");
                return;
            }

            if (respRes.ok && respData.data) {
                setResponses(respData.data);
            } else {
                setError(respData.message || "Failed to load responses.");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Network connection issue. Please check your internet and try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [formId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ─── Keyboard shortcuts (Esc closes drawer) ─── */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && activeResponseId) {
                setActiveResponseId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeResponseId]);

    /* ─── Submitter Information Helpers ─── */
    const getSubmitterName = useCallback((resp) => {
        if (!resp) return "Anonymous";
        if (resp.submitterId?.fullName) return resp.submitterId.fullName;
        if (resp.submitterEmail) return resp.submitterEmail.split("@")[0];
        return "Anonymous Submitter";
    }, []);

    const getSubmitterEmail = useCallback((resp) => {
        if (!resp) return "—";
        return resp.submitterId?.email || resp.submitterEmail || "No email";
    }, []);

    const getSubmitterUsername = useCallback((resp) => {
        return resp.submitterId?.username || null;
    }, []);

    const getSubmitterAvatar = useCallback((resp) => {
        return resp.submitterId?.avatar || null;
    }, []);

    const getSubmitterInitials = useCallback((resp) => {
        const name = getSubmitterName(resp);
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }, [getSubmitterName]);

    /* ─── Field Label & Value Extractors ─── */
    const fieldLabel = useCallback(
        (fieldId) => {
            const field = form?.fields?.find((f) => f.id === fieldId);
            return field?.label || fieldId;
        },
        [form]
    );

    const getFieldById = useCallback(
        (fieldId) => {
            return form?.fields?.find((f) => f.id === fieldId);
        },
        [form]
    );

    const getPlainValue = useCallback((value) => {
        if (value === null || value === undefined || value === "") return "";
        if (Array.isArray(value)) {
            return value
                .map((v) => (typeof v === "object" && v?.url ? v.filename || v.url : String(v)))
                .join(", ");
        }
        if (typeof value === "object") {
            if (value.url) return value.filename ? `${value.filename} (${value.url})` : value.url;
            return JSON.stringify(value);
        }
        return String(value);
    }, []);

    /* ─── Format Dates ─── */
    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return "—";
        const now = new Date();
        const past = new Date(dateStr);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return "Just now";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return past.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    };

    /* ─── Filtered and Sorted Responses ─── */
    const processedResponses = useMemo(() => {
        let result = [...responses];

        // 1. Date Filter
        if (dateFilter !== "all") {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            if (dateFilter === "today") {
                result = result.filter((r) => new Date(r.createdAt).getTime() >= todayStart);
            } else if (dateFilter === "7days") {
                const weekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
                result = result.filter((r) => new Date(r.createdAt).getTime() >= weekAgo);
            } else if (dateFilter === "30days") {
                const monthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
                result = result.filter((r) => new Date(r.createdAt).getTime() >= monthAgo);
            }
        }

        // 2. Search Query (matches name, email, username, or any answer)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter((resp) => {
                const name = getSubmitterName(resp).toLowerCase();
                const email = getSubmitterEmail(resp).toLowerCase();
                const username = (getSubmitterUsername(resp) || "").toLowerCase();
                if (name.includes(q) || email.includes(q) || username.includes(q)) return true;

                // Check in answers
                return resp.answers?.some((ans) => {
                    const text = getPlainValue(ans.value).toLowerCase();
                    return text.includes(q);
                });
            });
        }

        // 3. Sorting
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [responses, dateFilter, searchQuery, sortOrder, getSubmitterName, getSubmitterEmail, getSubmitterUsername, getPlainValue]);

    /* ─── Stats ─── */
    const stats = useMemo(() => {
        const total = responses.length;
        const now = new Date();
        const todayCount = responses.filter((r) => {
            const d = new Date(r.createdAt);
            return d.toDateString() === now.toDateString();
        }).length;

        const geolocatedCount = responses.filter((r) => r.location?.lat && r.location?.lng).length;
        const latestTime = responses[0]?.createdAt ? formatRelativeTime(responses[0].createdAt) : "—";

        return {
            total,
            todayCount,
            geolocatedCount,
            latestTime,
        };
    }, [responses]);

    /* ─── Selection Management ─── */
    const isAllSelected = processedResponses.length > 0 && selectedIds.size === processedResponses.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < processedResponses.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(processedResponses.map((r) => r._id)));
        }
    };

    const toggleSelectRow = (id, e) => {
        e?.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    /* ─── Active Response for Drawer & Navigation ─── */
    const activeResponse = useMemo(() => {
        if (!activeResponseId) return null;
        return responses.find((r) => r._id === activeResponseId) || null;
    }, [responses, activeResponseId]);

    const activeIndex = useMemo(() => {
        if (!activeResponseId) return -1;
        return processedResponses.findIndex((r) => r._id === activeResponseId);
    }, [processedResponses, activeResponseId]);

    const handlePrevResponse = () => {
        if (activeIndex > 0) {
            setActiveResponseId(processedResponses[activeIndex - 1]._id);
        }
    };

    const handleNextResponse = () => {
        if (activeIndex >= 0 && activeIndex < processedResponses.length - 1) {
            setActiveResponseId(processedResponses[activeIndex + 1]._id);
        }
    };

    /* ─── Excel Export (Dynamic import for speed) ─── */
    const downloadExcel = async () => {
        if (!form?.fields || responses.length === 0) return;

        setIsExporting(true);
        setExportNotice("Preparing Excel workbook...");

        try {
            // Lazy load xlsx module on demand so main bundle stays small and fast
            const XLSX = await import("xlsx");

            const dataToExport = selectedIds.size > 0
                ? processedResponses.filter((r) => selectedIds.has(r._id))
                : processedResponses;

            const rows = dataToExport.map((resp, idx) => {
                const row = {
                    "#": idx + 1,
                    "Response ID": resp._id || "",
                    "Submitted At": resp.createdAt ? formatDate(resp.createdAt) : "",
                    "Submitter Name": getSubmitterName(resp),
                    "Submitter Email": getSubmitterEmail(resp),
                    "Submitter Username": getSubmitterUsername(resp) ? `@${getSubmitterUsername(resp)}` : "",
                    "Latitude": resp.location?.lat ?? "",
                    "Longitude": resp.location?.lng ?? "",
                    "Google Maps Link": resp.location?.lat ? `https://www.google.com/maps?q=${resp.location.lat},${resp.location.lng}` : "",
                    "IP Address": resp.ip || "",
                };

                // Add form field answers
                form.fields.forEach((field) => {
                    const answer = resp.answers?.find((a) => a.fieldId === field.id);
                    row[field.label || field.id] = getPlainValue(answer?.value);
                });

                // Attachments links summary
                if (resp.attachments && resp.attachments.length > 0) {
                    row["Attachment URLs"] = resp.attachments.map((a) => a.url).join(" ; ");
                }

                return row;
            });

            const ws = XLSX.utils.json_to_sheet(rows);

            // Calculate responsive column widths
            const colKeys = Object.keys(rows[0] || {});
            const colWidths = colKeys.map((key) => {
                const maxValLen = Math.max(
                    key.length,
                    ...rows.slice(0, 100).map((r) => String(r[key] || "").length)
                );
                return { wch: Math.min(Math.max(maxValLen + 3, 12), 45) };
            });
            ws["!cols"] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Form Responses");

            const safeTitle = (form.title || "Form").replace(/[^a-zA-Z0-9_-]/g, "_");
            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `${safeTitle}_Responses_${dateStr}.xlsx`;

            XLSX.writeFile(wb, fileName);
            setExportNotice(`Exported ${rows.length} responses to ${fileName}`);
            setTimeout(() => setExportNotice(null), 3500);
        } catch (err) {
            console.error("Excel generation error:", err);
            setError("Failed to generate Excel file. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    /* ─── CSV Export (Ultra-fast built-in client side) ─── */
    const downloadCSV = () => {
        if (!form?.fields || responses.length === 0) return;

        const dataToExport = selectedIds.size > 0
            ? processedResponses.filter((r) => selectedIds.has(r._id))
            : processedResponses;

        const headers = [
            "Response ID",
            "Submitted At",
            "Submitter Name",
            "Submitter Email",
            "Submitter Username",
            "Latitude",
            "Longitude",
            "IP Address",
            ...form.fields.map((f) => f.label || f.id),
        ];

        const escapeCSV = (str) => {
            const val = String(str ?? "").replace(/"/g, '""');
            return `"${val}"`;
        };

        const rows = dataToExport.map((resp) => {
            const baseRow = [
                escapeCSV(resp._id),
                escapeCSV(resp.createdAt ? formatDate(resp.createdAt) : ""),
                escapeCSV(getSubmitterName(resp)),
                escapeCSV(getSubmitterEmail(resp)),
                escapeCSV(getSubmitterUsername(resp) ? `@${getSubmitterUsername(resp)}` : ""),
                escapeCSV(resp.location?.lat ?? ""),
                escapeCSV(resp.location?.lng ?? ""),
                escapeCSV(resp.ip || ""),
            ];

            const answerCols = form.fields.map((f) => {
                const ans = resp.answers?.find((a) => a.fieldId === f.id);
                return escapeCSV(getPlainValue(ans?.value));
            });

            return [...baseRow, ...answerCols].join(",");
        });

        const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeTitle = (form.title || "Form").replace(/[^a-zA-Z0-9_-]/g, "_");
        link.href = url;
        link.download = `${safeTitle}_Responses_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    /* ─── Share Link ─── */
    const copyShareLink = () => {
        const url = `${window.location.origin}/form/${formId}/fill`;
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
    };

    /* ─── Render Answer Cell ─── */
    const renderAnswerPreview = (value) => {
        if (value === null || value === undefined || value === "") {
            return <span className="text-slate-600 text-xs italic">Empty</span>;
        }

        // File object or camera capture
        if (typeof value === "object" && value?.url) {
            const isImage = value.url.match(/\.(jpeg|jpg|gif|png|webp)/i) || value.mimeType?.startsWith("image/");
            return (
                <a
                    href={value.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium border border-indigo-500/20 transition-colors"
                >
                    {isImage ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    )}
                    <span className="truncate max-w-[110px]">{value.filename || "Attachment"}</span>
                </a>
            );
        }

        // Array (e.g. Checkboxes or multiple files)
        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-slate-600 text-xs italic">Empty</span>;
            return (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {value.slice(0, 2).map((item, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700 truncate max-w-[90px]">
                            {typeof item === "object" ? item?.filename || "File" : String(item)}
                        </span>
                    ))}
                    {value.length > 2 && (
                        <span className="text-[11px] text-slate-500 self-center">+{value.length - 2}</span>
                    )}
                </div>
            );
        }

        // Plain string/number
        const strVal = String(value);
        return <span className="text-slate-200 text-xs truncate max-w-[180px] block" title={strVal}>{strVal}</span>;
    };

    /* ─── Loading View ─── */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative w-14 h-14">
                        <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200">Loading Form Responses</h3>
                        <p className="text-sm text-slate-500 mt-1">Retrieving submissions and telemetry data…</p>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Fatal Error View ─── */
    if (error && !form) {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#131B2E] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-400">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Unable to Load Responses</h2>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">{error}</p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => navigate("/forms")}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                        >
                            Return to My Forms
                        </button>
                        <button
                            onClick={() => fetchData()}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
            {/* ─── Top Navigation Bar ─── */}
            <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-3">
                        {/* Left: Back & Form Metadata */}
                        <div className="flex items-center gap-3.5 min-w-0">
                            <button
                                onClick={() => navigate("/forms")}
                                title="Back to My Forms"
                                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-colors shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-white truncate max-w-[260px] sm:max-w-md">
                                        {form?.title || "Untitled Form"}
                                    </h1>
                                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {form?.isActive !== false ? "Active" : "Archived"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span>Form Responses</span>
                                    <span>•</span>
                                    <span>{form?.fields?.length || 0} Questions</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            {/* Refresh Button */}
                            <button
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                title="Refresh responses"
                                className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-colors disabled:opacity-50"
                            >
                                <svg
                                    className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            {/* View Public Form */}
                            <a
                                href={`/form/${formId}/fill`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open Live Form"
                                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span>Preview Form</span>
                            </a>

                            {/* Form Settings */}
                            <button
                                onClick={() => navigate(`/form/${formId}/settings`)}
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Settings</span>
                            </button>

                            {/* Share Link */}
                            <button
                                onClick={copyShareLink}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                            >
                                {copiedLink ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Copied Link!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span>Share Form</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Notification Toast ─── */}
            {exportNotice && (
                <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
                    <div className="bg-slate-900 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm">
                        <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{exportNotice}</span>
                    </div>
                </div>
            )}

            {/* ─── Main Content Container ─── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">

                {/* ─── Metrics Dashboard ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Total Responses */}
                    <div className="bg-[#131B2E] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{stats.total}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">All recorded responses</p>
                    </div>

                    {/* Today */}
                    <div className="bg-[#131B2E] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Traffic</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">{stats.todayCount}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Submitted in last 24h</p>
                    </div>

                    {/* Geolocation Tagged */}
                    <div className="bg-[#131B2E] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GPS Verified</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-2">{stats.geolocatedCount}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">With geofence coordinates</p>
                    </div>

                    {/* Latest Submission */}
                    <div className="bg-[#131B2E] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-purple-300 mt-2 truncate">{stats.latestTime}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Most recent submission</p>
                    </div>
                </div>

                {/* ─── Filter & Action Controls Toolbar ─── */}
                <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search submitters, emails, answers…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Date Pills */}
                        <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
                            {[
                                { id: "all", label: "All Time" },
                                { id: "today", label: "Today" },
                                { id: "7days", label: "7 Days" },
                                { id: "30days", label: "30 Days" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDateFilter(tab.id)}
                                    className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                        dateFilter === tab.id
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Order */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-[#0B0F19] border border-slate-800 rounded-xl p-0.5">
                                <button
                                    onClick={() => setViewMode("table")}
                                    title="Table view"
                                    className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-indigo-600/30 text-indigo-300" : "text-slate-400 hover:text-slate-200"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode("cards")}
                                    title="Grid cards view"
                                    className={`p-1.5 rounded-lg transition-colors ${viewMode === "cards" ? "bg-indigo-600/30 text-indigo-300" : "text-slate-400 hover:text-slate-200"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Download Excel (.xlsx) */}
                            <button
                                onClick={downloadExcel}
                                disabled={responses.length === 0 || isExporting}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                title="Download as Microsoft Excel (.xlsx)"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                        <span>Exporting…</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        </svg>
                                        <span>{selectedIds.size > 0 ? `Export (${selectedIds.size}) Excel` : "Export Excel"}</span>
                                    </>
                                )}
                            </button>

                            {/* Download CSV */}
                            <button
                                onClick={downloadCSV}
                                disabled={responses.length === 0}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                title="Download as CSV"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Bulk Selection Banner */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                            <div className="flex items-center gap-2 text-indigo-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span>{selectedIds.size} of {processedResponses.length} entries selected</span>
                            </div>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-slate-400 hover:text-white underline underline-offset-2"
                            >
                                Clear selection
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── Empty States ─── */}
                {responses.length === 0 && (
                    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-12 text-center my-auto flex flex-col items-center max-w-lg mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1.5">No responses submitted yet</h3>
                        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                            Share this form link with your audience or respondents. Once submissions come in, you can analyze and export them here.
                        </p>
                        <button
                            onClick={copyShareLink}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>Copy Form Link</span>
                        </button>
                    </div>
                )}

                {responses.length > 0 && processedResponses.length === 0 && (
                    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-10 text-center">
                        <p className="text-sm text-slate-400">No responses matched your current filter criteria.</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setDateFilter("all");
                            }}
                            className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {/* ─── Responses Table View ─── */}
                {processedResponses.length > 0 && viewMode === "table" && (
                    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-[#0B0F19]/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3.5 px-4 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = isIndeterminate;
                                                }}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3.5 px-3 w-12 text-slate-500">#</th>
                                        <th className="py-3.5 px-4 min-w-[200px]">Submitter Details</th>
                                        {/* Show first 3 form fields */}
                                        {form?.fields?.slice(0, 3).map((field) => (
                                            <th key={field.id} className="py-3.5 px-4 max-w-[170px] truncate" title={field.label}>
                                                {field.label}
                                            </th>
                                        ))}
                                        {form?.fields && form.fields.length > 3 && (
                                            <th className="py-3.5 px-3 text-slate-500 text-[10px]">
                                                +{form.fields.length - 3} More
                                            </th>
                                        )}
                                        <th className="py-3.5 px-4 min-w-[130px]">GPS / Location</th>
                                        <th className="py-3.5 px-4 min-w-[120px]">Submitted</th>
                                        <th className="py-3.5 px-4 text-right w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-xs">
                                    {processedResponses.map((resp, index) => {
                                        const isSelected = selectedIds.has(resp._id);
                                        const name = getSubmitterName(resp);
                                        const email = getSubmitterEmail(resp);
                                        const username = getSubmitterUsername(resp);
                                        const avatar = getSubmitterAvatar(resp);
                                        const hasLocation = resp.location?.lat && resp.location?.lng;

                                        return (
                                            <tr
                                                key={resp._id}
                                                onClick={() => setActiveResponseId(resp._id)}
                                                className={`transition-colors cursor-pointer group ${
                                                    isSelected
                                                        ? "bg-indigo-600/10 hover:bg-indigo-600/15"
                                                        : "hover:bg-slate-800/40"
                                                }`}
                                            >
                                                {/* Select Checkbox */}
                                                <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => toggleSelectRow(resp._id, e)}
                                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Index */}
                                                <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                                                    {index + 1}
                                                </td>

                                                {/* Submitter Details */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {avatar ? (
                                                            <img
                                                                src={avatar}
                                                                alt={name}
                                                                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
                                                                {getSubmitterInitials(resp)}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="font-semibold text-white truncate max-w-[160px]">
                                                                    {name}
                                                                </p>
                                                                {username && (
                                                                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                                                        @{username}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-400 text-[11px] truncate max-w-[170px]" title={email}>
                                                                {email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Field Answers */}
                                                {form?.fields?.slice(0, 3).map((field) => {
                                                    const answer = resp.answers?.find((a) => a.fieldId === field.id);
                                                    return (
                                                        <td key={field.id} className="py-3.5 px-4 max-w-[170px] truncate">
                                                            {renderAnswerPreview(answer?.value)}
                                                        </td>
                                                    );
                                                })}

                                                {form?.fields && form.fields.length > 3 && (
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-slate-800">
                                                            +{form.fields.length - 3}
                                                        </span>
                                                    </td>
                                                )}

                                                {/* Location / Geofence */}
                                                <td className="py-3.5 px-4">
                                                    {hasLocation ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${resp.location.lat},${resp.location.lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title={`Coordinates: ${resp.location.lat.toFixed(4)}, ${resp.location.lng.toFixed(4)}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] font-medium transition-colors"
                                                        >
                                                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            </svg>
                                                            <span>View Map</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs italic">No GPS</span>
                                                    )}
                                                </td>

                                                {/* Submitted Time */}
                                                <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap" title={formatDate(resp.createdAt)}>
                                                    <div>
                                                        <p className="text-slate-300 font-medium">{formatRelativeTime(resp.createdAt)}</p>
                                                        <p className="text-[10px] text-slate-500">{new Date(resp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                                                    </div>
                                                </td>

                                                {/* View Action */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => setActiveResponseId(resp._id)}
                                                        className="text-slate-400 group-hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors"
                                                        title="View Response Details"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer info */}
                        <div className="py-3 px-4 bg-[#0B0F19]/40 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                            <span>Showing {processedResponses.length} of {responses.length} responses</span>
                            <span className="hidden sm:inline">Click any entry to view full submission details</span>
                        </div>
                    </div>
                )}

                {/* ─── Responses Card View ─── */}
                {processedResponses.length > 0 && viewMode === "cards" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {processedResponses.map((resp, index) => {
                            const name = getSubmitterName(resp);
                            const email = getSubmitterEmail(resp);
                            const username = getSubmitterUsername(resp);
                            const avatar = getSubmitterAvatar(resp);
                            const isSelected = selectedIds.has(resp._id);

                            return (
                                <div
                                    key={resp._id}
                                    onClick={() => setActiveResponseId(resp._id)}
                                    className={`bg-[#131B2E] border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between hover:shadow-xl ${
                                        isSelected
                                            ? "border-indigo-500/60 bg-indigo-950/20"
                                            : "border-slate-800 hover:border-slate-700"
                                    }`}
                                >
                                    <div>
                                        {/* Card Top: Submitter + Select */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {avatar ? (
                                                    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                                                        {getSubmitterInitials(resp)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="font-semibold text-white text-sm truncate">{name}</h4>
                                                        {username && (
                                                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1 rounded border border-indigo-500/20">
                                                                @{username}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-400 text-xs truncate">{email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => toggleSelectRow(resp._id, e)}
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        {/* Card Body: Sample answers preview */}
                                        <div className="space-y-2.5 my-3 bg-[#0B0F19]/60 p-3 rounded-xl border border-slate-800/80">
                                            {form?.fields?.slice(0, 3).map((field) => {
                                                const ans = resp.answers?.find((a) => a.fieldId === field.id);
                                                return (
                                                    <div key={field.id} className="text-xs">
                                                        <span className="text-slate-400 block truncate font-medium text-[11px] mb-0.5">
                                                            {field.label}
                                                        </span>
                                                        <div className="text-slate-200">
                                                            {renderAnswerPreview(ans?.value)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Card Footer: Telemetry & Link */}
                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                        <span title={formatDate(resp.createdAt)}>
                                            {formatRelativeTime(resp.createdAt)}
                                        </span>

                                        {resp.location?.lat ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                GPS Pin
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-600">No Location</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ─── Detail Slide-Over Drawer / Modal ─── */}
            {activeResponse && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                        onClick={() => setActiveResponseId(null)}
                    />

                    {/* Drawer Panel */}
                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div
                            ref={drawerRef}
                            className="w-screen max-w-xl bg-[#0F1523] border-l border-slate-800 shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-[#131B2E]">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold border border-indigo-500/30">
                                        #{activeIndex + 1} of {processedResponses.length}
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Submission Details</h3>
                                        <p className="text-[11px] text-slate-400">{formatDate(activeResponse.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* Prev/Next buttons */}
                                    <button
                                        onClick={handlePrevResponse}
                                        disabled={activeIndex <= 0}
                                        title="Previous response"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleNextResponse}
                                        disabled={activeIndex >= processedResponses.length - 1}
                                        title="Next response"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    <div className="w-px h-5 bg-slate-800 mx-1" />

                                    {/* Close button */}
                                    <button
                                        onClick={() => setActiveResponseId(null)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Submitter Profile Card */}
                                <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Submitter Information
                                    </h4>

                                    <div className="flex items-center gap-4 mb-4">
                                        {getSubmitterAvatar(activeResponse) ? (
                                            <img
                                                src={getSubmitterAvatar(activeResponse)}
                                                alt={getSubmitterName(activeResponse)}
                                                className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                                                {getSubmitterInitials(activeResponse)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-white leading-tight">
                                                {getSubmitterName(activeResponse)}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">{getSubmitterEmail(activeResponse)}</p>
                                            {getSubmitterUsername(activeResponse) && (
                                                <span className="inline-block mt-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                    @{getSubmitterUsername(activeResponse)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                                        <div>
                                            <span className="text-slate-500 text-[11px] block">Submitter ID</span>
                                            <span className="font-mono text-slate-300 text-[11px] truncate block">
                                                {activeResponse.submitterId?._id || activeResponse.submitterId || "Public User"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-[11px] block">IP Address</span>
                                            <span className="font-mono text-slate-300 text-[11px] block">
                                                {activeResponse.ip || "Not recorded"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Geofence & Location Telemetry */}
                                <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Geolocation & Verification
                                    </h4>

                                    {activeResponse.location?.lat ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3 bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                                                <div>
                                                    <span className="text-[11px] text-slate-500 block">Latitude</span>
                                                    <span className="font-mono text-xs font-semibold text-white">
                                                        {activeResponse.location.lat.toFixed(6)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-slate-500 block">Longitude</span>
                                                    <span className="font-mono text-xs font-semibold text-white">
                                                        {activeResponse.location.lng.toFixed(6)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`https://www.google.com/maps?q=${activeResponse.location.lat},${activeResponse.location.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    <span>Open in Google Maps</span>
                                                </a>

                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${activeResponse.location.lat}, ${activeResponse.location.lng}`);
                                                    }}
                                                    title="Copy coordinates"
                                                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#0B0F19] p-4 rounded-xl border border-slate-800 text-center">
                                            <p className="text-xs text-slate-500">No GPS coordinates attached to this submission.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Answers Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span>Questions & Answers ({form?.fields?.length || 0})</span>
                                        <span className="text-[11px] text-slate-500 font-normal">All Fields</span>
                                    </h4>

                                    {form?.fields?.map((field, fIdx) => {
                                        const answer = activeResponse.answers?.find((a) => a.fieldId === field.id);
                                        const rawVal = answer?.value;

                                        return (
                                            <div
                                                key={field.id}
                                                className="bg-[#131B2E] border border-slate-800/90 rounded-2xl p-4.5 space-y-2 hover:border-slate-700 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-slate-500 font-mono text-xs font-semibold">
                                                            Q{fIdx + 1}.
                                                        </span>
                                                        <span className="text-sm font-semibold text-white">
                                                            {field.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-800/80 shrink-0">
                                                        {field.type || "text"}
                                                    </span>
                                                </div>

                                                {/* Answer Value Rendering */}
                                                <div className="pt-2 border-t border-slate-800/60 pl-6">
                                                    {rawVal === null || rawVal === undefined || rawVal === "" ? (
                                                        <p className="text-xs text-slate-500 italic">No answer provided</p>
                                                    ) : typeof rawVal === "object" && rawVal?.url ? (
                                                        /* Single file or camera image */
                                                        <div className="space-y-2">
                                                            {rawVal.url.match(/\.(jpeg|jpg|gif|png|webp)/i) || rawVal.mimeType?.startsWith("image/") ? (
                                                                <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-700 bg-black/40">
                                                                    <img
                                                                        src={rawVal.url}
                                                                        alt={rawVal.filename || "Uploaded file"}
                                                                        className="w-full max-h-60 object-contain"
                                                                    />
                                                                    <div className="p-2 bg-slate-900/90 flex items-center justify-between text-xs">
                                                                        <span className="text-slate-300 truncate max-w-[180px]">{rawVal.filename || "Image photo"}</span>
                                                                        <a
                                                                            href={rawVal.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                                                                        >
                                                                            View full size ↗
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <a
                                                                    href={rawVal.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-400 transition-colors border border-slate-700"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <span className="font-medium text-white">{rawVal.filename || "Download File"}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : Array.isArray(rawVal) ? (
                                                        /* Array of values or files */
                                                        <div className="flex flex-wrap gap-2">
                                                            {rawVal.map((item, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700 font-medium"
                                                                >
                                                                    {typeof item === "object" ? item.filename || item.url : String(item)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        /* Regular text/choice */
                                                        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                                                            {String(rawVal)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-slate-800 bg-[#131B2E] flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 font-mono">
                                    ID: {activeResponse._id}
                                </span>
                                <button
                                    onClick={() => {
                                        const jsonStr = JSON.stringify(activeResponse, null, 2);
                                        navigator.clipboard.writeText(jsonStr);
                                        setExportNotice("Response JSON copied to clipboard");
                                        setTimeout(() => setExportNotice(null), 2500);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                                >
                                    Copy Raw JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Responses;
