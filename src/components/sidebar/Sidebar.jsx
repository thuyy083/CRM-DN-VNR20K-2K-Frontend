import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Sidebar.scss";
import logo from "../../assets/images/logo.png";

const getNormalizedRole = (user) => {
  const directRole = user?.role || user?.roleName;
  if (typeof directRole === "string" && directRole.trim()) {
    return directRole.trim().toUpperCase();
  }

  const firstRole = user?.roles?.[0];
  if (typeof firstRole === "string" && firstRole.trim()) {
    return firstRole.trim().toUpperCase();
  }
  if (firstRole?.name && typeof firstRole.name === "string") {
    return firstRole.name.trim().toUpperCase();
  }

  return "";
};

function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const role = getNormalizedRole(user);
  const isAdmin = role === "ADMIN";

  return (
    <div className="sidebar">

      <div className="logo-container">
        <img src={logo} alt="logo" />
      </div>

      <nav className="menu">
        <Link to="/">Dashboard</Link>
        <Link to="/employees">Quản lý nhân viên</Link>
        <Link to="/services">Quản lý dịch vụ</Link>
        <Link to="/enterprises">Quản lý doanh nghiệp</Link>
        <Link to="/users">Quản lý tiếp xúc</Link>
      </nav>

    </div>
  );
}

export default Sidebar;