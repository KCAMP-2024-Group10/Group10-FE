import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// 지도 스타일
const containerStyle = {
  width: '100%',
  height: '500px',
};

// 초기 중심 좌표 (서울 시청)
const center = {
  lat: 37.5665,
  lng: 126.9780,
};

function Main() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Google Map Example</h1>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default Main;