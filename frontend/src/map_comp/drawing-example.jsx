import React, { useEffect, useRef, useState } from 'react';
import {
  ControlPosition,
  Map,
  MapControl,
  Marker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';

import {UndoRedoControl} from './undo-redo-control';
import {useDrawingManager} from './use-drawing-manager';
import {useDrawingContext} from './context/DrawingContext';

const GeofenceOverlay = ({geofence}) => {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!map || !geofence?.type) return;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (geofence.type === 'Point' && Array.isArray(geofence.coordinates) && geofence.coordinates.length === 2) {
      const [lng, lat] = geofence.coordinates;
      const center = {lat, lng};

      const circle = new google.maps.Circle({
        map,
        center,
        radius: Number(geofence.radius) || 0,
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#60a5fa',
        fillOpacity: 0.2,
        clickable: false
      });

      overlayRef.current = circle;
      const bounds = circle.getBounds();
      if (bounds) map.fitBounds(bounds);
    }

    if (geofence.type === 'Polygon' && Array.isArray(geofence.coordinates?.[0])) {
      const ring = geofence.coordinates[0]
        .filter((point) => Array.isArray(point) && point.length >= 2)
        .map(([lng, lat]) => ({lat, lng}));

      if (ring.length >= 3) {
        const polygon = new google.maps.Polygon({
          map,
          paths: ring,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: '#60a5fa',
          fillOpacity: 0.2,
          clickable: false
        });

        overlayRef.current = polygon;
        const bounds = new google.maps.LatLngBounds();
        ring.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds);
      }
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, geofence]);

  return null;
};

const DrawingExample = ( { geofence } ) => {
  const drawingManager = useDrawingManager();
  const { userLocation } = useDrawingContext();
  
  const [initialCenter, setInitialCenter] = useState(null);

  // Set initialCenter only once, when userLocation is first available
  useEffect(() => {
    if (userLocation && !initialCenter) {
      setInitialCenter(userLocation);
    }
  }, [userLocation, initialCenter]);

  const PlacesSearchControl = () => {
    const map = useMap();
    const places = useMapsLibrary('places');
    const autocompleteRef = useRef(null);

    useEffect(() => {
      if (!map || !places || !autocompleteRef.current) return;

      const element = autocompleteRef.current;

      const handleSelect = async (event) => {
        try {
          const prediction = event?.placePrediction || event?.detail?.placePrediction;
          if (!prediction || typeof prediction.toPlace !== 'function') return;

          const place = prediction.toPlace();
          await place.fetchFields({ fields: ['location'] });

          const loc = place.location;
          if (!loc) return;

          const center = {
            lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
            lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
          };

          map.panTo(center);
          map.setZoom(17);
          setInitialCenter(center);
        } catch (error) {
          console.error('Failed to select searched place', error);
        }
      };

      element.addEventListener('gmp-select', handleSelect);
      return () => element.removeEventListener('gmp-select', handleSelect);
    }, [map, places]);

    return (
      <MapControl position={ControlPosition.TOP_CENTER} >
        <div className=' m-1 '>
          <gmp-place-autocomplete style={{ display: 'block', width: '75%', height: '44px' }} ref={autocompleteRef} placeholder="Search a place" />
        </div>
     
      </MapControl>
    );
  };
  

  return (
    <>
      {initialCenter && userLocation ? (
        <Map
          style={{ width: '100%', height: '85%', }}
          defaultZoom={20}
          defaultCenter={initialCenter}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          keyboardShortcuts={false}
          mapTypeControlStyle={0}
          mapTypeId="hybrid"
          
        >
          <PlacesSearchControl />
          <GeofenceOverlay geofence={geofence} />

          <Marker
            position={userLocation}
            draggable={true}
            icon="https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png"
          />

          <MapControl position={ControlPosition.TOP_RIGHT}>
            <UndoRedoControl drawingManager={drawingManager} />
          </MapControl>
        </Map>
      ) : (
        <div>No Map Data Available !! turn on location and reload page</div>
      )}
    </>
  );
};

export default DrawingExample;
