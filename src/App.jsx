import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Beranda from "./pages/Beranda";
import Searching from "./pages/Searching";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <div className="font-sans text-gray-900">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/beranda" element={<Beranda />} />
          <Route path="/searching" element={<Searching />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;