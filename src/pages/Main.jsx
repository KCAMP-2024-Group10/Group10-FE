import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import Modal from 'react-modal';
import { FaSearch } from 'react-icons/fa';

// 지도 스타일 설정
const containerStyle = {
  width: '100%',
  height: '60vh',
};

// 초기 중심 위치
const initialPosition = {
  lat: 18.810664742665605,
  lng: 98.97923073813442,
};

// 모달 스타일 설정
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
};

// 지도 렌더링 상태 표시
const render = (status) => {
  if (status === Status.LOADING) return <p>지도를 불러오는 중...</p>;
  if (status === Status.FAILURE) return <p>지도를 불러오지 못했습니다.</p>;
  return null;
};

// **지도 컴포넌트**
const Map = ({ center, zoom, markers }) => {
  const ref = useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(ref.current, {
      center,
      zoom,
    });

    // 마커 추가
    markers.forEach((marker) => {
      const markerObj = new window.google.maps.Marker({
        position: marker.position,
        map,
        label: marker.label,
      });

      // 마커 클릭 시 정보 창 표시
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<h4>${marker.title}</h4><p>${marker.description}</p>`,
      });

      markerObj.addListener('click', () => {
        infoWindow.open(map, markerObj);
      });
    });
  }, [center, zoom, markers]);

  return <div ref={ref} style={containerStyle} />;
};

// **메인 컴포넌트**
function Main() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState(initialPosition); // 현재 위치
  const [selectedLocation, setSelectedLocation] = useState(null); // 선택된 위치
  const [loading, setLoading] = useState(true); // 로딩 상태

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  }, []);

  // 모달 열기
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // 검색 이벤트 처리
  const handleSearch = () => {
    // 예시로 검색 주소를 강제 설정 (실제 구현 시 Google Places API 적용 가능)
    const searchLocation = {
      lat: 18.7895,
      lng: 98.9856,
    };
    setSelectedLocation(searchLocation);
    setDestination('Chiang Mai Night Bazaar'); // 목적지 이름 예시
    closeModal();
  };

  // 마커 데이터 설정
  const markers = [
    {
      position: currentLocation,
      label: 'A',
      title: '현재 위치',
      description: '사용자의 현재 위치입니다.',
    },
    ...(selectedLocation
      ? [
          {
            position: selectedLocation,
            label: 'B',
            title: destination,
            description: '선택한 목적지입니다.',
          },
        ]
      : []),
  ];

  return (
    <Wrapper
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} // 환경 변수에 API 키 설정
      render={render}
    >
      <div className="relative h-screen">
        {/* 로딩 상태 */}
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p>현재 위치를 불러오는 중...</p>
          </div>
        ) : (
          <Map center={selectedLocation || currentLocation} zoom={15} markers={markers} />
        )}

        {/* 목적지 입력 버튼 */}
        <button
          onClick={openModal}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <FaSearch />
          목적지 입력
        </button>

        {/* 모달 */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="목적지 입력"
        >
          <h2 className="text-lg font-semibold mb-4">목적지 입력</h2>
          <input
            type="text"
            placeholder="목적지를 입력하세요"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
          />
          <div className="flex justify-end gap-4">
            <button onClick={closeModal} className="bg-gray-300 px-4 py-2 rounded-lg">
              취소
            </button>
            <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
              검색
            </button>
          </div>
        </Modal>
      </div>
    </Wrapper>
  );
}

export default Main;