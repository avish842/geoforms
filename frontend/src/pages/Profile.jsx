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

    return (    
        <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "25px" }}>Profile</h2>

            {!userData ? (
                <p style={{ textAlign: "center" }}>Loading...</p>
            ) : (
                <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid #e0e0e0" }}>
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "50%",
                            backgroundColor: "#4F46E5", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "24px", fontWeight: "bold", marginRight: "15px"
                        }}>
                            {userData.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>{userData.fullName}</h3>
                            <span style={{
                                fontSize: "12px", padding: "2px 8px", borderRadius: "10px",
                                backgroundColor: userData.role === "admin" ? "#EF4444" : "#6B7280",
                                color: "white", marginTop: "4px", display: "inline-block"
                            }}>
                                {userData.role}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Username</label>
                            <p style={{ margin: "2px 0 0", fontSize: "15px" }}>@{userData.username}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Email</label>
                            <p style={{ margin: "2px 0 0", fontSize: "15px" }}>{userData.email}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Plan</label>
                            <p style={{ margin: "2px 0 0", fontSize: "15px", textTransform: "capitalize" }}>{userData.plan}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Referral Code</label>
                            <div style={{ marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                {!isEditingReferral ? (
                                    <p style={{ margin: 0, fontSize: "15px", fontFamily: "monospace" }}>{userData.referralCode}</p>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>Editing referral code</p>
                                )}
                                {!isEditingReferral ? (
                                    <button
                                        type="button"
                                        onClick={openEditReferral}
                                        aria-label="Edit referral code"
                                        title="Edit referral code"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "6px",
                                            border: "1px solid #D1D5DB",
                                            background: "white",
                                            color: "#4F46E5",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                        </svg>
                                    </button>
                                ) : null}
                            </div>
                            {isEditingReferral ? (
                                <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        value={referralCodeInput}
                                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                        placeholder="Enter new referral code"
                                        maxLength={16}
                                        style={{
                                            flex: 1,
                                            padding: "8px 10px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontFamily: "monospace",
                                            fontSize: "14px",
                                            textTransform: "uppercase",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleReferralCodeUpdate}
                                        disabled={savingCode}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: savingCode ? "#9CA3AF" : "#4F46E5",
                                            color: "white",
                                            cursor: savingCode ? "default" : "pointer",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {savingCode ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEditReferral}
                                        disabled={savingCode}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid #D1D5DB",
                                            background: "white",
                                            color: "#374151",
                                            cursor: savingCode ? "default" : "pointer",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : null}
                            {codeError ? (
                                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#DC2626" }}>{codeError}</p>
                            ) : null}
                            {codeMessage ? (
                                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#059669" }}>{codeMessage}</p>
                            ) : null}
                        </div>
                        <div style={{ display: "flex", gap: "30px" }}>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Total Referrals</label>
                                <p style={{ margin: "2px 0 0", fontSize: "15px" }}>{userData.totalReferrals}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Paid Referrals</label>
                                <p style={{ margin: "2px 0 0", fontSize: "15px" }}>{userData.paidReferrals}</p>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Member Since</label>
                            <p style={{ margin: "2px 0 0", fontSize: "15px" }}>
                                {new Date(userData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}           

export default Profile;