import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import Modal from 'react-modal';
import { FaSearch } from 'react-icons/fa';

// 지도 스타일
const containerStyle = {
  width: '100%',
  height: '60vh',
};

// 초기 중심 위치
const defaultCenter = {
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

Modal.setAppElement('#root'); // 접근성 설정

function Main() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const autocompleteRef = useRef(null);

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
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
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedLocation({ lat, lng });
        setDestination(place.formatted_address);
        closeModal();
      } else {
        alert('장소를 찾을 수 없습니다.');
      }
    }
  };

  return (
    <div className="relative h-screen">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <p>현재 위치를 불러오는 중...</p>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={selectedLocation || currentLocation}
          zoom={15}
        >
          <Marker position={currentLocation} />
          {selectedLocation && <Marker position={selectedLocation} />}
        </GoogleMap>
      )}

      <button
        onClick={openModal}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
      >
        <FaSearch />
        목적지 입력
      </button>

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
  );
}

export default Main;