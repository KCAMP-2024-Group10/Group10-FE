/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 예: 기존 Tailwind 팔레트에 custom-blue 라는 이름을 추가
        "custom-blue": "#1da1f2",
      },
      fontFamily: {
        // 예: "myFont"라는 이름의 커스텀 폰트 패밀리 추가
        myFont: ["Roboto", "sans-serif"],
      },
      spacing: {
        // 예: spacing 유닛 추가 (ex: w-[88px] 처럼 쓰기)
        88: "22rem",
      },
    },
  }
  ,
  plugins: [],
}