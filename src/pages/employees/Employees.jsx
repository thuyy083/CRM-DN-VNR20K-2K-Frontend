import { useEffect, useState, useCallback, useRef } from "react";
import "./Employees.scss";

import { getUsers } from "../../services/userService";
import EmployeeModal from "./EmployeeModal";
import EmployeeTable from "./EmployeeTable";
import EmployeeViewModal from "./EmployeeViewModal";

function Employees() {
  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // State quản lý bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // State quản lý Custom Dropdown
  const [openDropdown, setOpenDropdown] = useState(null); 
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data?.data?.content || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setOpenViewModal(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setOpenModal(true);
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (user.fullName || user.name || "")
      .toLowerCase()
      .includes(term);
    const emailMatch = (user.email || "").toLowerCase().includes(term);
    const phoneMatch = (user.phone || "").includes(term);
    const matchesSearch = nameMatch || emailMatch || phoneMatch;

    const matchesRole = filterRole === "ALL" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "ALL" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Dữ liệu cho Dropdown
  const roleOptions = [
    { value: "ALL", label: "Tất cả vai trò" },
    { value: "ADMIN", label: "Quản trị viên" },
    { value: "CONSULTANT", label: "Nhân viên tư vấn" },
  ];

  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];

  return (
    <div className="employees-page">
      <div className="header">
        <h2>Quản lý nhân viên</h2>

        <div className="header-actions" ref={dropdownRef}>
          {/* Bẫy Autofill */}
          <input
            type="text"
            style={{ position: "absolute", opacity: 0, width: 0, zIndex: -1 }}
            tabIndex="-1"
          />
          <input
            type="password"
            style={{ position: "absolute", opacity: 0, width: 0, zIndex: -1 }}
            tabIndex="-1"
          />

          {/* Ô Tìm kiếm */}
          <div className="search-box">
            <svg
              className="icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              name="search_real_field"
              autoComplete="off"
              placeholder="Tìm tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              readOnly={true}
              onFocus={(e) => e.target.removeAttribute("readonly")}
            />

            {/* THÊM NÚT X XÓA NHANH Ở ĐÂY */}
            {searchTerm && (
              <svg
                className="icon-clear"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => setSearchTerm("")}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </div>

          {/* =========================================
              CUSTOM DROPDOWN - VAI TRÒ
          ========================================== */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "role" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "role" ? null : "role")
              }
            >
              <span>
                {roleOptions.find((opt) => opt.value === filterRole)?.label}
              </span>
              <svg
                className={`icon-chevron ${openDropdown === "role" ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "role" && (
              <div className="dropdown-menu">
                {roleOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterRole === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterRole(opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =========================================
              CUSTOM DROPDOWN - TRẠNG THÁI
          ========================================== */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "status" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "status" ? null : "status")
              }
            >
              <span>
                {statusOptions.find((opt) => opt.value === filterStatus)?.label}
              </span>
              <svg
                className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "status" && (
              <div className="dropdown-menu">
                {statusOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterStatus === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterStatus(opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" className="add-btn" onClick={handleCreate}>
            + Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="table-card">
        <EmployeeTable
          users={filteredUsers}
          refresh={fetchUsers}
          onEdit={handleEdit}
          onView={handleView}
        />
      </div>

      {/* MODAL THÊM / SỬA */}
      {openModal && (
        <EmployeeModal
          user={selectedUser}
          close={() => setOpenModal(false)}
          reload={fetchUsers}
        />
      )}

      {/* MODAL XEM CHI TIẾT (ĐOẠN VỪA THÊM) */}
      {openViewModal && (
        <EmployeeViewModal
          user={selectedUser}
          close={() => setOpenViewModal(false)}
        />
      )}
    </div>
  );
}

export default Employees;
