import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // 컴포넌트가 마운트된 뒤 2초 후에 /main으로 이동
    const timer = setTimeout(() => {
      navigate('/main');
    }, 2000);

    // 컴포넌트가 언마운트될 때 타이머 정리
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <h1 className="text-4xl font-bold text-gray-800">Triple C</h1>
    </div>
  );
}

export default Splash;