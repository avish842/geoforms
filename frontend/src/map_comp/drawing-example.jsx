import React, { useEffect, useRef, useState } from 'react';
import {
  ControlPosition,
  Map,
  MapControl,
  Marker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';

import { UndoRedoControl } from './undo-redo-control';
import { useDrawingManager } from './use-drawing-manager';
import { useDrawingContext } from './context/DrawingContext';

const GeofenceOverlay = ({ geofence }) => {
  // this is a component that will draw the geofence on the map 
  // geofence is an object that contains the geofence data 
  // for example {
  //   "type": "Polygon",
  //   "coordinates": [
  //     [
  //       12.9716,  // longitude
  //       77.5946   // latitude
  //     ]
  //   ],
  //   "radius": 100
  // }
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
      const center = { lat, lng };

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
        .map(([lng, lat]) => ({ lat, lng }));

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

const DrawingExample = ({ geofence }) => {
  const drawingManager = useDrawingManager();
  const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

  const [userLocation, setUserCurrentLocation] = useState(INDIA_CENTER);
  const [initialCenter, setInitialCenter] = useState(INDIA_CENTER);
  const [locationToast, setLocationToast] = useState(null); // { type: 'info'|'error'|'success', message: string }

  // Show a temporary toast message on the map
  const showToast = (type, message, duration = 5000) => {
    setLocationToast({ type, message });
    if (duration > 0) {
      setTimeout(() => setLocationToast(null), duration);
    }
  };

  // Core geolocation request — used both on mount and by the button
  const requestUserLocation = (options = {}) => {
    const { panMap = null, showFeedback = false, timeoutMs = 30000 } = options;

    if (!navigator.geolocation) {
      if (showFeedback) showToast('error', 'Geolocation is not supported by your browser.');
      return;
    }

    if (showFeedback) showToast('info', 'Acquiring your GPS position…', 0);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setUserCurrentLocation(location);
        setInitialCenter((prev) => {
          // Only update initialCenter if it was still at the default India center
          if (prev.lat === INDIA_CENTER.lat && prev.lng === INDIA_CENTER.lng) return location;
          return prev;
        });

        if (panMap) {
          panMap.panTo(location);
          panMap.setZoom(18);
        }

        if (showFeedback) showToast('success', 'Location found!', 2500);
      },
      (error) => {
        console.warn('Geolocation error:', error.code, error.message);

        if (error.code === 1) {
          // PERMISSION_DENIED
          showToast(
            'error',
            'Location access is blocked. Click the 🔒 lock icon in your address bar → Site settings → Allow Location, then try again.',
            0 // persist until dismissed
          );
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          if (showFeedback) showToast('error', 'Location unavailable. Make sure GPS/Wi-Fi is enabled on your device.');
        } else if (error.code === 3) {
          // TIMEOUT
          if (showFeedback) showToast('error', 'Location request timed out. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  };

  // ─── Auto-request location on mount ───
  // Fire getCurrentPosition IMMEDIATELY to trigger the browser's native
  // permission popup as fast as possible (no permissions.query delay).
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Fire instantly — this triggers the browser popup right away
    requestUserLocation({ timeoutMs: 60000 });

    // In parallel, set up a listener for permission state changes
    // (e.g. user later revokes or grants access via browser settings)
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        result.addEventListener('change', () => {
          if (result.state === 'granted') {
            setLocationToast(null);
            requestUserLocation({ timeoutMs: 15000, showFeedback: true });
          } else if (result.state === 'denied') {
            showToast(
              'error',
              'Location access was revoked. Click the 🔒 lock icon → Allow Location to re-enable.',
              0
            );
          }
        });
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const UserCurrentLocationButton = () => {
    const map = useMap();
    const [locating, setLocating] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const handleGetCurrentLocation = async () => {
      if (!navigator.geolocation) {
        showToast('error', 'Geolocation is not supported by your browser.');
        return;
      }

      setLocating(true);

      // Check permission state first
      let permState = null;
      try {
        if (navigator.permissions?.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          permState = result.state;
        }
      } catch {
        // Permissions API not available — proceed anyway
      }

      if (permState === 'denied') {
        setLocating(false);
        showToast(
          'error',
          'Location access is blocked. Click the 🔒 lock icon in your address bar → Site settings → Allow Location, then try again.',
          0
        );
        return;
      }

      // If permission is "prompt", the browser will show its native popup.
      // Use a very long timeout so the user has time to click "Allow".
      const timeoutMs = permState === 'prompt' ? 60000 : 15000;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setUserCurrentLocation(location);
          setLocating(false);
          setIsActive(true);

          // Pan the map smoothly to the user's location
          if (map) {
            map.panTo(location);
            map.setZoom(18);
          }

          showToast('success', 'Location updated!', 2000);
          setTimeout(() => setIsActive(false), 3000);
        },
        (error) => {
          console.warn('Location button error:', error.code, error.message);
          setLocating(false);

          if (error.code === 1) {
            showToast(
              'error',
              'Location access denied. Click the 🔒 lock icon in your address bar → Site settings → Allow Location.',
              0
            );
          } else if (error.code === 2) {
            showToast('error', 'Could not determine your position. Ensure GPS/Wi-Fi is enabled.');
          } else {
            showToast('error', 'Location request timed out. Please try again.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0,
        }
      );
    };

    return (
      <button
        onClick={handleGetCurrentLocation}
        disabled={locating}
        title="Go to your current location"
        style={{
          width: 40,
          height: 40,
          margin: '0 10px 10px 0',
          padding: 0,
          border: 'none',
          borderRadius: 2,
          backgroundColor: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          cursor: locating ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
      >
        {locating ? (
          /* Spinner while acquiring GPS */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <circle cx="12" cy="12" r="10" stroke="#4285F4" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        ) : (
          /* Google Maps-style crosshair icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="4"
              stroke={isActive ? '#4285F4' : '#666'}
              strokeWidth="2"
              fill={isActive ? '#4285F4' : 'none'}
              fillOpacity={isActive ? 0.15 : 0}
            />
            {/* Crosshair lines */}
            <line x1="12" y1="2" x2="12" y2="7" stroke={isActive ? '#4285F4' : '#666'} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" stroke={isActive ? '#4285F4' : '#666'} strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="12" x2="7" y2="12" stroke={isActive ? '#4285F4' : '#666'} strokeWidth="2" strokeLinecap="round" />
            <line x1="17" y1="12" x2="22" y2="12" stroke={isActive ? '#4285F4' : '#666'} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    );
  };

  /* ─── Location Toast Overlay ─── */
  const LocationToast = () => {
    if (!locationToast) return null;

    const bgColor = locationToast.type === 'error' ? '#DC2626'
      : locationToast.type === 'success' ? '#16A34A'
      : '#2563EB';

    return (
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          maxWidth: '90%',
          width: 'fit-content',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            backgroundColor: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            color: '#fff',
            fontSize: 13,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.4,
          }}
        >
          {/* Colored dot indicator */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: bgColor,
              flexShrink: 0,
              animation: locationToast.type === 'info' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

          <span style={{ flex: 1 }}>{locationToast.message}</span>

          {/* Dismiss button (always visible for persistent toasts) */}
          <button
            onClick={() => setLocationToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '0 0 0 4px',
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {initialCenter && userLocation ? (
        <div style={{ position: 'relative', width: '100%', height: '85%' }}>
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultZoom={20}
            defaultCenter={initialCenter}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            keyboardShortcuts={false}
            mapTypeControlStyle={0}
            mapTypeId="hybrid"
          >
            <PlacesSearchControl />
            <MapControl position={ControlPosition.RIGHT_BOTTOM}>
              <UserCurrentLocationButton />
            </MapControl>
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

          {/* Toast overlay rendered on top of the map */}
          <LocationToast />
        </div>
      ) : (
        <div>No Map Data Available !! turn on location and reload page</div>
      )}
    </>
  );
};

export default DrawingExample;

