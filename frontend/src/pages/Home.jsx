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
  const [loading, setLoading] = useState(false);

  const createForm = async () => {
  setLoading(true);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/create-form`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if(res.status === 401) {
      alert("Please login to create a form.");
      navigate("/login");
      return;
    }

    if (res.status === 403) {
      alert("Please upgrade your plan to create more forms or access this feature.");
      navigate("/plans");
      return;
    }

    const data = await res.json();

    if (res.ok) {
      const formId = data.data._id;
      navigate(`/form/${formId}/edit`);
    } else {
      console.error("Failed to create form", data);
    }

  } catch (err) {
    console.error("Error creating form:", err);
  } finally {
    // ✅ always runs (success, error, or return)
    setLoading(false);
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
            {
              (user?.plan==="free") && (
              <button
                onClick={() => navigate("/plans")}
                className="hidden md:inline-flex items-center gap-2  hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-yellow-00 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer border border-amber-200 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
                Upgrade
              </button>
              )
            }
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

                {
                  loading ? (
                    <button
                      className="cursor-not-allowed bg-gray-300 text-gray-500 font-semibold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 transform"
                      disabled={true}                    >
                      Creating Form...
                    </button>
                  ):
                (<button
                className="cursor-pointer bg-linear-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={createForm}
                >
                  Start Creating Forms
                </button>)
                }

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
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4">
            {/* Social Media Links */}
            <div className="flex items-center gap-5">
              {/* Twitter / X */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
            </div>
            {/* Copyright */}
            <div className="text-center text-gray-500 text-sm">
              <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
              <p>Version {VERSION}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
