import axiosInstance from './axiosInstance';

// 도보 중, 현재 사용자 위치 전송 (PATCH 요청)
export const sendWalking = async (currentX, currentY) => {
  try {
    // 요청 데이터 생성
    const requestData = {
      currentX: currentY,
      currentY: currentX,
    };

    // PATCH 요청 전송
    const response = await axiosInstance.patch('/walking', requestData);

    if (response.data && response.data.length > 0) {
        const name = response.data[0].name; // 첫 번째 사용자 이름
        console.log(name);
        //alert(`${name} 쿠폰 발급!`); // 알림 표시
      } 
    return response.data; // 응답 데이터 반환
  } catch (error) {
    console.error('크레딧 및 랭킹 전송 실패:', error);
    throw error;
  }
};