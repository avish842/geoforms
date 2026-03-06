import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


const FillForm = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({});   // { fieldId: value }
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [fileUploads, setFileUploads] = useState({});   // { fieldId: attachment }
    const [uploading, setUploading] = useState({});       // { fieldId: boolean }

    // Geofence location gating
    const [locationStatus, setLocationStatus] = useState("idle"); // idle | requesting | granted | denied | unavailable
    const [userLocation, setUserLocation] = useState(null);
    const isGeofenced = !!(form?.settings?.geofence?.type);

    /* ─── Fetch form on mount ─── */
    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/user/form/${formId}/public`
                );
                const data = await res.json();
                if (res.ok && data.data) {
                    setForm(data.data);
                    // initialise answers map
                    const initial = {};
                    data.data.fields.forEach((f) => {
                        if (f.type === "checkbox") initial[f.id] = [];
                        else initial[f.id] = "";
                    });
                    setAnswers(initial);
                } else {
                    setError(data.message || "Form not found");
                }
            } catch {
                setError("Could not load the form. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [formId]);

    /* ─── Geofence: request location as soon as form loads ─── */
    useEffect(() => {
        if (!form) return;
        const gf = form.settings?.geofence;
        if (!gf?.type) return; // not geofenced, skip

        setLocationStatus("requesting");

        if (!navigator.geolocation) {
            setLocationStatus("unavailable");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationStatus("granted");
            },
            (err) => {
                console.error("Geolocation error:", err);
                setLocationStatus("denied");
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }, [form]);

    const retryLocation = () => {
        setLocationStatus("requesting");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationStatus("granted");
            },
            () => setLocationStatus("denied"),
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    /* ─── Helpers ─── */
    const updateAnswer = (fieldId, value) => {
        setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    };

    const toggleCheckbox = (fieldId, optionValue) => {
        setAnswers((prev) => {
            const arr = prev[fieldId] || [];
            return {
                ...prev,
                [fieldId]: arr.includes(optionValue)
                    ? arr.filter((v) => v !== optionValue)
                    : [...arr, optionValue],
            };
        });
    };

    const handleFileUpload = async (fieldId, file) => {
        if (!file) return;

        setUploading((prev) => ({ ...prev, [fieldId]: true }));
        setError(null);

        // Get old attachment ID if replacing an existing file
        const oldAttachmentId = fileUploads[fieldId]?._id || null;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("fieldId", fieldId);
        formData.append("formId", formId);
        if (oldAttachmentId) {
            formData.append("oldAttachmentId", oldAttachmentId);
        }

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/user/upload`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            const data = await res.json();

            if (res.ok && data.attachment) {
                setFileUploads((prev) => ({ ...prev, [fieldId]: data.attachment }));
                updateAnswer(fieldId, {
                    attachmentId: data.attachment._id,
                    url: data.attachment.url,
                    filename: data.attachment.filename,
                });
            } else {
                setError(data.message || "Failed to upload file. Please try again.");
            }
        } catch {
            setError("Network error. Please try uploading the file again.");
        } finally {
            setUploading((prev) => ({ ...prev, [fieldId]: false }));
        }
    };

    /* ─── Submit ─── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Build answers array expected by backend
        const answersArray = form.fields.map((field) => ({
            fieldId: field.id,
            value: answers[field.id] ?? "",
        }));

        // Validate required fields
        for (const field of form.fields) {
            if (field.required) {
                const val = answers[field.id];
                if (val === "" || val === undefined || val === null || (Array.isArray(val) && val.length === 0)) {
                    setError(`"${field.label}" is required`);
                    setSubmitting(false);
                    return;
                }
            }
        }

        // Use already-tracked location for geofenced forms
        let location = null;
        if (isGeofenced) {
            if (!userLocation) {
                setError("Location access is required to submit this geofenced form.");
                setSubmitting(false);
                return;
            }
            location = userLocation;
        }

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/user/create-response/${formId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        answers: answersArray,
                        email: email || undefined,
                        location,
                    }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
            } else {
                setError(data.message || "Submission failed");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    /* ─── Render helpers ─── */
    const renderField = (field) => {
        const common =
            "w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-800 outline-none transition-colors focus:border-blue-400";

        switch (field.type) {
            case "text":
                return (
                    <input
                        type="text"
                        className={common}
                        placeholder="Your answer"
                        value={answers[field.id] || ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                    />
                );

            case "number":
                return (
                    <input
                        type="number"
                        className={common}
                        placeholder="0"
                        value={answers[field.id] || ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                    />
                );

            case "email":
                return (
                    <input
                        type="email"
                        className={common}
                        placeholder="name@email.com"
                        value={answers[field.id] || ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                    />
                );

            case "date":
                return (
                    <input
                        type="date"
                        className={common}
                        value={answers[field.id] || ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                    />
                );

            case "radio":
            case "multiple choice":
                return (
                    <div className="space-y-2 mt-1">
                        {field.options?.map((opt, i) => (
                            <label
                                key={i}
                                className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-neutral-200 px-4 py-2.5 hover:border-blue-300 transition-colors has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
                            >
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt.value}
                                    checked={answers[field.id] === opt.value}
                                    onChange={() => updateAnswer(field.id, opt.value)}
                                    className="accent-blue-500 w-4 h-4"
                                />
                                <span className="text-base text-neutral-700">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                );

            case "checkbox":
                return (
                    <div className="space-y-2 mt-1">
                        {field.options?.map((opt, i) => (
                            <label
                                key={i}
                                className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-neutral-200 px-4 py-2.5 hover:border-blue-300 transition-colors has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
                            >
                                <input
                                    type="checkbox"
                                    value={opt.value}
                                    checked={(answers[field.id] || []).includes(opt.value)}
                                    onChange={() => toggleCheckbox(field.id, opt.value)}
                                    className="accent-blue-500 w-4 h-4 rounded"
                                />
                                <span className="text-base text-neutral-700">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                );

            case "file":
                return (
                    <div className="mt-1">
                        <label
                            htmlFor={`file-input-${field.id}`}
                            className={`border-2 border-dashed rounded-lg py-6 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                uploading[field.id]
                                    ? "border-yellow-300 bg-yellow-50/50 text-yellow-500 pointer-events-none"
                                    : fileUploads[field.id]
                                    ? "border-green-300 bg-green-50/50 text-green-500 hover:border-green-400"
                                    : "border-blue-200 text-neutral-400 hover:border-blue-400 hover:bg-blue-50/50"
                            }`}
                        >
                            {uploading[field.id] ? (
                                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 16V4m0 0l-3 3m3-3l3 3M4 18h16"
                                    />
                                </svg>
                            )}

                            <span className="text-sm">
                                {uploading[field.id]
                                    ? "Uploading..."
                                    : fileUploads[field.id]
                                    ? fileUploads[field.id].filename
                                    : "Upload file"}
                            </span>

                            <input
                                type="file"
                                id={`file-input-${field.id}`}
                                className="hidden"
                                disabled={uploading[field.id]}
                                onChange={(e) => handleFileUpload(field.id, e.target.files[0])}
                            />
                        </label>

                        {fileUploads[field.id] && !uploading[field.id] && (
                            <p className="mt-1.5 text-xs text-green-500 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Uploaded — click to replace
                            </p>
                        )}
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        className={common}
                        placeholder="Your answer"
                        value={answers[field.id] || ""}
                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                    />
                );
        }
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-400 text-lg">Loading form...</p>
                </div>
            </div>
        );
    }

    /* ─── Error (no form) ─── */
    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="bg-white rounded-xl border-2 border-red-200 p-8 max-w-md text-center">
                    <h2 className="text-xl font-semibold text-red-500 mb-2">Oops!</h2>
                    <p className="text-neutral-600">{error || "Form not found."}</p>
                </div>
            </div>
        );
    }

    /* ─── Submitted ─── */
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="bg-white rounded-xl border-2 border-green-200 p-10 max-w-md text-center shadow-sm">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Response submitted!</h2>
                    <p className="text-neutral-500">Thank you for filling out this form.</p>
                </div>
            </div>
        );
    }

    /* ─── Geofence: Location gate ─── */
    if (isGeofenced && locationStatus !== "granted") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
                <div className="bg-white rounded-xl border-2 border-amber-200 p-8 max-w-md w-full text-center shadow-sm">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800 mb-2">Location Required</h2>
                    <p className="text-neutral-500 text-sm mb-5">
                        This form uses geofencing. You must enable location access to fill it out.
                    </p>

                    {locationStatus === "requesting" && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-neutral-400">Requesting location access...</p>
                        </div>
                    )}

                    {locationStatus === "denied" && (
                        <div className="space-y-3">
                            <p className="text-sm text-red-500">
                                Location permission was denied. Please allow location access in your browser settings and try again.
                            </p>
                            <button
                                type="button"
                                onClick={retryLocation}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {locationStatus === "unavailable" && (
                        <p className="text-sm text-red-500">
                            Geolocation is not supported by your browser. Please use a different browser to fill this form.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Form ─── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                    <h1 className="text-3xl font-semibold text-neutral-900">
                        {form.title || "Untitled Form"}
                    </h1>
                    {form.description && form.description.trim() && (
                        <p className="mt-2 text-base text-neutral-500 leading-relaxed">
                            {form.description}
                        </p>
                    )}

                    {/* Email field if domain whitelist is configured */}
                    {form.settings?.emailDomainWhitelist?.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-neutral-100">
                            <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                                Email address <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                placeholder={`example@${form.settings.emailDomainWhitelist[0]}`}
                                className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-800 outline-none transition-colors focus:border-blue-400"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-neutral-400">
                                Allowed domains: {form.settings.emailDomainWhitelist.join(", ")}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Fields ── */}
                {form.fields.map((field) => (
                    <div
                        key={field.id}
                        className="bg-white rounded-xl border-2 border-neutral-200 p-6 shadow-sm hover:border-neutral-300 transition-colors"
                    >
                        <label className="block text-lg font-medium text-neutral-800 mb-3">
                            {field.label}
                            {field.required && (
                                <span className="text-red-400 ml-1">*</span>
                            )}
                        </label>
                        {renderField(field)}
                    </div>
                ))}

                {/* ── Error banner ── */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl px-5 py-3 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* ── Submit ── */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const initial = {};
                            form.fields.forEach((f) => {
                                if (f.type === "checkbox") initial[f.id] = [];
                                else initial[f.id] = "";
                            });
                            setAnswers(initial);
                            setEmail("");
                            setError(null);
                        }}
                        className="text-neutral-400 hover:text-neutral-600 font-medium px-4 py-3 rounded-xl transition-colors text-base"
                    >
                        Clear form
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FillForm;