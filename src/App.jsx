import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Beranda from "./pages/Beranda";
import Searching from "./pages/Searching";
import Profile from "./pages/Profile";
import Map from "./pages/Map";

function App() {
  return (
    <Router>
      <div className="font-sans text-gray-900">
        {/* Nanti Navbar ditaruh di sini biar muncul di semua halaman */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/beranda" element={<Beranda />} />
          <Route path="/search" element={<Searching />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/map" element={<Map />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;