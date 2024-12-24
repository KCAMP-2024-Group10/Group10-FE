import axios from 'axios';

// 기본 axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: 'http://34.60.26.80:8080/', // API 서버 주소
  timeout: 5000, // 요청 타임아웃 시간 (5초)
  headers: {
    'Content-Type': 'application/json', // JSON 형식
  },
});

// 요청 인터셉터 설정
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('요청 전송:', config);
    return config;
  },
  (error) => {
    console.error('요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('응답 수신:', response);
    return response;
  },
  (error) => {
    console.error('응답 오류:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;