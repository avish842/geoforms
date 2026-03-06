import React from 'react';

import {APIProvider} from '@vis.gl/react-google-maps';
import{DrawingProvider} from './context/DrawingContext';
import DrawingExample from './drawing-example';
import AreaData from './AreaData';




const MapsComp = () => {
  
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        {/* <h1>Welcome to Google maps</h1> */}
     
        
      <DrawingExample >

      </DrawingExample>
      <AreaData/>    
    </APIProvider>
  );
};

export default MapsComp;


