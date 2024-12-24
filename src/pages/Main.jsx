import React, { useEffect, useState, useRef } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import Modal from "react-modal";
import { FaSearch } from "react-icons/fa";
import { sendStartPoint } from "../api/mapApi"; // 시작점 전송 (POST)
import { sendWalking } from "../api/movingApi"; // 도보 중 위치 전송 (PATCH)
import { sendEndPoint } from "../api/endApi"; // 도착지 전송 (POST)

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

// Wrapper render 함수
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

    // 마커 표시
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

// 모달 설정
Modal.setAppElement("#root");

// 메인 컴포넌트
function Main() {
  // --- [1] 상태 변수들 ---
  const [isModalOpen, setIsModalOpen] = useState(false); // 목적지 검색 모달
  const [resultModalOpen, setResultModalOpen] = useState(false); // 결과 모달

  const [currentLocation, setCurrentLocation] = useState(initialPosition);
  const [loading, setLoading] = useState(true);

  const [markers, setMarkers] = useState([]);
  const [directions, setDirections] = useState(null);

  // 자동완성
  const autocompleteInputRef = useRef(null);
  const autocompleteObjRef = useRef(null);

  // 검색 결과
  const [searchValue, setSearchValue] = useState("");
  const [credits, setCredits] = useState(0);
  const [distance, setDistance] = useState(0);

  // 마지막 목적지 (DRIVING 모드일 때, 끝나는 위치 등)
  const [lastDestination, setLastDestination] = useState(null);

  // 이동 모드: WALKING → DRIVING
  const [travelMode, setTravelMode] = useState(
    window.google.maps.TravelMode.WALKING
  );

  // 위치 전송 Interval
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
              position: userLocation,
              label: "A", // 현재 위치
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

  // --- [3] 지도 클릭 시 ---
  const handleMapClick = async (location) => {
    setMarkers((prev) => [
      ...prev,
      {
        position: location,
        label: String.fromCharCode(65 + prev.length), // B, C, D...
        title: "클릭한 위치",
        description: "사용자가 클릭한 위치입니다.",
      },
    ]);

    // 목적지
    setLastDestination(location);

    // 경로 계산
    calculateRoute(location);

    // API (시작점 전송)
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
      console.log("시작점 전송 성공:", response.credit, response.distance);

      setCredits(response.credit);
      setDistance(response.distance);

      // 결과 모달
      setResultModalOpen(true);
    } catch (error) {
      console.error("시작점 전송 실패:", error);
    }
  };

  // --- [4] 경로 계산 ---
  const calculateRoute = (destination) => {
    if (!destination) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination,
        travelMode,
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

  // --- [5] Autocomplete 초기화 ---
  useEffect(() => {
    if (isModalOpen && autocompleteInputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {}
      );
      autocompleteObjRef.current = ac;
      ac.addListener("place_changed", handlePlaceChanged);
    }

    return () => {
      if (autocompleteObjRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteObjRef.current
        );
      }
    };
  }, [isModalOpen]);

  const handlePlaceChanged = async () => {
    const place = autocompleteObjRef.current?.getPlace();
    if (!place || !place.geometry) {
      alert("장소를 찾을 수 없습니다.");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const newLocation = { lat, lng };

    // 마커
    setMarkers((prev) => [
      ...prev,
      {
        position: newLocation,
        label: String.fromCharCode(65 + prev.length),
        title: "검색된 위치",
        description: place.formatted_address || searchValue,
      },
    ]);

    setLastDestination(newLocation);
    calculateRoute(newLocation);

    // API
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
        "시작점 전송 성공(Autocomplete):",
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

  // --- [6] 수동 검색 ---
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

    const place = autocompleteObjRef.current?.getPlace();
    if (place && place.geometry) {
      // 이미 Autocomplete로 확정된 장소
      handlePlaceByGeometry(place);
    } else {
      // Geocoding
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchValue }, async (results, status) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          const newLocation = {
            lat: loc.lat(),
            lng: loc.lng(),
          };

          setMarkers((prev) => [
            ...prev,
            {
              position: newLocation,
              label: String.fromCharCode(65 + prev.length),
              title: "검색된 위치",
              description: results[0].formatted_address || searchValue,
            },
          ]);

          setLastDestination(newLocation);
          calculateRoute(newLocation);

          // API
          const startPoint = {
            startY: currentLocation.lng,
            startX: currentLocation.lat,
            endY: loc.lng(),
            endX: loc.lat(),
            currentY: currentLocation.lng,
            currentX: currentLocation.lat,
          };

          try {
            const response = await sendStartPoint(startPoint);
            console.log(
              "시작점 전송 성공(수동검색):",
              response.credit,
              response.distance
            );

            setCredits(response.credit);
            setDistance(response.distance);
            setResultModalOpen(true);
          } catch (err) {
            console.error("검색 위치 전송 실패:", err);
          }
          closeModal();
        } else {
          alert("장소를 찾을 수 없습니다.");
        }
      });
    }
  };

  const handlePlaceByGeometry = async (place) => {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
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

    setLastDestination(newLocation);
    calculateRoute(newLocation);

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
      console.log("시작점 정보 전송 성공:", response.credit, response.distance);

      setCredits(response.credit);
      setDistance(response.distance);
      setResultModalOpen(true);
    } catch (error) {
      console.error("검색 위치 전송 실패:", error);
    }

    closeModal();
  };

  // --- [7] 모달 열기/닫기 ---
  const openModal = () => {
    setIsModalOpen(true);
    setSearchValue("");
  };

  const closeModal = () => {
    // 취소 시: 현재 위치(A)만 남기고 제거
    setMarkers((prev) => prev.filter((m) => m.label === "A"));
    setIsModalOpen(false);
  };

  const closeResultModal = () => {
    // 결과 모달 닫기 시: 현재 위치(A)만 남기고 제거
    setMarkers((prev) => prev.filter((m) => m.label === "A"));
    setResultModalOpen(false);
  };

  // --- [8] Interval 정리 ---
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // --- [9] 이동하기: DRIVING + 10초마다 위치 전송 ---
  const handleStartMoving = () => {
    setTravelMode(window.google.maps.TravelMode.DRIVING);

    if (lastDestination) {
      calculateRoute(lastDestination);
    }

    // 기존 interval 정리
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 새 interval
    intervalRef.current = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
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

    closeResultModal();
  };

  // --- [10] 이동 완료 (도착지 POST) ---
  const handleEndMoving = async () => {
    // interval 정리
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!lastDestination) {
      alert("도착지가 지정되지 않았습니다.");
      return;
    }

    // 도착지 정보
    const endData = {
      endX: lastDestination.lat,
      endY: lastDestination.lng,
    };

    try {
      // 도착지 전송
      const res = await sendEndPoint(endData);
      console.log("도착지 전송 성공:", res);

      // 응답이 true/false라 가정
      if (res === true) {
        alert("Congratulations! A reward has been added!");
      } else {
        alert(
          "Rewards cannot be granted as you are using a motorcycle or car!"
        );
      }

      // 이동 모드 원복
      setTravelMode(window.google.maps.TravelMode.WALKING);

      // 마커 정리 (현재 위치만 남김)
      setMarkers((prev) => prev.filter((m) => m.label === "A"));

      // 목적지 상태 초기화
      setLastDestination(null);

      // 추가적인 후속 처리(ex: 페이지 이동, 상태 갱신 등) 필요시 여기에 작성
    } catch (err) {
      console.error("도착지 전송 실패:", err);
    }
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
            <div className="flex flex-col items-center">
              {/* 로딩 애니메이션 */}
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
              {/* 로딩 텍스트 */}
              <p className="mt-4 text-gray-600 font-medium">
                Loading current location...
              </p>
            </div>
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

        {/* 검색 버튼 */}
        <button
          onClick={openModal}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 
                     bg-blue-500 text-white px-6 py-3 rounded-full 
                     shadow-lg flex items-center gap-2"
        >
          <FaSearch />
          Search
        </button>

        {travelMode === window.google.maps.TravelMode.DRIVING && (
          <button
            onClick={handleEndMoving}
            className="absolute bottom-36 left-1/2 transform -translate-x-1/2
                       bg-red-500 text-white px-6 py-3 rounded-full shadow-lg
                       flex items-center gap-2"
          >
            Complete
          </button>
        )}

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
          <h2 className="text-xl font-semibold mb-4">Search</h2>
          <input
            ref={autocompleteInputRef}
            type="text"
            placeholder="Enter a location to search"
            className="w-full p-2 border rounded mb-4"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Cancel
            </button>
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
              🚶 Path Info
            </h2>

            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">
                  Estimated Credit:
                </span>{" "}
                {credits}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">
                  Distance to Destination:
                </span>{" "}
                {distance.toFixed(2)} m
              </p>
            </div>

            <div className="flex justify-between gap-2 mt-4">
              {/* 이동하기 → DRIVING 모드 & 10초마다 위치 전송 */}
              <button
                onClick={handleStartMoving}
                className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                move
              </button>

              <button
                onClick={closeResultModal}
                className="w-1/2 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg transition-all"
              >
                close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Wrapper>
  );
}

export default Main;
