import React, { useEffect, useState, useRef } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Modal from "react-modal";
import { FaSearch } from "react-icons/fa";
import { sendStartPoint } from "../api/mapApi"; // API 임포트
import { sendWalking } from "../api/movingApi";     // 도보 중 위치 전송 (PATCH)

// Tailwind import
import "../index.css";

// 지도 스타일 설정
const containerStyle = {
  width: "100%",
  height: "60vh",
};

// 초기 중심 위치
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
    const map = new window.google.maps.Map(ref.current, { center, zoom });

    // 지도 클릭 이벤트
    map.addListener("click", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onMapClick({ lat, lng });
    });

    // 마커 생성
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
  }, [center, zoom, markers, onMapClick, directions]);

  return <div ref={ref} style={containerStyle} />;
};

// 앱 요소 설정
Modal.setAppElement("#root");

// 메인 컴포넌트
function Main() {
  // --- [1] 상태 변수들 ---
  const [isModalOpen, setIsModalOpen] = useState(false); // 목적지 검색 모달
  const [resultModalOpen, setResultModalOpen] = useState(false); // 결과 표시 모달

  const [currentLocation, setCurrentLocation] = useState(initialPosition);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [directions, setDirections] = useState(null);

  // 자동완성용 ref
  const autocompleteInputRef = useRef(null);
  const autocompleteObjRef = useRef(null);

  // 검색, 결과값
  const [searchValue, setSearchValue] = useState("");
  const [credits, setCredits] = useState(0);
  const [distance, setDistance] = useState(0);

  // 마지막 목적지를 기록해, "이동하기" 시 재계산에 사용
  const [lastDestination, setLastDestination] = useState(null);

  // 이동 모드: 기본 WALKING, “이동하기” 클릭 → DRIVING
  const [travelMode, setTravelMode] = useState(
    window.google.maps.TravelMode.WALKING
  );

  // 10초 간격으로 위치 전송할 Interval ID
  const intervalRef = useRef(null);

  // --- [2] 현재 위치 가져오기 ---
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
              // label이 'A'인 마커 = 현재 위치 (지우지 않도록 구분자)
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

  // --- [3] 지도 클릭 시 마커 & 경로 ---
  const handleMapClick = async (location) => {
    // 마커 추가 (label != 'A')
    setMarkers((prev) => [
      ...prev,
      {
        position: location,
        label: String.fromCharCode(65 + prev.length), // B, C, D...
        title: "클릭한 위치",
        description: "사용자가 클릭한 위치입니다.",
      },
    ]);

    // 목적지 기록
    setLastDestination(location);

    // 경로 계산
    calculateRoute(location);

    // API 전송
    const startPoint = {
      startY: currentLocation.lng,
      startX: currentLocation.lat,
      endY: location.lng,
      endX: location.lat,
      currentY: currentLocation.lng,
      currentX: currentLocation.lat,
    };

    try {
      const response = await sendStartPoint(startPoint);
      console.log("시작점 정보 전송 성공:", response.credit, response.distance);

      setCredits(response.credit);
      setDistance(response.distance);

      // 결과 모달
      setResultModalOpen(true);
    } catch (error) {
      console.error("시작점 정보 전송 실패:", error);
    }
  };

  // --- [4] 경로 계산 함수 (이동 모드 travelMode 사용) ---
  const calculateRoute = (destination) => {
    if (!destination) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination,
        travelMode: travelMode, // 상태에 저장된 이동 모드 사용
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

  // --- [5] Autocomplete 초기화 & 이벤트 ---
  useEffect(() => {
    if (isModalOpen && autocompleteInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {}
      );
      autocompleteObjRef.current = autocomplete;

      // 자동완성 리스트 항목 클릭 시
      autocomplete.addListener("place_changed", handlePlaceChanged);
    }

    // 모달 닫힐 때 리스너 해제
    return () => {
      if (autocompleteObjRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteObjRef.current
        );
      }
    };
  }, [isModalOpen]);

  // 자동완성 place_changed
  const handlePlaceChanged = async () => {
    const place = autocompleteObjRef.current?.getPlace();
    if (!place || !place.geometry) {
      alert("장소를 찾을 수 없습니다. (자동완성 선택)");
      return;
    }
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // 마커 추가
    const newLocation = { lat, lng };
    setMarkers((prev) => [
      ...prev,
      {
        position: newLocation,
        label: String.fromCharCode(65 + prev.length),
        title: "검색된 위치",
        description: place.formatted_address || searchValue,
      },
    ]);

    // 목적지 기록
    setLastDestination(newLocation);

    // 경로 계산
    calculateRoute(newLocation);

    // API 전송
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
      console.log("시작점 정보 전송 성공(자동완성):", response.credit, response.distance);

      setCredits(response.credit);
      setDistance(response.distance);

      // 결과 모달
      setResultModalOpen(true);
    } catch (error) {
      console.error("검색 위치 전송 실패:", error);
    }

    // 모달 닫기
    closeModal();
  };

  // --- [6] 수동 검색 (ENTER or 검색 버튼) ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      alert("검색어를 입력하세요.");
      return;
    }

    // 1) Autocomplete에서 place가 확정된 상태인지
    const place = autocompleteObjRef.current?.getPlace();
    if (place && place.geometry) {
      handlePlaceByGeometry(place);
    } else {
      // 2) Geocoding API 수동 검색
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchValue }, async (results, status) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          const newLocation = { lat, lng };

          // 마커 추가
          setMarkers((prev) => [
            ...prev,
            {
              position: newLocation,
              label: String.fromCharCode(65 + prev.length),
              title: "검색된 위치",
              description: results[0].formatted_address || searchValue,
            },
          ]);

          // 목적지 기록
          setLastDestination(newLocation);

          // 경로 계산
          calculateRoute(newLocation);

          // API 전송
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
            console.log("시작점 정보 전송 성공(수동검색):", response.credit, response.distance);

            setCredits(response.credit);
            setDistance(response.distance);
            setResultModalOpen(true);
          } catch (err) {
            console.error("검색 위치 전송 실패:", err);
          }
          closeModal();
        } else {
          alert("장소를 찾을 수 없습니다. (수동검색)");
        }
      });
    }
  };

  // 중복 로직 분리
  const handlePlaceByGeometry = async (place) => {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const newLocation = { lat, lng };

    // 마커 추가
    setMarkers((prev) => [
      ...prev,
      {
        position: newLocation,
        label: String.fromCharCode(65 + prev.length),
        title: "검색된 위치",
        description: place.formatted_address || searchValue,
      },
    ]);

    // 목적지 기록
    setLastDestination(newLocation);

    // 경로 계산
    calculateRoute(newLocation);

    // API 전송
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
        "시작점 정보 전송 성공(Autocomplete + Enter):",
        response.credit,
        response.distance
      );

      setCredits(response.credit);
      setDistance(response.distance);
      setResultModalOpen(true);
    } catch (error) {
      console.error("검색 위치 전송 실패:", error);
    }

    closeModal();
  };

  // --- [7] 모달 열기/닫기 ---
  // (1) 검색 모달 열기
  const openModal = () => {
    setIsModalOpen(true);
    setSearchValue("");
  };

  // (2) 검색 모달 닫기 -> "현재 위치(A) 마커 제외" 나머지 마커 제거
  const closeModal = () => {
    // 현재 위치(A) 마커만 남기고 나머지 마커 제거
    setMarkers((prev) => prev.filter((m) => m.label === "A"));
    setIsModalOpen(false);
  };

  // (3) 결과 모달 닫기 -> "현재 위치(A) 마커 제외" 나머지 마커 제거
  const closeResultModal = () => {
    // 현재 위치(A) 마커만 남기고 나머지 마커 제거
    setMarkers((prev) => prev.filter((m) => m.label === "A"));
    setResultModalOpen(false);
  };

  // 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // (9) 결과 모달: "이동하기" 버튼 -> DRIVING 모드 + 10초마다 위치 PATCH
  const handleStartMoving = () => {
    // 이동 모드를 DRIVING으로 설정
    setTravelMode(window.google.maps.TravelMode.DRIVING);

    // lastDestination이 있다면, DRIVING 모드로 경로 다시 계산
    if (lastDestination) {
      calculateRoute(lastDestination);
    }

    // 10초마다 현재 위치 전송 (sendWalking)
    // 기존 interval이 있다면 중복 방지를 위해 clear
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 새로운 interval 생성
    intervalRef.current = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // PATCH 요청
            const curX = pos.coords.latitude;
            const curY = pos.coords.longitude;

            sendWalking(curX, curY)
              .then((res) => {
                console.log("도보 중 위치 전송 성공:", res);
              })
              .catch((err) => {
                console.error("도보 중 위치 전송 실패:", err);
              });
          },
          (err) => {
            console.error("Geolocation 에러:", err);
          }
        );
      }
    }, 10000);

    // 모달 닫기
    closeResultModal();
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
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 
                     bg-blue-500 text-white px-6 py-3 rounded-full 
                     shadow-lg flex items-center gap-2"
        >
          <FaSearch />
          목적지 검색
        </button>

        {/* 검색 모달 (Autocomplete + 수동 검색) */}
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
            ref={autocompleteInputRef}
            type="text"
            placeholder="검색할 장소를 입력하세요"
            className="w-full p-2 border rounded mb-4"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown} // ENTER 키 핸들링
          />

          <div className="flex justify-end gap-2">
            {/* 
              [취소] 누르면 현재 위치 마커만 남기고 검색/클릭 마커 제거
            */}
            <button
              onClick={closeModal}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              취소
            </button>
            {/* 
              [검색] 버튼
            */}
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              검색
            </button>
          </div>
        </Modal>

        {/* 결과 모달 */}
        <Modal
          isOpen={resultModalOpen}
          onRequestClose={closeResultModal}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
            content: {
              width: "320px",
              height: "200px",
              margin: "auto",
              padding: "20px",
              borderRadius: "12px",
              boxShadow:
                "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              🚶 경로 정보
            </h2>

            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">예상 크레딧:</span>{" "}
                {credits}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">
                  목적지까지의 거리:
                </span>{" "}
                {distance.toFixed(2)} m
              </p>
            </div>

            <div className="flex justify-between gap-2 mt-4">
              {/* 
                [이동하기] 버튼 -> DRIVING 모드로 전환 후 경로 재계산
                + 10초마다 현재 위치 patch
              */}
              <button
                onClick={handleStartMoving}
                className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                이동하기
              </button>

              {/* 닫기 버튼 */}
              <button
                onClick={closeResultModal}
                className="w-1/2 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Wrapper>
  );
}

export default Main;