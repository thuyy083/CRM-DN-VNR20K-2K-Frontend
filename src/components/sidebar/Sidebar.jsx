import { Link } from "react-router-dom";
import "./Sidebar.scss";
import logo from "../../assets/images/logo.png";

function Sidebar() {
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