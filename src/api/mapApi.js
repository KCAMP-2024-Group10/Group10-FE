import axiosInstance from './axiosInstance';

// 도보 시작(시작점 위치 정보 전송)
export const sendStartPoint = async (startpoint) => {
  try {
    const response = await axiosInstance.post('/start', startpoint); // POST 요청
    return response.data; // 응답 데이터 반환
  } catch (error) {
    console.error('목적지 전송 실패:', error);
    throw error;
  }
};
/* startpoint 형태
{
    "startX": 0,
    "startY": 0,
    "endX": 0,
    "endY": 0,
    "currentX": 0,
    "currentY": 0
}
*/

// 목적지 정보 조회
// export const sendDestination = async () => {
//   try {
//     const response = await axiosInstance.get('/destinations'); // GET 요청
//     return response.data;
//   } catch (error) {
//     console.error('목적지 조회 실패:', error);
//     throw error;
//   }
// };

// 사용자 보유 크레딧 및 랭킹 불러옴
export const getInfo = async () => {
    try {
      const response = await axiosInstance.get('/rank'); // GET 요청
      return response.data;
    } catch (error) {
      console.error('보유 크래딧 및 랭킹 조회 실패:', error);
      throw error;
    }
  };