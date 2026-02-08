import React from 'react';


const UseDetails = () => {
 
  return (
    <>
      {/* Hero/Highlight Section */}
      
   
      <div className="flex flex-col items-center justify-center w-[90vw] space-y-16 p-6">

      {/* Feature 1 - Form Creation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl">
        <img
          src="/f1.jpeg" alt="AvishForms Logo"
          className="w-full max-w-sm mx-auto rounded-xl shadow-lg"
          />
        <div>
          <h1 className="text-black text-4xl font-bold mb-4">
            Effortless Form Creation
          </h1>
          <p className="text-gray-700 text-lg">
            Build smart, customizable forms to gather insights, feedback, and data with ease.
            Drag-and-drop simplicity meets powerful logic to suit any use case—from surveys to registrations.
          </p>
        </div>
      </div>
      {/* adding horizontal line */}
      <hr className="border-gray-300 my-8 w-full max-w-6xl" />
      {/* Feature 2 - Geofencing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl">
        <div>
          <h1 className="text-black text-4xl font-bold mb-4">
            Geofencing-Based Access
          </h1>
          <p className="text-gray-700 text-lg">
            Enable location-based form restrictions. Only users physically within your defined geofence can access and submit the form—ideal for local attendance, secure zones, or event check-ins.
          </p>
        </div>
        <img
          src="/f2.jpeg"
          alt="Geofencing Form"
          className="w-full max-w-sm mx-auto rounded-xl shadow-lg"
          />
      </div>

      <hr className="border-gray-300 my-8 w-full max-w-6xl" />
      {/* Feature 3 - Domain Based */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl">
        <div className="w-full max-w-sm mx-auto rounded-xl shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 p-8 border border-blue-200">
          {/* Mock form interface showing domain restriction */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Secure Access</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="user@company.com"
                    className="w-full p-3 border border-green-300 rounded-md bg-green-50 text-green-700"
                    readOnly
                    />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 absolute right-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs text-green-600 mt-1">✓ Domain allowed: @company.com</p>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Only @company.com, @organization.edu domains allowed
                </div>
              </div>
            </div>
          </div>
          
          {/* Background security elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-4 right-4 w-8 h-8 border-2 border-blue-400 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-indigo-400 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-blue-400 rounded-full"></div>
          </div>
        </div>
        <div>
          <h1 className="text-black text-4xl font-bold mb-4">
            Domain-Based Restrictions
          </h1>
          <p className="text-gray-700 text-lg">
            Allow form submissions only from users with specific email domains (e.g. `@company.com`).
            Perfect for internal tools, educational institutions, or corporate feedback systems.
          </p>
        </div>
      </div>
      
      
      
    </div>

 
    </>
  );
};

export default UseDetails;
