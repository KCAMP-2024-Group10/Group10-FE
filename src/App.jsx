import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import Main from './pages/Main'; 
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Splash from './pages/Splash';

const libraries = ['places'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <Router>
        <AppInner />
      </Router>
    </LoadScript>
  );
}

// 실제 라우팅과 Header 노출 여부를 처리하는 컴포넌트
function AppInner() {
  const location = useLocation();

  return (
    <>
      {/* location.pathname가 '/'(Splash) 아닐 때만 Header 보임 */}
      {location.pathname !== '/' && <Header />}

      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/main" element={<Main />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;