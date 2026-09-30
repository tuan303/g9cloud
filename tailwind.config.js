/** @type {import('tailwindcss').Config} */
// Bảng màu Cloud 9 — trích trực tiếp từ ảnh không gian quán (xem docs/BRAND.md)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tường vữa nâu đồng — màu chủ đạo, dùng cho nền tối, chữ, nút chính
        espresso: { DEFAULT: '#2A2218', 900: '#1C160E', 800: '#2A2218', 700: '#3A2E20', 600: '#4A3B29' },
        bronze: {
          50: '#F8F4EC', 100: '#EFE6D6', 200: '#DECCAF', 300: '#C7AB82', 400: '#A8885C',
          500: '#86694A', 600: '#6B5239', 700: '#56422B', 800: '#42331F', 900: '#2E2416',
        },
        // Nắng vàng hắt lên tường lúc chiều — màu nhấn (accent)
        gold: { DEFAULT: '#D9AE63', light: '#EBCF95', soft: '#F5E6C4', dark: '#B8893F' },
        // Nền kem sáng / bọt sữa
        cream: { DEFAULT: '#F6F2EA', dark: '#EDE5D8' },
        latte: '#E8D9BE',
        // Ghế mây đan cam đất
        rattan: { DEFAULT: '#8C4F2E', light: '#B26A40', soft: '#F1DED0', dark: '#643522' },
        // Chậu cây xanh — màu thành công / nút QR (theo mockup “highlighted in green”)
        leaf: { DEFAULT: '#5E7A2E', light: '#8BA24A', soft: '#E6ECD6', dark: '#475D1F' },
        // Sàn đá xám ấm / inox — chữ phụ
        stone: { DEFAULT: '#6F6254', light: '#8A7D6E', soft: '#D9D2C7' },
        charcoal: '#2B2A27',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Montserrat', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        card: '0 1px 2px rgba(42,34,24,0.06), 0 4px 16px rgba(42,34,24,0.06)',
        lift: '0 8px 30px rgba(42,34,24,0.16)',
        glow: '0 6px 20px rgba(217,174,99,0.35)',
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'slide-down': { from: { transform: 'translateY(-120%)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { '0%': { transform: 'scale(.85)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'pulse-ring': { '0%': { transform: 'scale(.9)', opacity: '.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'slide-up': 'slide-up .28s cubic-bezier(.2,.8,.2,1)',
        'slide-down': 'slide-down .32s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .2s ease-out',
        'pop-in': 'pop-in .28s cubic-bezier(.2,.8,.2,1)',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
