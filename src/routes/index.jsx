import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/mainLayout/MainLayout";

import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import Employees from "../pages/employees/Employees";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "../pages/profile/Profile";
import Services from "../pages/service/Services";
import Enterprises from "../pages/enterprises/Enterprises";
import Users from "../pages/users/Users";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        ></Route>

        {/* Protected routes dùng layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/services" element={<Services />} />
          <Route path="/enterprises" element={<Enterprises />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
