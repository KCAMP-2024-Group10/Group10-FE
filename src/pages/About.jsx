import React, { useState, useEffect } from "react";
import { getReport } from "../api/reportApi"; // API 호출 함수 임포트

function About() {
  // --- [1] 상태 변수 정의 ---
  const [weeklyDistance, setWeeklyDistance] = useState(12); // 기본값 12km
  const [kcalBurned, setKcalBurned] = useState(0); // 칼로리 소모량
  const [fatBurned, setFatBurned] = useState(0);   // 지방 연소량
  const [co2Reduced, setCo2Reduced] = useState(0); // CO2 감소량

  // --- [2] 숫자 포매팅 함수 ---
  const formatNumber = (num, decimals = 1) => num.toFixed(decimals);

  // --- [3] 거리 입력값 핸들러 ---
  const handleDistanceChange = (e) => {
    const newValue = parseFloat(e.target.value) || 0;
    setWeeklyDistance(newValue);

    // 입력값 변경 시 계산 로직 적용
    setKcalBurned(newValue * 50); // 1km당 50kcal
    setFatBurned(newValue * 5);  // 1km당 5g
    setCo2Reduced(newValue * 0.17); // 1km당 0.17kg
  };

  // --- [4] API 호출 및 데이터 설정 ---
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getReport(); // API 호출
        setKcalBurned(data.kcal); // 서버에서 받은 데이터 적용
        setFatBurned(data.fat);
        setCo2Reduced(data.co2);
      } catch (error) {
        console.error("헬스 리포트 데이터를 불러오는데 실패했습니다.", error);
      }
    };

    fetchReport(); // 컴포넌트 마운트 시 API 호출
  }, []); // 의존성 배열 비워두어 최초 실행 시 1회만 호출

  // --- [5] UI 렌더링 ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-8">
      {/* 제목 섹션 */}
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Health Report</h1>
      <p className="mb-4 text-lg text-gray-600">
        Total distance in last week (km)
      </p>

      {/* 도보 거리 입력 */}
      <div className="mb-6">
        <input
          type="number"
          value={weeklyDistance}
          onChange={handleDistanceChange}
          className="p-3 border border-gray-300 rounded-lg shadow-sm w-40 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          min="0"
          step="0.1"
        />
      </div>

      {/* 결과 카드 섹션 */}
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
          Weekly Walking
        </h2>
        <div className="space-y-6">
          {/* 칼로리 소모량 */}
          <div className="flex flex-col items-center">
            <span className="text-gray-600">Calories Burned</span>
            <span className="text-2xl font-bold text-blue-500">
              {formatNumber(kcalBurned, 0)} kcal
            </span>
          </div>

          {/* 지방 연소량 */}
          <div className="flex flex-col items-center">
            <span className="text-gray-600">Fat Burned</span>
            <span className="text-2xl font-bold text-red-500">
              {formatNumber(fatBurned, 1)} g
            </span>
          </div>

          {/* CO2 감소량 */}
          <div className="flex flex-col items-center">
            <span className="text-gray-600">CO2 Reduced</span>
            <span className="text-2xl font-bold text-green-500">
              {formatNumber(co2Reduced, 2)} kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;