import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {APP_NAME , VERSION} from "../constants.js";

const Home = () => {
  const [user, setUser] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.data); // user object from ApiResponse
        }
      } catch (err) {
        console.log("Not logged in");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    navigate("/login");
  }

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  }
  const createForm =async () => {
    const res=await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/create-form`,{
      method:"POST",
      credentials:"include",  
      headers:{
        "Content-Type":"application/json"
      },  
      
    });
    
    const data = await res.json();
    console.log(data);
    if(res.ok){
      const formId=data.data._id;
      navigate(`/form/${formId}/edit`);
    } else {
      console.error("Failed to create form", data);
    }

  }


  
  return (
    <div className="min-h-screen  bg-white">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-4 sm:px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-center">
            <img src="/logo.svg" alt="AvishForms Logo" className="h-10 w-10 mr-3" />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
            <span className="text-xs text-gray-500 ml-[5px] mt-[20px]">By NITian</span>
          </h1>

          <button className=" border-amber-500" onClick={() => navigate("/forms")}>My Form</button>

          <div className="flex items-center space-x-0.5">
            <div >
              
              <svg  onClick={() => navigate("/contacts")} className="w-9 h-9 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              {/* <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1 sm:py-2  rounded-lg transition-all duration-200 border border-indigo-200" onClick={() => navigate("/contacts")}>Contacts</button> */}
            </div>
            {user ? (
            <div className="flex items-center">
              <div className="hidden sm:flex items-center mr-4" onClick={() => navigate('/profile')}>
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="h-8 w-8 rounded-full border-2 border-indigo-200"
                  />
                <span className="ml-2 text-gray-700 text-sm font-medium hidden sm:inline">
                  {user.displayName}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1 sm:py-2 text-sm rounded-lg transition-all duration-200 border border-indigo-200  cursor-pointer"
                >
                Logout
              </button>
            </div>
          ):<div className="flex items-center">
            <button 
                onClick={handleLogin}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1 sm:py-2  rounded-lg transition-all duration-200 border border-indigo-200 cursor-pointer"
                >
                Login
              </button>
            </div>}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">

          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {APP_NAME} is the best way to{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent relative">
              securely collect data
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full opacity-30"></div>
            </span>{' '}
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
          <div className="flex justify-center cursor-pointer">
            <button className=" cursor-pointer bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            onClick={createForm}
            >
              Start Creating Forms
            </button>
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
      {}

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
