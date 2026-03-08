
import React, { useState } from "react";
const Header = () => {

    return (
        <header className="bg-white shadow-md py-4 px-4 sm:px-6 relative">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-center">
            <img src="/logo.svg" alt="GeoForms Logo" className="h-10 w-10 mr-3" />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
            <span className="text-xs text-gray-500 ml-1 mt-5">By NITian</span>
          </h1>

          <div className="flex items-center space-x-0.5">
            <div>
              <svg
                onClick={() => navigate("/contacts")}
                className="w-9 h-9 text-indigo-500 mr-3 cursor-pointer"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>

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
                  <Menu user={user} onLogout={handleLogout} onClose={() => setMenuOpen(false)} />
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={handleLogin}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-all duration-200 border border-indigo-200 cursor-pointer"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    )
}