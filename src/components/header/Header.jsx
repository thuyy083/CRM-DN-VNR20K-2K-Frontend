import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { logout } from "../../redux/slices/authSlice";
import { logoutApi } from "../../services/authService";

import "./Header.scss";

function Header() {

  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const role = user?.roles?.[0]?.name;

  const toggleMenu = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {console.log(e)}

    dispatch(logout());
    localStorage.removeItem("token");

    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  // click ngoài menu sẽ đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="header">

      <h3>HỆ THỐNG QUẢN LÝ TIẾP XÚC DOANH NGHIỆP</h3>

      <div className="user-section" ref={menuRef}>

        <div className="user-info" onClick={toggleMenu}>

          <div className="avatar-header">
            {user?.fullName?.charAt(0)}
          </div>

          <div className="user-text">
            <span className="name">{user?.fullName}</span>
            <span className="role">{role}</span>
          </div>

          <span className={`dropdown-icon ${open ? "rotate" : ""}`}>
            ▼
          </span>

        </div>

        {open && (
          <div className="dropdown-menu">

            <div
              className="dropdown-item"
              onClick={handleProfile}
            >
              Thông tin cá nhân
            </div>

            <div
              className="dropdown-item logout"
              onClick={handleLogout}
            >
              Đăng xuất
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default Header;