import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './pages/Main'; // Main 페이지 추가
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Main />} /> {/* 메인 페이지 추가 */}
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} /> {/* 404 페이지 처리 */}
      </Routes>
    </Router>
  );
}

export default App;