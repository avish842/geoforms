import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MapsComp from "../map_comp/MapsComp";
import { useDrawingContext } from "../map_comp/context/DrawingContext";
import { DrawingActionKind } from "../map_comp/types";


const Section = ({ title, children }) => (
    <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">{title}</h2>
        {children}
    </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className="w-10 h-5 bg-neutral-200 rounded-full peer-checked:bg-blue-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
        </div>
        <div>
            <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                {label}
            </span>
            {description && (
                <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
            )}
        </div>
    </label>
);

const FormSetting = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const { state, dispatch, userLocation } = useDrawingContext();
 
    /* ─── Fetch form ─── */
    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/user/form/${formId}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (res.ok && data.data) {
                    setForm(data.data);

                    setSettings({
                        emailDomainWhitelist: data.data.settings?.emailDomainWhitelist || [],
                        submissionLimitPerUser: data.data.settings?.submissionLimitPerUser ?? null,
                        timeWindow: {
                            start: data.data.settings?.timeWindow?.start || null,
                            end: data.data.settings?.timeWindow?.end || null,
                        },
                        maxFileSizeMB: data.data.settings?.maxFileSizeMB ?? 10,
                        allowedFileTypes: data.data.settings?.allowedFileTypes || [],
                        geofence: data.data.settings?.geofence || {
                            type: null,
                            coordinates: [],
                            radius: null,
                        },
                    });
                } else {
                    setError("Form not found or you don't have permission.");
                }
            } catch {
                setError("Could not load form settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [formId]);

    useEffect(() => {
        if(state.now.length > 0){
            if(state.now[0]?.type === "rectangle"){
                const { north, south, east, west } = state.now[0]?.snapshot?.bounds

                const coordinates = [[
                [west, south],   // SW corner
                [east, south],   // SE corner
                [east, north],   // NE corner
                [west, north],   // NW corner
                [west, south],   // close the ring (first point repeated)
                ]]

                updateSetting("geofence",{
                    type:"Polygon",
                    coordinates: coordinates,     
                    radius: null
                });

            }
            else if (state.now[0]?.type === "circle"){
                const center = state.now[0]?.snapshot?.center;
                const radius = state.now[0]?.snapshot?.radius;
                
                updateSetting("geofence",{
                    type:"Point",
                    coordinates: [center.lng, center.lat],   // GeoJSON: [lng, lat]
                    radius: radius
                });
            }
            else if (state.now[0]?.type === "polygon"){
                const path = state.now[0]?.snapshot?.path || [];
                const coords = path.map((point) => {
                    // Handle both LatLng objects and plain {lat, lng}
                    const lat = typeof point.lat === "function" ? point.lat() : point.lat;
                    const lng = typeof point.lng === "function" ? point.lng() : point.lng;
                    return [lng, lat]; // GeoJSON: [lng, lat]
                });
                // Close the ring if not already closed
                if (coords.length > 0 &&
                    (coords[0][0] !== coords[coords.length-1][0] ||
                     coords[0][1] !== coords[coords.length-1][1])) {
                    coords.push(coords[0]);
                }
                updateSetting("geofence",{
                    type:"Polygon",
                    coordinates: [coords],
                    radius: null
                });
            }
            else{
                updateSetting("geofence",{
                    type: null,
                    coordinates: [],    
                    radius: null
                });

            }
        }
    }, [state.now]);


    /* ─── Save ─── */
    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/user/update/${formId}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ settings, isActive: form?.isActive }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else {
                setError(data.message || "Failed to save settings.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    /* ─── Helpers ─── */
    const updateSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateTimeWindow = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            timeWindow: { ...prev.timeWindow, [key]: value || null },
        }));
    };

    const handleDomainAdd = (e) => {
        if (e.key !== "Enter") return;
        const val = e.target.value.trim().toLowerCase();
        if (!val || settings.emailDomainWhitelist.includes(val)) return;
        updateSetting("emailDomainWhitelist", [...settings.emailDomainWhitelist, val]);
        e.target.value = "";
    };

    const removeDomain = (domain) => {
        updateSetting(
            "emailDomainWhitelist",
            settings.emailDomainWhitelist.filter((d) => d !== domain)
        );
    };

    const handleFileTypeAdd = (e) => {
        if (e.key !== "Enter") return;
        const val = e.target.value.trim().toLowerCase();
        if (!val || settings.allowedFileTypes.includes(val)) return;
        updateSetting("allowedFileTypes", [...settings.allowedFileTypes, val]);
        e.target.value = "";
    };

    const removeFileType = (ft) => {
        updateSetting(
            "allowedFileTypes",
            settings.allowedFileTypes.filter((t) => t !== ft)
        );
    };

    const toLocalDatetime = (isoStr) => {
        if (!isoStr) return "";
        const d = new Date(isoStr);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    };

   

    const clearFence = () => {
        updateSetting("geofence", { type: null, coordinates: [], radius: null });
        dispatch({ type: DrawingActionKind.CLEAR_OVERLAYS });
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-400 text-lg">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!form || !settings) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="bg-white rounded-xl border-2 border-red-200 p-8 max-w-md text-center shadow-sm">
                    <h2 className="text-xl font-semibold text-red-500 mb-2">Oops!</h2>
                    <p className="text-neutral-600">{error || "Form not found."}</p>
                </div>
            </div>
        );
    }

    /* ─── Page ─── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
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
                            Settings — {form.title || "Untitled Form"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/form/${formId}/responses`)}
                            className="text-sm font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-xl transition-colors"
                        >
                            Responses
                        </button>
                    </div>
                </div>

                {/* ── Form Active Toggle ── */}
                <Section title="General">
                    <Toggle
                        label="Form is active"
                        description="When disabled, the form will not accept new submissions."
                        checked={form.isActive}
                        onChange={(checked) =>
                            setForm((prev) => ({ ...prev, isActive: checked }))
                        }
                    />
                </Section>

                {/* ── Geofence Settings ── */}
                <Section title="Geofence Settings">
                    <div className="w-full h-[500px] rounded-md overflow-hidden">
                        <MapsComp 
                            userLocation={userLocation}
                            geofence={settings?.geofence}
                        />
                    </div>
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={clearFence}
                            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                        >
                            Clear boundary
                        </button>
                    </div>
                </Section>

                {/* ── Email Domain Whitelist ── */}
                <Section title="Email Domain Whitelist">
                    <p className="text-sm text-neutral-400 mb-3">
                        Only allow submissions from specific email domains. Leave empty to allow all.
                    </p>
                    <input
                        type="text"
                        placeholder="Type a domain and press Enter (e.g. nitkkr.ac.in)"
                        className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-blue-400 transition-colors"
                        onKeyDown={handleDomainAdd}
                    />
                    {settings.emailDomainWhitelist.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {settings.emailDomainWhitelist.map((d) => (
                                <span
                                    key={d}
                                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full"
                                >
                                    @{d}
                                    <button
                                        type="button"
                                        onClick={() => removeDomain(d)}
                                        className="hover:text-red-500 transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── Submission Limit ── */}
                <Section title="Submission Limit">
                    <p className="text-sm text-neutral-400 mb-3">
                        Max responses per user. Leave empty for unlimited.
                    </p>
                    <input
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-blue-400 transition-colors"
                        value={settings.submissionLimitPerUser ?? ""}
                        onChange={(e) =>
                            updateSetting(
                                "submissionLimitPerUser",
                                e.target.value === "" ? null : Number(e.target.value)
                            )
                        }
                    />
                </Section>

                {/* ── Time Window ── */}
                <Section title="Submission Time Window">
                    <p className="text-sm text-neutral-400 mb-3">
                        Restrict when users can submit responses.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Opens at</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-blue-400 transition-colors"
                                value={toLocalDatetime(settings.timeWindow.start)}
                                onChange={(e) =>
                                    updateTimeWindow("start", e.target.value ? new Date(e.target.value).toISOString() : null)
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Closes at</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-blue-400 transition-colors"
                                value={toLocalDatetime(settings.timeWindow.end)}
                                onChange={(e) =>
                                    updateTimeWindow("end", e.target.value ? new Date(e.target.value).toISOString() : null)
                                }
                            />
                        </div>
                    </div>
                    {(settings.timeWindow.start || settings.timeWindow.end) && (
                        <button
                            type="button"
                            onClick={() => updateSetting("timeWindow", { start: null, end: null })}
                            className="mt-2 text-xs text-red-400 hover:text-red-500 transition-colors"
                        >
                            Clear time window
                        </button>
                    )}
                </Section>

                {/* ── File Upload Settings ── */}
                <Section title="File Upload Settings">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">
                                Max file size (MB)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-blue-400 transition-colors"
                                value={settings.maxFileSizeMB}
                                onChange={(e) =>
                                    updateSetting("maxFileSizeMB", Number(e.target.value) || 10)
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">
                                Allowed file types
                            </label>
                            <input
                                type="text"
                                placeholder="Type extension and press Enter (e.g. pdf, jpg)"
                                className="w-full rounded-lg border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-blue-400 transition-colors"
                                onKeyDown={handleFileTypeAdd}
                            />
                            <p className="text-xs text-neutral-400 mt-1">Leave empty to allow all file types.</p>
                            {settings.allowedFileTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {settings.allowedFileTypes.map((ft) => (
                                        <span
                                            key={ft}
                                            className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-full"
                                        >
                                            .{ft}
                                            <button
                                                type="button"
                                                onClick={() => removeFileType(ft)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                {/* ── Error / Success ── */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl px-5 py-3 text-red-600 text-sm">
                        {error}
                    </div>
                )}
                {saved && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl px-5 py-3 text-green-600 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Settings saved successfully.
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex items-center gap-3 pt-2 pb-8">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                    <button
                        onClick={() => navigate(`/form/${formId}/edit`)}
                        className="text-neutral-400 hover:text-neutral-600 font-medium px-4 py-3 rounded-xl transition-colors text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormSetting;
