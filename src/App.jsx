import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import Main from './pages/Main'; // Main 페이지 추가
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Splash from './pages/Splash';

// libraries를 상수로 선언
const libraries = ['places'];

function App() {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Splash />} /> 
        <Route path="/main" element={<Main />} /> {/* 메인 페이지 추가 */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} /> {/* 404 페이지 처리 */}
      </Routes>
    </Router>
    </LoadScript>
  );
}

export default App;