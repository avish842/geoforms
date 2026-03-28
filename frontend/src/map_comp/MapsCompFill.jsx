import React, {useEffect, useRef, useState} from 'react';
import {Map, Marker, APIProvider, useMap} from '@vis.gl/react-google-maps';
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

const MapsCompFill = ({userLocation: externalUserLocation = null, geofence = null}) => {
  const {userLocation: contextUserLocation} = useDrawingContext();
  const userLocation = externalUserLocation || contextUserLocation;
  const [initialCenter, setInitialCenter] = useState(null);

  useEffect(() => {
    if (userLocation && !initialCenter) {
      setInitialCenter(userLocation);
    }
  }, [userLocation, initialCenter]);

  return (
    <>
      {initialCenter && userLocation ? (
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <Map
            style={{width: '100%', height: '420px'}}
            defaultZoom={20}
            defaultCenter={initialCenter}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapTypeControlStyle={0}
            mapTypeId="hybrid"
          >
            <GeofenceOverlay geofence={geofence} />
            <Marker
              position={initialCenter}
              icon="https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"
            />
            <Marker
              position={userLocation}
              draggable={true}
              icon="https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png"
            />
          </Map>
        </APIProvider>
      ) : (
        <div>No Map Data Available !! turn on location and reload page</div>
      )}
    </>
  );
};

export default MapsCompFill;
