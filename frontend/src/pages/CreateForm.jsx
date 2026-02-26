import { useEffect, useRef } from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "multiple choice", label: "Multiple Choice" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "date", label: "Date" },
    { value: "file", label: "File Upload" },
];

const OPTION_TYPES = ["multiple choice", "checkbox", "radio"];

const CreateForm = () => {
    const [page, setPage] = useState("Form");
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

    const fillLink = `${window.location.origin}/form/${formId}/fill`;

    const copyLink = () => {
        navigator.clipboard.writeText(fillLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                console.log("Fetched form data:", data);
                if (data.success !== false && data.data) {
                    const form = data.data;
                    setFormTitle(form.title || "");
                    setFormDescription(form.description || "");
                    setFields(form.fields || []);
                    if (form.settings) setSettings(form.settings);
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
        const timer=setTimeout(()=>{
            autoSave();
        }, 1000);
        return ()=>clearTimeout(timer);
     }, [formTitle,formDescription,fields]);

    const autoSave=async ()=>{
        console.log("Auto-saving form data...");
        // Here you would typically make an API call to save the form data to the backend
        // For this example, we'll just log the current form state
        console.log({
            title: formTitle,
            description: formDescription,
            fields,
            settings,
                });
        
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/update/${formId}/`,{
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
            })
        });
        
                
    }

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <p className="text-neutral-400 text-lg">Loading form...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 py-12 px-4 sm:px-6">
            <header className="mb-10 border-amber-600 border-2 rounded-xl p-6 bg-white shadow-sm">
                  
                   <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/form/${formId}/settings`)}
                        className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-blue-600 bg-neutral-100 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </button>
                    <button
                        onClick={() => navigate(`/form/${formId}/responses`)}
                        className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-emerald-600 bg-neutral-100 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Responses
                    </button>
                   </div>
           </header>

            <div className="max-w-3xl mx-auto">
                

                {/* ── Title & Description ── */}
                <div className="mb-10 bg-white rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                    {/* Copy fill link */}
                    <div className="flex items-center gap-2 mb-4 bg-neutral-50 rounded-lg border border-neutral-200 px-3 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="flex-1 text-sm text-neutral-500 truncate">{fillLink}</span>
                        <button
                            type="button"
                            onClick={copyLink}
                            className={`shrink-0 text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                                copied
                                    ? "bg-green-100 text-green-600"
                                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                        >
                            {copied ? "Copied!" : "Copy link"}
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Untitled form"
                        className="w-full text-4xl font-semibold tracking-tight text-neutral-900 placeholder-neutral-300 
                                   bg-transparent border-b-2 border-blue-300 outline-none pb-2"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                    />
                    <textarea
                        placeholder="Add a description..."
                        rows={2}
                        className="w-full mt-4 text-base text-neutral-600 placeholder-neutral-300 
                                   bg-transparent border border-neutral-200 rounded-md p-2 outline-none resize-none leading-relaxed
                                   focus:border-blue-300 transition-colors"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                    />
                </div>

                {/* ── Fields ── */}
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl border-2 border-neutral-300 p-6 
                                       hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                            {/* question + type */}
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Question"
                                        className="w-full text-lg font-semibold text-neutral-800 placeholder-neutral-300 
                                                   bg-transparent border-b-2 border-neutral-200 outline-none pb-1
                                                   focus:border-blue-400 transition-colors"
                                        value={field.label}
                                        onChange={(e) => updateField(index, "label", e.target.value)}
                                    />
                                </div>
                                <select
                                    className="text-sm text-neutral-500 bg-white border-2 border-neutral-300 
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
                                            />
                                            <button
                                                className="opacity-0 group-hover/opt:opacity-100 text-neutral-300 
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
                            <div className="mt-5 pt-4 border-t-2 border-neutral-200 flex items-center justify-end gap-4">
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
