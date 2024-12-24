import React, { useEffect, useState, useRef } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Modal from "react-modal";
import { FaSearch } from "react-icons/fa";
import { sendStartPoint } from "../api/mapApi"; // API 임포트

// Tailwind import (여기서 Tailwind를 전역적으로 불러온다고 가정)
import "../index.css";

// 지도 스타일 설정
const containerStyle = {
  width: "100%",
  height: "60vh",
};

// 초기 중심 위치 (치앙마이 예시)
const initialPosition = {
  lat: 18.810664742665605,
  lng: 98.97923073813442,
};

// Wrapper의 render 함수
const render = (status) => {
  if (status === Status.LOADING) return <p>지도를 불러오는 중...</p>;
  if (status === Status.FAILURE) return <p>지도를 불러오지 못했습니다.</p>;
  return null;
};

// 지도 컴포넌트
const Map = ({ center, zoom, markers, onMapClick, directions }) => {
  const ref = useRef(null);

  useEffect(() => {
    const map = new window.google.maps.Map(ref.current, {
      center,
      zoom,
    });

    // 지도 클릭 이벤트 추가
    map.addListener("click", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onMapClick({ lat, lng });
    });

    // 마커 추가
    markers.forEach((marker) => {
      const markerObj = new window.google.maps.Marker({
        position: marker.position,
        map,
        label: marker.label,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<h4>${marker.title}</h4><p>${marker.description}</p>`,
      });

      markerObj.addListener("click", () => {
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

// 앱 요소 설정
Modal.setAppElement("#root");

// 메인 컴포넌트
function Main() {
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 목적지 검색 모달
  const [resultModalOpen, setResultModalOpen] = useState(false); // 결과 표시 모달

  // 지도, 마커, 경로
  const [currentLocation, setCurrentLocation] = useState(initialPosition);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [directions, setDirections] = useState(null);

  // 검색 입력값
  const [searchValue, setSearchValue] = useState("");

  // 결과값(크레딧, 거리)
  const [credits, setCredits] = useState(0);
  const [distance, setDistance] = useState(0);

  // 지도 로드 & 현재 위치 설정
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCurrentLocation(userLocation);
          setMarkers([
            {
              position: userLocation,
              label: "A",
              title: "현재 위치",
              description: "사용자의 현재 위치입니다.",
            },
          ]);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
        }
      );
    } else {
      console.error("Geolocation이 브라우저에서 지원되지 않습니다.");
      setLoading(false);
    }
  }, []);

  // 지도 클릭 시 마커 & 경로 계산 & API 전송
  const handleMapClick = async (location) => {
    setMarkers((prev) => [
      ...prev,
      {
        position: location,
        label: String.fromCharCode(65 + prev.length),
        title: "클릭한 위치",
        description: "사용자가 클릭한 위치입니다.",
      },
    ]);

    console.log(`클릭 위치 lat: ${location.lat}, lng: ${location.lng}`);
    calculateRoute(location);

    // API 요청 데이터 구성
    const startPoint = {
      startY: currentLocation.lng, // 현재 위치 X
      startX: currentLocation.lat, // 현재 위치 Y
      endY: location.lng, // 클릭한 위치 X
      endX: location.lat, // 클릭한 위치 Y
      currentY: currentLocation.lng,
      currentX: currentLocation.lat,
    };

    try {
      // API 요청
      const response = await sendStartPoint(startPoint);
      console.log("시작점 정보 전송 성공:", response.credit, response.distance);

      setCredits(response.credit);
      setDistance(response.distance);

      // 결과 모달 열기
      setResultModalOpen(true);
    } catch (error) {
      console.error("시작점 정보 전송 실패:", error);
    }
  };

  // 경로 계산 함수
  const calculateRoute = (destination) => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("경로 계산 실패:", status);
        }
      }
    );
  };

  /* =========================
      1) 모달 열기/닫기
  ========================== */
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeResultModal = () => setResultModalOpen(false);

  /* =========================
      2) 검색 실행 함수
  ========================== */
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    // 구글 지도 Geocoding 사용
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchValue }, async (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        // 지도에 마커 추가
        setMarkers((prev) => [
          ...prev,
          {
            position: { lat, lng },
            label: String.fromCharCode(65 + prev.length),
            title: "검색된 위치",
            description: searchValue,
          },
        ]);

        // 경로 계산
        calculateRoute({ lat, lng });

        // API 요청
        const startPoint = {
          startY: currentLocation.lng,
          startX: currentLocation.lat,
          endY: lng,
          endX: lat,
          currentY: currentLocation.lng,
          currentX: currentLocation.lat,
        };

        try {
          const response = await sendStartPoint(startPoint);
          console.log(
            "시작점 정보 전송 성공(검색):",
            response.credit,
            response.distance
          );

          setCredits(response.credit);
          setDistance(response.distance);

          // 결과 모달 띄우기
          setResultModalOpen(true);
        } catch (error) {
          console.error("검색 위치 전송 실패:", error);
        }

        // 모달 닫기
        closeModal();
      } else {
        alert("장소를 찾을 수 없습니다.");
      }
    });
  };

  return (
    <Wrapper
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
      render={render}
    >
      <div className="relative h-screen">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p>현재 위치를 불러오는 중...</p>
          </div>
        ) : (
          <Map
            center={currentLocation}
            zoom={15}
            markers={markers}
            directions={directions}
            onMapClick={handleMapClick}
          />
        )}

        {/* 검색 버튼 (모달 열기) */}
        <button
          onClick={openModal}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <FaSearch />
          목적지 검색
        </button>

        {/* 검색 모달 */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
            content: {
              width: "300px",
              height: "200px",
              margin: "auto",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <h2 className="text-xl font-semibold mb-4">목적지 검색</h2>
          <input
            type="text"
            placeholder="검색할 장소를 입력하세요"
            className="w-full p-2 border rounded mb-4"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              취소
            </button>
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              검색
            </button>
          </div>
        </Modal>

        {/* 결과 모달 (경로 정보) */}
        <Modal
          isOpen={resultModalOpen}
          onRequestClose={closeResultModal}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
            content: {
              width: "300px",
              height: "200px",
              margin: "auto",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <h2 className="text-lg font-semibold mb-4">경로 정보</h2>
          <p>크레딧: {credits}</p>
          <p>거리: {distance} m</p>
          <button
            onClick={closeResultModal}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
          >
            닫기
          </button>
        </Modal>
      </div>
    </Wrapper>
  );
}

export default Main;