import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/mainLayout/MainLayout";

import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import Employees from "../pages/employees/Employees";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes dùng layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;