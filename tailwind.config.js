/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "custom-blue": "#1da1f2",
      },
      fontFamily: {
        myFont: ["Roboto", "sans-serif"],
      },
      spacing: {
        88: "22rem",
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite', // 애니메이션 추가
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' }, // 시작과 끝에서 -5도 회전
          '50%': { transform: 'rotate(5deg)' },      // 중간에서 5도 회전
        },
      },
    },
  },
  plugins: [],
};