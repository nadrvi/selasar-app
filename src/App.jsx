import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Beranda from "./pages/Beranda";
import Searching from "./pages/Searching";
import Profile from "./pages/Profile";
import Map from "./pages/Map";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";

function App() {
  return (
    <ThemeProvider> 
      <Router>
        <div className="font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500 min-h-screen">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/beranda" element={<Beranda />} />
            <Route path="/searching" element={<Searching />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/map" element={<Map />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;