import { useEffect,useState } from "react";

const Profile = () => {

    const [userData, setUserData] = useState(null);

    useEffect(()=>{
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include", // Include cookies for authentication
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }
                const data = await response.json();
                setUserData(data.data);
                console.log("User Data:", data.data);

            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    },[]);
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
                            <p style={{ margin: "2px 0 0", fontSize: "15px", fontFamily: "monospace" }}>{userData.referralCode}</p>
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