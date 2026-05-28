import { Link } from "react-router-dom";
import logoSelasar from "../assets/logo.png";
import textLogo from "../assets/text-logo.png";

export default function Login() {
  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      {/* Container Card */}
      <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full min-h-[500px]">
        {/* Sisi Kiri: Area Logo Asli */}
        <div className="md:w-1/2 p-10 flex flex-col items-center justify-center bg-white border-b md:border-b-0 md:border-r border-gray-200">
          <img
            src={logoSelasar}
            alt="Logo Selasar"
            className="w-72 h-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Sisi Kanan: Area Form */}
        <div className="md:w-1/2 p-10 bg-gray-100 flex flex-col justify-center items-center">
          <img
            src={textLogo}
            alt="Selasar Typography"
            className="h-20 w-auto object-contain mb-8 drop-shadow-sm"
          />

          <form className="w-full max-w-sm flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-full bg-gray-200 text-gray-700 outline-none focus:ring-2 focus:ring-green-700 transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-full bg-gray-200 text-gray-700 outline-none focus:ring-2 focus:ring-green-700 transition-all"
            />
            {/* Tombol Login */}
            <button
              type="submit"
              className="w-full mt-4 bg-gray-400 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition-all shadow-md"
            >
              Login
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="text-green-700 font-semibold hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
