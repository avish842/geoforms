import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const Profile = () => {
    const { user, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [referralCodeInput, setReferralCodeInput] = useState("");
    const [isEditingReferral, setIsEditingReferral] = useState(false);
    const [savingCode, setSavingCode] = useState(false);
    const [codeMessage, setCodeMessage] = useState("");
    const [codeError, setCodeError] = useState("");

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchProfile()
            .then((data) => {
                if (data) {
                    setUserData(data);
                    // Keep user edits intact while edit mode is open.
                    if (!isEditingReferral) {
                        setReferralCodeInput(data.referralCode || "");
                    }
                }
                else navigate("/login");
            })
            .catch(() => navigate("/login"));
    }, [user, fetchProfile, navigate, isEditingReferral]);

    const handleReferralCodeUpdate = async () => {
        const normalizedCode = referralCodeInput.trim().toUpperCase();
        setCodeMessage("");
        setCodeError("");

        if (!/^[A-Z0-9]{6,16}$/.test(normalizedCode)) {
            setCodeError("Use 6-16 characters with letters A-Z and numbers 0-9 only.");
            return;
        }

        try {
            setSavingCode(true);
            const res = await fetch(`${API_URL}/api/v1/user/referral-code`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ referralCode: normalizedCode }),
            });

            const data = await res.json();
            if (!res.ok) {
                setCodeError(data?.message || "Failed to update referral code");
                return;
            }

            const refreshed = await fetchProfile();
            if (refreshed) {
                setUserData(refreshed);
                setReferralCodeInput(refreshed.referralCode || normalizedCode);
            } else {
                setReferralCodeInput(normalizedCode);
            }

            setCodeMessage(data?.message || "Referral code updated successfully");
            setIsEditingReferral(false);
        } catch {
            setCodeError("Something went wrong while updating referral code");
        } finally {
            setSavingCode(false);
        }
    };

    const openEditReferral = () => {
        setCodeMessage("");
        setCodeError("");
        setReferralCodeInput(userData?.referralCode || "");
        setIsEditingReferral(true);
    };

    const cancelEditReferral = () => {
        setCodeMessage("");
        setCodeError("");
        setReferralCodeInput(userData?.referralCode || "");
        setIsEditingReferral(false);
    };

    const planColors = {
        free: "bg-gray-100 text-gray-600",
        pro: "bg-indigo-100 text-indigo-700",
        enterprise: "bg-amber-100 text-amber-700",
    };

    const planBadge = planColors[userData?.plan] || "bg-gray-100 text-gray-600";

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Home Button */}
                <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Home
                </button>

                {!userData ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Cover gradient */}
                            <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />

                            {/* Avatar + name */}
                            <div className="px-6 pb-6">
                                <div className="flex items-end gap-4 -mt-10 mb-4">
                                    <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white">
                                        {userData.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="mb-1 flex-1">
                                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{userData.fullName}</h2>
                                        <p className="text-sm text-gray-500">@{userData.username}</p>
                                    </div>
                                    <div className="mb-1 flex gap-2 flex-wrap justify-end">
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${planBadge}`}>
                                            {userData.plan} plan
                                        </span>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${userData.role === "admin" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                                            {userData.role}
                                        </span>
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Email</p>
                                        <p className="text-sm text-gray-800 font-medium break-all">{userData.email}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Member Since</p>
                                        <p className="text-sm text-gray-800 font-medium">
                                            {new Date(userData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center">
                                <p className="text-3xl font-bold text-indigo-600">{userData.totalReferrals ?? 0}</p>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Total Referrals</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center">
                                <p className="text-3xl font-bold text-emerald-600">{userData.paidReferrals ?? 0}</p>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Paid Referrals</p>
                            </div>
                        </div>

                        {/* Referral Code Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Your Referral Code</p>
                                    {!isEditingReferral && (
                                        <p className="text-2xl font-mono font-bold text-indigo-700 mt-1 tracking-widest">
                                            {userData.referralCode}
                                        </p>
                                    )}
                                </div>
                                {!isEditingReferral && (
                                    <button
                                        type="button"
                                        onClick={openEditReferral}
                                        aria-label="Edit referral code"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingReferral && (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={referralCodeInput}
                                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                        placeholder="Enter new referral code"
                                        maxLength={16}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleReferralCodeUpdate}
                                            disabled={savingCode}
                                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {savingCode ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditReferral}
                                            disabled={savingCode}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {codeError && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    {codeError}
                                </p>
                            )}
                            {codeMessage && (
                                <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
                                    {codeMessage}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}           

export default Profile;