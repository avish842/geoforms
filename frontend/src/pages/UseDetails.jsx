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

      
    </div>

 
    </>
  );
};

export default UseDetails;
