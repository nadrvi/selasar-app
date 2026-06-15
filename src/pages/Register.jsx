import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TextSelasar from "../assets/text-logo.png";
import Daun from "../assets/Daun.png";

export default function Register() {
  const dateRef = useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    day: "",
    month: "",
    year: "",
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

    if (!formData.username) newErrors.username = "Username wajib diisi.";

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
      name: formData.username,
      email: formData.email,
      birthdate: `${formData.year}-${formData.month}-${formData.day}`,
      password: formData.password,
    };

    localStorage.setItem("selasarUser", JSON.stringify(userAccount));
    alert("Akun berhasil dibuat! Silakan login.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4 select-none">
      {/* Container */}
      <div className="flex h-screen flex-col md:flex-row rounded-[2rem] shadow-2xl overflow-hidden max-w-[1000px] w-full min-h-[600px]">
        {/* FORM */}
        <div className="w-[60%]  bg-[#C0B3A4] p-8">
          {/* Tombol Back */}
          <Link
            to="/"
            className="mb-6 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#8B7A6A] hover:bg-gray-200 transition shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </Link>

          <form
            onSubmit={handleRegister}
            className="w-full flex flex-col gap-4"
          >
            {/* Profile */}
            <div>
              <p className="text-[#7D7063] font-medium text-sm mb-2">Profile</p>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className={`w-full px-4 py-3 rounded-full bg-[#EBE5DC] outline-none
  ${
    errors.username
      ? "border-2 border-red-500"
      : "border-2 border-transparent focus:ring-2 focus:ring-[#52413E]"
  }`}
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className={`w-full px-4 py-3 rounded-full bg-[#EBE5DC] outline-none
  ${
    errors.email
      ? "border-2 border-red-500"
      : "border-2 border-transparent focus:ring-2 focus:ring-[#52413E]"
  }`}
                />
              </div>
            </div>

            {/* Birthdate Section */}
            <div className="mt-2">
              <p className="text-[#7D7063] font-medium text-sm mb-2">
                Birthdate
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="day"
                  maxLength="2"
                  value={formData.day}
                  onChange={handleChange}
                  placeholder="DD"
                  className="w-[28%] px-2 py-3 text-center rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#52413E] transition-all"
                />
                <input
                  type="text"
                  name="month"
                  maxLength="2"
                  value={formData.month}
                  onChange={handleChange}
                  placeholder="MM"
                  className="w-[28%] px-2 py-3 text-center rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#52413E] transition-all"
                />

                {/* YYYY & Calendar Fix */}
                <div className="w-[44%] relative flex items-center">
                  <input
                    type="text"
                    name="year"
                    maxLength="4"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="YYYY"
                    className="w-full pl-2 pr-10 py-3 text-center rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#52413E] transition-all"
                  />

                  {/* Invisible Date Picker Wrapper */}
                  <div className="absolute right-2 w-8 h-8 rounded-lg overflow-hidden hover:bg-[#7d6858] transition-colors cursor-pointer">
                    <div className="w-full h-full bg-[#937C6A] flex items-center justify-center text-white pointer-events-none rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                    </div>
                    <input
                      type="date"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [year, month, day] = e.target.value.split("-");
                        setFormData((prev) => ({ ...prev, day, month, year }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-3">
              <p className="text-[#7D7063] font-medium text-sm">Password</p>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full px-4 py-3 rounded-full bg-[#EBE5DC] outline-none
  ${
    errors.password
      ? "border-2 border-red-500"
      : "border-2 border-transparent focus:ring-2 focus:ring-[#52413E]"
  }`}
              />

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmation password"
                className={`w-full px-4 py-3 rounded-full bg-[#EBE5DC] outline-none
  ${
    errors.confirmPassword
      ? "border-2 border-red-500"
      : "border-2 border-transparent focus:ring-2 focus:ring-[#52413E]"
  }`}
              />
            </div>

            {Object.keys(errors).length > 0 && (
              <p className="text-xs text-red-600">
                Mohon periksa kembali input Anda.
              </p>
            )}

            <button
              type="submit"
              className="w-full mt-4 bg-[#52413E] hover:bg-[#3d312e] text-white font-semibold py-3 rounded-[1.25rem] transition-all"
            >
              Register
            </button>
          </form>
        </div>

        {/* LOGO */}
        <div className="w-[40%] sticky top-0 h-screen bg-[#F0EBE3] flex items-center justify-center">
          {/* Daun kanan atas */}
          <img
            src={Daun}
            alt="Daun"
            className="absolute -top-20 right-0 w-100 opacity-90"
          />

          {/* Logo */}
          <img src={TextSelasar} alt="Logo Selasar" className="w-85 mr-4" />
        </div>
      </div>
    </div>
  );
}
