import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// 지도 스타일 설정
const containerStyle = {
  width: '100%',
  height: '500px', // 지도 높이 설정
};

// 초기 위치 (서울 기준)
const center = {
  lat: 37.5665,
  lng: 126.9780,
};

function Map() {
  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15} // 줌 레벨 설정
      >
        {/* 기본 위치에 마커 추가 */}
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;