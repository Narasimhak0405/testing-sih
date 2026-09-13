import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#A0D2F9] dark:bg-[#090D16] flex items-center justify-center text-[#1B2942] dark:text-white font-medium text-xs">
        Connecting to MANGANAI Secure Node…
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
