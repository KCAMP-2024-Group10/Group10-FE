import axiosInstance from './axiosInstance';

// 사용자 보유 크레딧 및 랭킹 불러옴
export const getReport = async () => {
    try {
      const response = await axiosInstance.get('/report'); // GET 요청
      return response.data;
    } catch (error) {
      console.error('헬스리포트 조회 실패:', error);
      throw error;
    }
  };