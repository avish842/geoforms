import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export const MyForms = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchForms = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/user/forms`,
                    { credentials: "include" }
                );
                if (res.ok) {
                    const data = await res.json();
                    setForms(data.data);
                } else {
                    setError("Failed to load forms.");
                }
            } catch {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchForms();
    }, [user, navigate]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-400 text-lg">Loading forms...</p>
                </div>
            </div>
        );
    }

    /* ─── Error ─── */
    if (error) {
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
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-indigo-700 flex items-center justify-center">
                    <img src="/logo.svg" alt="GeoForms Logo" className="h-10 w-10 mr-3" />
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                        My Forms
                    </span>
                    
                </h1>
            </header>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    
                    <button
                        onClick={() => navigate("/form/new/edit")}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Form
                    </button>
                </div>

                {/* Empty state */}
                {forms.length === 0 && (
                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8 text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-700 mb-1">No forms yet</h2>
                        <p className="text-neutral-400 mb-5">Create your first form to get started.</p>
                        <button
                            onClick={() => navigate("/form/new/edit")}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
                        >
                            Create Form
                        </button>
                    </div>
                )}

                {/* Cards grid */}
                {forms.length > 0 && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {forms.map((form) => (
                            <div
                                key={form._id}
                                className="group bg-white rounded-xl border-2 border-neutral-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col"
                                onClick={() => navigate(`/form/${form._id}/edit`)}
                            >
                                {/* Title */}
                                <h3 className="text-lg font-semibold text-neutral-800 truncate group-hover:text-blue-600 transition-colors">
                                    {form.title || "Untitled Form"}
                                </h3>

                                {/* Description */}
                                <p className="mt-1.5 text-sm text-neutral-400 line-clamp-2 flex-1">
                                    {form.description?.trim() || "No description"}
                                </p>

                                {/* Meta row */}
                                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                                    <span>Created {formatDate(form.createdAt)}</span>
                                    <span>Edited {formatDate(form.updatedAt)}</span>
                                </div>

                                {/* Actions */}
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/form/${form._id}/edit`);
                                        }}
                                        className="flex-1 text-center text-sm font-medium text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/form/${form._id}/responses`);
                                        }}
                                        className="flex-1 text-center text-sm font-medium text-emerald-500 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-1.5 transition-colors"
                                    >
                                        Responses
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/form/${form._id}/settings`);
                                        }}
                                        title="Settings"
                                        className="flex items-center justify-center text-sm font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-lg py-1.5 px-2.5 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(
                                                `${window.location.origin}/form/${form._id}/fill`
                                            );
                                        }}
                                        title="Copy share link"
                                        className="flex items-center justify-center text-sm font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-lg py-1.5 px-2.5 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
