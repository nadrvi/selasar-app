import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSelasar from "../assets/logo.png";
import textLogo from "../assets/text-logo.png";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.firstName) newErrors.firstName = "Nama depan wajib diisi.";
    if (!formData.lastName) newErrors.lastName = "Nama belakang wajib diisi.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid.";
    }

    const passwordStrongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!formData.password) {
      newErrors.password = "Password wajib diisi.";
    } else if (!passwordStrongRegex.test(formData.password)) {
      newErrors.password = "Min 8 karakter, wajib ada huruf besar & angka.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const userAccount = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
    };

    localStorage.setItem("selasarUser", JSON.stringify(userAccount));
    alert("Akun berhasil dibuat! Silakan login.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      {/* flex-col-reverse: Membalik urutan HTML di mobile agar Logo Utama (yang ada di baris bawah HTML) naik ke posisi paling atas */}
      <div className="flex flex-col-reverse md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full min-h-[500px]">
        {/* Sisi Kiri (Desktop) / Bawah (Mobile): Area Form Input */}
        <div className="w-full md:w-1/2 p-8 md:p-10 bg-gray-100 relative flex flex-col justify-center items-center">
          <Link
            to="/"
            className="absolute top-6 left-1 w-10 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all font-bold shadow-md"
          >
            ←
          </Link>

          <img
            src={textLogo}
            alt="Selasar Typography"
            className="hidden md:block h-16 w-auto object-contain mb-8 drop-shadow-sm"
          />

          <form
            onSubmit={handleRegister}
            className="w-full max-w-sm flex flex-col gap-3"
          >
            <div className="flex gap-2">
              <div className="w-1/2">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Nama Depan"
                  className={`w-full px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 transition-all ${errors.firstName ? "border-2 border-red-500 focus:ring-red-500" : "focus:ring-green-700"}`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1 ml-2">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="w-1/2">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nama Belakang"
                  className={`w-full px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 transition-all ${errors.lastName ? "border-2 border-red-500 focus:ring-red-500" : "focus:ring-green-700"}`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1 ml-2">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={`w-full px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 transition-all ${errors.email ? "border-2 border-red-500 focus:ring-red-500" : "focus:ring-green-700"}`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 ml-2">{errors.email}</p>
              )}
            </div>

            <div className="flex gap-2 relative">
              <div className="w-1/2">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={`w-full px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 transition-all ${errors.password ? "border-2 border-red-500 focus:ring-red-500" : "focus:ring-green-700"}`}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 ml-2 leading-tight">
                    {errors.password}
                  </p>
                )}
              </div>
              <div className="w-1/2">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Konfirmasi PW"
                  className={`w-full px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 transition-all ${errors.confirmPassword ? "border-2 border-red-500 focus:ring-red-500" : "focus:ring-green-700"}`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-2 leading-tight">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-gray-400 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition-all shadow-md cursor-pointer"
            >
              Daftar
            </button>
          </form>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col items-center justify-center bg-white border-b md:border-b-0 md:border-l border-gray-200">
          <img
            src={logoSelasar}
            alt="Logo Selasar"
            className="w-44 md:w-72 h-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
}
