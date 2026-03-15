import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDrawingContext } from "../map_comp/context/DrawingContext";

const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "multiple choice", label: "Multiple Choice" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "date", label: "Date" },
    { value: "file", label: "File Upload" },
    { value: "live_camera", label: "Live Camera" },
];

const OPTION_TYPES = ["multiple choice", "checkbox", "radio"];

const CreateForm = () => {

    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [fields, setFields] = useState([]);

    const [settings, setSettings] = useState({
        emailDomainWhitelist: [],
        geofence: {
            type: "Polygon",
            coordinates: [],
            radius: null,
        },
        submissionLimitPerUser: null,
        timeWindow: {
            start: null,
            end: null,
        },
        allowEmbeds: true,
        maxFileSizeMB: 10,
        allowedFileTypes: [],
    });
    const { formId } = useParams();
    const navigate = useNavigate();
    const isFirstRender = useRef(true);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [saveStatus, setSaveStatus] = useState("saved");

    // for geofence settings autosave dependency
    const { state } = useDrawingContext();

    const fillLink = `${window.location.origin}/form/${formId}/fill`;

    const copyLink = () => {
        navigator.clipboard.writeText(fillLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectAllOnFocus = (e) => {
        e.target.select();
    };

    // Fetch existing form data on mount
    useEffect(() => {
        if (!formId) { setLoading(false); return; }
        const fetchForm = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/form/${formId}`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success !== false && data.data) {
                    const form = data.data;
                    setFormTitle(form.title || "");
                    setFormDescription(form.description || "");
                    setFields(form.fields || []);
                    setIsPublished(Boolean(form.isActive));
                    if (form.settings) setSettings(form.settings);
                    setSaveStatus("saved");
                }
            } catch (err) {
                console.error("Failed to fetch form:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [formId]);
    

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (loading) return;
        const timer=setTimeout(async ()=>{
            try {
                await autoSave();
            } catch (error) {
                console.error("Autosave failed:", error);
            }
        }, 1000);
        return ()=>clearTimeout(timer);
     }, [formTitle,formDescription,fields,state]);
    


    const autoSave=async (extraPayload = {}, options = {})=>{
        const { trackStatus = true } = options;

        if (trackStatus) setSaveStatus("saving");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/update/${formId}/`,{
                method:"PATCH",
                credentials:"include",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    title: formTitle,
                    description: formDescription,
                    fields,
                    settings,
                    ...extraPayload,
                })
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || data?.success === false) {
                throw new Error(data?.message || "Failed to save form");
            }

            if (trackStatus) setSaveStatus("saved");
            return data;
        } catch (error) {
            if (trackStatus) setSaveStatus("failed");
            throw error;
        }
        
                
    }

    const togglePublish = async () => {
        const nextState = !isPublished;
        try {
            setPublishing(true);
            await autoSave({ isActive: nextState });
            setIsPublished(nextState);
        } catch (error) {
            console.error("Failed to update publish state:", error);
        } finally {
            setPublishing(false);
        }
    };

    const updateField = (index, key, value) => {
        const newFields = [...fields];
        newFields[index][key] = value;
        setFields(newFields);
    };

    const deleteField = (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const addOption = (fieldIndex) => {
        const newFields = [...fields];
        const len = newFields[fieldIndex].options.length;
        newFields[fieldIndex].options.push({ text: `Option ${len + 1}`, value: `option_${len + 1}` });
        setFields(newFields);
    };

    const updateOption = (fieldIndex, optIndex, value) => {
        const newFields = [...fields];
        newFields[fieldIndex].options[optIndex].text = value;
        setFields(newFields);
    };

    const deleteOption = (fieldIndex, optIndex) => {
        const newFields = [...fields];
        newFields[fieldIndex].options.splice(optIndex, 1);
        setFields(newFields);
    };

    const addField = () => {
        setFields([
            ...fields,
            { id: crypto.randomUUID(), label: "Question", type: "text", options: [], required: false },
        ]);
    };

    /* icon for the option bullet based on type */
    const optionIcon = (type) => {
        if (type === "radio" || type === "multiple choice")
            return (
                <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-neutral-300 inline-block shrink-0" />
            );
        if (type === "checkbox")
            return (
                <span className="w-3.5 h-3.5 rounded-[3px] border-[1.5px] border-neutral-300 inline-block shrink-0" />
            );
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50">
                <p className="text-neutral-400 text-lg">Loading form...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-slate-50 to-blue-50">
            {/* ── Top Header Bar ── */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-3">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left: home + title */}
                    <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                        <button
                            onClick={() => navigate("/")}
                            className="shrink-0 inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-indigo-50 transition-colors"
                            title="Back to Home"
                        >
                            <img src="/logo.svg" alt="GeoForms Logo" className="h-8 w-8" />
                            <span className="hidden sm:inline text-sm font-bold text-indigo-700">GeoForms</span>
                        </button>
                        <span className="text-gray-300 text-lg">/</span>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-40 sm:max-w-xs">
                            {formTitle || "Untitled form"}
                        </span>
                        <span
                            className={`hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-full ${
                                isPublished
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                        >
                            {isPublished ? "Published" : "Draft"}
                        </span>

                        {/* Save Status */}
                        <span
                            className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold ${
                                saveStatus === "saving"
                                    ? "text-blue-700"
                                    : saveStatus === "failed"
                                        ? "text-rose-700"
                                        : "text-emerald-700"
                            }`}
                            aria-live="polite"
                        >
                            {saveStatus === "saving" ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                    Saving...
                                </>
                            ) : saveStatus === "failed" ? (
                                "Failed to save"
                            ) : (
                                "Saved"
                            )}
                        </span>
                    </div>

                    {/* Right: action buttons */}
                    <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap items-center gap-2 sm:gap-3 pt-1 md:pt-0">

                        {/* Copy Link */}
                        <button
                            type="button"
                            onClick={copyLink}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                                copied
                                    ? "bg-green-50 text-green-600 border-green-200"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                            }`}
                            title="Copy fill link"
                        >
                            {copied ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="hidden sm:inline">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                    <span className="hidden sm:inline">Copy Link</span>
                                </>
                            )}
                        </button>

                        {/* Responses */}
                        <button
                            onClick={() => navigate(`/form/${formId}/responses`)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="View Responses"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden sm:inline">Responses</span>
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => navigate(`/form/${formId}/settings`)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Form Settings"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span className="hidden sm:inline">Settings</span>
                        </button>

                        {/* Publish */}
                        <button
                            onClick={togglePublish}
                            disabled={publishing}
                            className={`ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                                isPublished
                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                            title={isPublished ? "Unpublish form" : "Publish form"}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                            {publishing ? "Saving..." : isPublished ? "Unpublish" : "Publish"}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto py-6 sm:py-10 px-3 sm:px-6">
                

                {/* ── Title & Description ── */}
                <div className="mb-8 sm:mb-10 bg-white rounded-xl border-2 border-blue-200 p-4 sm:p-6 shadow-sm">
                        <input
                        type="text"
                        placeholder="Untitled form"
                    className="w-full text-2xl sm:text-4xl font-semibold tracking-tight text-neutral-900 placeholder-neutral-300 
                                   bg-transparent border-b-2 border-blue-300 outline-none pb-2"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                            onFocus={selectAllOnFocus}
                    />
                    <textarea
                        placeholder="Add a description..."
                        rows={2}
                        className="w-full mt-3 sm:mt-4 text-sm sm:text-base text-neutral-600 placeholder-neutral-300 
                                   bg-transparent border border-neutral-200 rounded-md p-2 outline-none resize-none leading-relaxed
                                   focus:border-blue-300 transition-colors"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                            onFocus={selectAllOnFocus}
                    />
                </div>

                {/* ── Fields ── */}
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div
                            key={field.id || index}
                            className="bg-white rounded-xl border-2 border-neutral-300 p-4 sm:p-6 
                                       hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                            {/* question + type */}
                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Question"
                                        className="w-full text-lg font-semibold text-neutral-800 placeholder-neutral-300 
                                                   bg-transparent border-b-2 border-neutral-200 outline-none pb-1
                                                   focus:border-blue-400 transition-colors"
                                        value={field.label}
                                        onChange={(e) => updateField(index, "label", e.target.value)}
                                        onFocus={selectAllOnFocus}
                                    />
                                </div>
                                <select
                                    className="w-full sm:w-auto text-sm text-neutral-500 bg-white border-2 border-neutral-300 
                                               rounded-lg px-3 py-2 outline-none cursor-pointer 
                                               hover:border-blue-300 focus:border-blue-400 transition-colors font-medium"
                                    value={field.type}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        const newFields = [...fields];
                                        newFields[index].type = newType;
                                        if (OPTION_TYPES.includes(newType) && !newFields[index].options.length) {
                                            newFields[index].options = [{ text: "Option 1", value: "option_1" }];
                                        }
                                        setFields(newFields);
                                    }}
                                >
                                    {FIELD_TYPES.map((ft) => (
                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ── Options (multiple choice / checkbox / radio) ── */}
                            {OPTION_TYPES.includes(field.type) && (
                                <div className="mt-4 space-y-1.5">
                                    {field.options.map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-3 group/opt py-1">
                                            {optionIcon(field.type)}
                                            <input
                                                type="text"
                                                className="flex-1 text-base text-neutral-700 bg-transparent 
                                                           border-b border-neutral-200 outline-none placeholder-neutral-300
                                                           focus:border-blue-300 transition-colors pb-0.5"
                                                value={option.text}
                                                onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                                onFocus={selectAllOnFocus}
                                            />
                                            <button
                                                className="text-neutral-300 sm:opacity-0 sm:group-hover/opt:opacity-100 
                                                           hover:text-neutral-500 transition-all"
                                                onClick={() => deleteOption(index, optIndex)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors 
                                                   mt-1 flex items-center gap-1.5"
                                        onClick={() => addOption(index)}
                                    >
                                        <span className="text-base leading-none">+</span> Add option
                                    </button>
                                </div>
                            )}

                            {/* ── Placeholder hints for simple types ── */}
                            {field.type === "text" && (
                                <p className="mt-4 text-base text-neutral-400 italic border-b border-dashed border-neutral-200 pb-2">Short answer</p>
                            )}
                            {field.type === "number" && (
                                <p className="mt-4 text-base text-neutral-400 italic border-b border-dashed border-neutral-200 pb-2">0</p>
                            )}
                            {field.type === "email" && (
                                <p className="mt-4 text-base text-neutral-400 italic border-b border-dashed border-neutral-200 pb-2">name@email.com</p>
                            )}
                            {field.type === "date" && (
                                <p className="mt-4 text-base text-neutral-400 italic border-b border-dashed border-neutral-200 pb-2">mm / dd / yyyy</p>
                            )}
                            {field.type === "file" && (
                                <div className="mt-4 border-2 border-dashed border-blue-200 rounded-lg py-6 
                                                flex flex-col items-center gap-2 text-neutral-400 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-3 3m3-3l3 3M4 18h16" />
                                    </svg>
                                    <span className="text-xs">Upload file</span>
                                </div>
                            )}

                            {/* ── Actions ── */}
                            <div className="mt-5 pt-4 border-t-2 border-neutral-200 flex items-center justify-between sm:justify-end gap-4">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <span className="text-sm font-medium text-neutral-500">Required</span>
                                    <button
                                        type="button"
                                        onClick={() => updateField(index, "required", !field.required)}
                                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors
                                            ${field.required ? "bg-neutral-900" : "bg-neutral-200"}`}
                                    >
                                        <span
                                            className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
                                                ${field.required ? "translate-x-3.5" : "translate-x-1"}`}
                                        />
                                    </button>
                                </label>
                                <span className="w-px h-4 bg-neutral-100" />
                                <button
                                    onClick={() => deleteField(index)}
                                    className="text-neutral-300 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Add Field ── */}
                <button
                    className="mt-6 w-full py-3.5 text-base font-medium text-blue-400 border-2 border-dashed border-blue-300 
                               rounded-xl hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50/50
                               transition-all flex items-center justify-center gap-2"
                    onClick={addField}
                >
                    <span className="text-xl leading-none">+</span> Add field
                </button>
            </div>
        </div>
    );
};

export default CreateForm;
