import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // 2초 후 메인 페이지로 이동
    const timer = setTimeout(() => {
      navigate('/main');
    }, 2000);

    return () => clearTimeout(timer); // 타이머 정리
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      {/* 로고 이미지 */}
      <img
        src="/logo.png"
        alt="Loading"
        className="w-200 h-200 animate-wiggle" // 애니메이션 클래스 적용
      />
      {/* 텍스트 */}
      <h1 className="text-1xl font-bold text-gray-800 mt-4">
        Made By Step by Step
      </h1>
    </div>
  );
}

export default Splash;