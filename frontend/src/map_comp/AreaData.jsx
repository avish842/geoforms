import React from "react";
import { useDrawingContext } from "./context/DrawingContext";

const AreaData = () => {
    const { state,userLocation } = useDrawingContext();

    
    
    console.log("AreaData", state.now);

    // Ensure comp is always an array to prevent runtime errors
    const comp = state.now || [];
    
    console.log("comp L", comp.length);
    console.log("comp E", comp.length > 0 ? comp[0] : "No elements");
    const bound = comp[0]?.snapshot?.bounds;
    console.log("bounds", bound);
    console.log("userLocation", userLocation);

    return (
        <div className=" p-2 m-1 bg-white rounded-lg shadow-md w-10%  text-sm font-medium ">
            <h2 >lat: {userLocation?.lat}<br></br> lng: {userLocation?.lng}</h2>
        </div>
    );
};

export default AreaData;
