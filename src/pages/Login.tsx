import { useState } from "react";
import { User, Lock } from "lucide-react";

interface LoginProps {
  onLogin: (username: string, password: string) => boolean;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!onLogin(username, password)) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-cream to-brown-100 font-cairo">
      <div className="w-96 max-w-[90vw] bg-white rounded-[14px] shadow-[0_8px_24px_rgba(62,39,35,0.08)] p-9">
        <h1 className="text-2xl font-bold text-brown-900 text-center font-cairo">
          استراحة درويش
        </h1>
        <p className="text-sm text-brown-500 text-center mt-2 font-cairo">
          نظام إدارة المبيعات والمخزون
        </p>
        <hr className="border-[rgba(62,39,35,0.08)] my-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
              اسم المستخدم
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pr-10 pl-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all duration-150"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown-900 mb-2 font-cairo">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pr-10 pl-4 border border-brown-300 rounded-md text-brown-900 font-cairo focus:border-teal-700 focus:ring-[3px] focus:ring-teal-50 outline-none transition-all duration-150"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 font-cairo text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-11 bg-teal-700 hover:bg-teal-600 text-white font-semibold font-cairo rounded-md transition-all duration-150 active:scale-[0.98] shadow-[0_1px_3px_rgba(62,39,35,0.04)] hover:shadow-sm"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
