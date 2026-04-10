import { NavLink } from "react-router-dom";
//import { useSelector } from "react-redux";
import styles from "./Sidebar.module.scss";
import logo from "../../assets/images/logo.png";

// const getNormalizedRole = (user) => {
//   const directRole = user?.role || user?.roleName;
//   if (typeof directRole === "string" && directRole.trim()) {
//     return directRole.trim().toUpperCase();
//   }

//   const firstRole = user?.roles?.[0];
//   if (typeof firstRole === "string" && firstRole.trim()) {
//     return firstRole.trim().toUpperCase();
//   }
//   if (firstRole?.name && typeof firstRole.name === "string") {
//     return firstRole.name.trim().toUpperCase();
//   }

//   return "";
// };

function Sidebar() {
  //const user = useSelector((state) => state.auth.user);
  //const role = getNormalizedRole(user);
  //const isAdmin = role === "ADMIN";

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <img src={logo} alt="logo" />
      </div>

      <nav className={styles.menu}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ""}>
          Dashboard
        </NavLink>

        <NavLink to="/employees" className={({ isActive }) => isActive ? styles.active : ""}>
          Quản lý nhân viên
        </NavLink>

        <NavLink to="/services" className={({ isActive }) => isActive ? styles.active : ""}>
          Quản lý dịch vụ
        </NavLink>

        <NavLink to="/enterprises" className={({ isActive }) => isActive ? styles.active : ""}>
          Quản lý doanh nghiệp
        </NavLink>

        <NavLink to="/appointments" className={({ isActive }) => isActive ? styles.active : ""}>
          Quản lý lịch hẹn
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => isActive ? styles.active : ""}>
          Quản lý tiếp xúc
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;