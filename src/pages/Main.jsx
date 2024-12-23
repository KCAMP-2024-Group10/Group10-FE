import React, { useEffect, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

// 지도 스타일 설정
const containerStyle = {
  width: '100%',
  height: '60vh',
};

// 초기 중심 위치 (기본 위치)
const initialPosition = {
  lat: 18.810664742665605, // 기본 위치
  lng: 98.97923073813442,
};

// 렌더링 상태 처리
const render = (status) => {
  if (status === Status.LOADING) return <p>지도를 불러오는 중...</p>;
  if (status === Status.FAILURE) return <p>지도를 불러오지 못했습니다.</p>;
  return null;
};

// 지도 컴포넌트
const Map = ({ center, zoom, markers, onMapClick, directions }) => {
  const ref = React.useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(ref.current, {
      center,
      zoom,
    });

    // 클릭 이벤트 추가
    map.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onMapClick({ lat, lng }); // 클릭한 위치 전달
    });

    // 마커 추가
    markers.forEach((marker) => {
      const markerObj = new window.google.maps.Marker({
        position: marker.position,
        map,
        label: marker.label,
      });

      // 정보 창 추가
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<h4>${marker.title}</h4><p>${marker.description}</p>`,
      });

      markerObj.addListener('click', () => {
        infoWindow.open(map, markerObj);
      });
    });

    // 경로 렌더링
    if (directions) {
      const directionsRenderer = new window.google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(directions);
    }
  }, [center, zoom, markers, directions, onMapClick]);

  return <div ref={ref} style={containerStyle} />;
};

// 메인 컴포넌트
function Main() {
  const [currentLocation, setCurrentLocation] = useState(initialPosition); // 현재 위치
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [markers, setMarkers] = useState([
    {
    },
  ]);
  const [directions, setDirections] = useState(null); // 경로 상태

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCurrentLocation(userLocation);
          setMarkers((prev) => [
            ...prev,
            {
              position: userLocation,
              label: 'B',
              title: '현재 위치',
              description: '사용자의 현재 위치입니다.',
            },
          ]);

          console.log(`현재 위치: lat(${userLocation.lat}), lng(${userLocation.lng})`);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      console.error('Geolocation이 브라우저에서 지원되지 않습니다.');
      setLoading(false);
    }
  }, []);

  // 지도 클릭 핸들러
  const handleMapClick = (location) => {
    // 클릭한 위치에 마커 추가
    setMarkers((prev) => [
      ...prev,
      {
        position: location,
        label: String.fromCharCode(65 + prev.length), // A, B, C 등 라벨 자동 증가
        title: '클릭한 위치',
        description: '사용자가 클릭한 위치입니다.',
      },
    ]);

    // 경로 계산
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation, // 출발지: 현재 위치
        destination: location, // 클릭한 위치를 목적지로 설정
        travelMode: window.google.maps.TravelMode.WALKING, // 보행자 모드
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result); // 경로 설정
          console.log('경로 계산 성공:', result);
        } else {
          console.error('경로 계산 실패:', status);
        }
      }
    );
  };

  return (
    <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} render={render}>
      <div className="relative h-screen">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p>현재 위치를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 지도 표시 */}
            <Map
              center={currentLocation}
              zoom={15}
              markers={markers}
              directions={directions}
              onMapClick={handleMapClick} // 클릭 이벤트 핸들러 전달
            />
          </>
        )}
      </div>
    </Wrapper>
  );
}

export default Main;