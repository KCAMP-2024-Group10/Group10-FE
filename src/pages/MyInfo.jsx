import React, { useEffect, useState } from "react";
import { getInfo } from "../api/userApi"; // API 호출 함수 임포트

function MyInfo() {
  // --- [1] 상태 정의 ---
  const [userProfile, setUserProfile] = useState({
    nickname: "John", // 하드코딩된 사용자 이름
    phone: "010-1234-5678", // 기본 전화번호
    credit: 0, // 크레딧 초기값
    rank: 0, // 랭킹 초기값
  });

  const [userRankings, setUserRankings] = useState([]); // 전체 유저 랭킹 상태 관리

  const adminInfo = {
    name: "StepByStep",
    MyInfo: "StepByStep@gmail.com",
  };

  // --- [2] API 호출 및 데이터 설정 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInfo(); // API 호출

        // 현재 사용자 정보 설정
        const currentUser = data.userDtos.find(
          (user) => user.name === "John" // 하드코딩된 사용자 검색
        );

        if (currentUser) {
          setUserProfile({
            nickname: currentUser.name,
            phone: "010-1234-5678", // 하드코딩된 전화번호
            credit: currentUser.credit,
            rank: currentUser.rank,
          });
        } else {
          console.error("사용자 정보가 없습니다.");
        }

        // 전체 유저 랭킹 설정
        setUserRankings(data.userDtos);
      } catch (error) {
        console.error("사용자 정보 불러오기 실패:", error);
      }
    };

    fetchData();
  }, []); // 최초 마운트 시 1회 실행

  // --- [3] 렌더링 ---
  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-100 p-8">
      <h1 className="text-4xl font-bold mb-6">My Page</h1>

      {/* 프로필 섹션 */}
      <section className="w-full max-w-md bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Profile</h2>
        <p className="mb-2">Name: {userProfile.nickname}</p>
        <p className="mb-2">
          Credit: <span className="font-bold">{userProfile.credit}</span>
        </p>
        <p className="mb-2">
          Rank: <span className="font-bold">{userProfile.rank}</span>
        </p>
      </section>

      {/* 랭킹 섹션 (스크롤 박스 추가) */}
      <section className="w-full max-w-md bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Rankings</h2>
        <div
          className="overflow-y-auto h-64 border rounded-lg p-4"
          style={{ maxHeight: "300px" }}
        >
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Rank</th>
                <th>Name</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {userRankings.map((user) => (
                <tr
                  key={user.userId}
                  className={`border-b ${
                    user.name === userProfile.nickname
                      ? "bg-blue-100 font-bold" // 현재 사용자 강조 표시
                      : ""
                  }`}
                >
                  <td className="py-2">{user.rank}</td>
                  <td>{user.name}</td>
                  <td>{user.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default MyInfo;