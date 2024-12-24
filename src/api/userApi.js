import axiosInstance from './axiosInstance';

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