import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_NAME, VERSION } from "../constants.js";
import { useAuth } from "../auth/AuthContext";
import Menu from "./Menu.jsx";
import UseDetails from "./UseDetails.jsx";

const Avatar = ({ name }) => {
  const getInitials = (n) => {
    if (!n) return " ";
    const words = n.split(" ");
    return words.map((word) => word[0]).join("").toUpperCase();
  };

  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
      {getInitials(name)}
    </div>
  );
};

const Home = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const createForm = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/create-form`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (res.ok) {
      const formId = data.data._id;
      navigate(`/form/${formId}/edit`);
    } else {
      console.error("Failed to create form", data);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-4 sm:px-6 relative">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-center">
            <img src="/logo.svg" alt="GeoForms Logo" className="h-10 w-10 mr-3" />
            <span className="bg-linear-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
            <span className="text-xs text-gray-500 ml-1 mt-5">By NITian</span>
          </h1>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/plans")}
              className="hidden md:inline-flex items-center gap-2 bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-amber-950 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer border border-amber-300 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
              Upgrade
            </button>
            {user ? (
              <div className="flex items-center">
                <div
                  className="hidden sm:flex items-center mr-4 cursor-pointer"
                  onClick={() => navigate("/profile")}
                >
                  <Avatar name={user.fullName} />
                  <span className="ml-2 text-gray-700 text-sm font-medium">
                    {user.fullName}
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1 sm:py-2 text-sm rounded-lg transition-all duration-200 border border-indigo-200 cursor-pointer"
                >
                  ☰
                </button>
                {menuOpen && (
                  <Menu
                    user={user}
                    onLogout={logout}
                    onClose={() => setMenuOpen(false)}
                    onCreateForm={createForm}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => navigate("/login")}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-all duration-200 border border-indigo-200 cursor-pointer"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          {/* Hero Section */}
          <div className="w-full bg-linear-to-br from-indigo-50 via-blue-50 to-white py-16 px-6 relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {APP_NAME} is the best way to{" "}
                <span className="bg-linear-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent relative">
                  securely collect data
                  <span className="absolute -bottom-2 left-0 right-0 h-1 bg-linear-to-r from-indigo-600 to-blue-500 rounded-full opacity-30"></span>
                </span>{" "}
                from your users, teams, and communities
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Powerful, flexible form creation with location and domain-based access control.
                Protect your data and ensure only the right people can submit forms—anywhere, anytime.
              </p>

              {/* Feature icons */}
              <div className="flex justify-center space-x-8 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Secure</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Location-Based</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Easy Creation</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  className="cursor-pointer bg-linear-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={createForm}
                >
                  Start Creating Forms
                </button>
                <button
                  className="cursor-pointer inline-flex items-center gap-2 bg-linear-to-r from-amber-300 via-yellow-200 to-amber-400 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-amber-950 font-semibold py-4 px-8 rounded-lg shadow-md border border-amber-300 transition-all duration-200"
                  onClick={() => navigate("/plans")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                  Upgrade
                </button>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-linear-to-tr from-indigo-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>

          <UseDetails />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <p>Version {VERSION}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
