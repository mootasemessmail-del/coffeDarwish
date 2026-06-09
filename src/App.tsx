import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import Expenses from "./pages/Expenses";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pos from "./pages/Pos";
import Products from "./pages/Products";
import Reports from "./pages/Reports";

function App() {
  const { isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <Toaster
          position="top-left"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "Cairo",
              direction: "rtl",
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="font-cairo" dir="rtl">
      <Sidebar onLogout={logout} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<Pos />} />
        <Route path="/products" element={<Products />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster
        position="top-left"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: "Cairo",
            direction: "rtl",
          },
        }}
      />
    </div>
  );
}

export default App;
