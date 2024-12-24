import axiosInstance from "./axiosInstance";

export const sendEndPoint = async (endpoint) => {
  try {
    const response = await axiosInstance.post("/end", endpoint); // POST 요청
    return response.data; // 응답 데이터 반환
  } catch (error) {
    console.error("도착지 전송 실패:", error);
    throw error;
  }
};
