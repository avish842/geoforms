import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const mockStats = [
  { label: "Active Users", value: 482, accent: "bg-indigo-100 text-indigo-700" },
  { label: "Paid Users", value: 132, accent: "bg-green-100 text-green-700" },
  { label: "Active Forms", value: 214, accent: "bg-blue-100 text-blue-700" },
  { label: "Monthly Revenue", value: "₹84,200", accent: "bg-amber-100 text-amber-700" },
];

const mockPayments = [
  { id: "pay_1", user: "Aditi Sharma", plan: "Pro", amount: "₹1,299", status: "success", at: "Today" },
  { id: "pay_2", user: "Rahul Mehta", plan: "Starter", amount: "₹499", status: "success", at: "Today" },
  { id: "pay_3", user: "Saanvi Rao", plan: "Pro", amount: "₹1,299", status: "pending", at: "1h ago" },
  { id: "pay_4", user: "Tejas Nair", plan: "Enterprise", amount: "₹4,999", status: "failed", at: "3h ago" },
];

const mockUsers = [
  { name: "Aditi Sharma", email: "aditi@example.com", role: "admin", plan: "pro" },
  { name: "Rahul Mehta", email: "rahul@example.com", role: "user", plan: "starter" },
  { name: "Saanvi Rao", email: "saanvi@example.com", role: "user", plan: "pro" },
  { name: "Tejas Nair", email: "tejas@example.com", role: "user", plan: "enterprise" },
];

const statusBadge = {
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const SuperAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAllowed = useMemo(() => user && (user.role === "admin" || user.role === "superadmin"), [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow rounded-xl p-6 w-full max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Login required</h1>
          <p className="text-gray-600 text-sm">Sign in to access the superadmin dashboard.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-500 transition cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow rounded-xl p-6 w-full max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Access denied</h1>
          <p className="text-gray-600 text-sm">You need superadmin/admin rights to view this page.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-lg bg-gray-900 text-white py-2.5 font-semibold hover:bg-gray-800 transition cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-gray-500">Superadmin</p>
            <h1 className="text-3xl font-bold text-gray-900">Control Center</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-white transition cursor-pointer"
            >
              Home
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${stat.accent}`}>
                {stat.label}
              </span>
              <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
              <span className="text-xs text-gray-500">Mock data</span>
            </div>
            <div className="space-y-3">
              {mockPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.user}</p>
                    <p className="text-xs text-gray-500">{p.plan} • {p.at}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{p.amount}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <span className="text-xs text-gray-500">Mock data</span>
            </div>
            <div className="divide-y divide-gray-100">
              {mockUsers.map((u) => (
                <div key={u.email} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                      {u.role}
                    </span>
                    <p className="text-xs text-gray-500 capitalize mt-1">Plan: {u.plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Admin Shortcuts</h2>
            <span className="text-xs text-gray-500">Actions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Manage Plans", "Review Reports", "User Entitlements", "Billing", "Support Queue", "System Health"].map((item) => (
              <button
                key={item}
                className="w-full text-left p-4 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-900">{item}</p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
