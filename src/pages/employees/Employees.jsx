import { useEffect, useState, useCallback } from "react";
import "./Employees.scss";

import { getUsers } from "../../services/userService";
import EmployeeModal from "./EmployeeModal";
import EmployeeTable from "./EmployeeTable";

function Employees() {
  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // State quản lý bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

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

  const handleCreate = () => {
    setSelectedUser(null);
    setOpenModal(true);
  };

  // Logic lọc dữ liệu tổng hợp
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

  return (
    <div className="employees-page">
      <div className="header">
        <h2>Quản lý nhân viên</h2>

        <div className="header-actions">
          {/* Ô Tìm kiếm với Icon Kính lúp */}
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
              placeholder="Tìm tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc Vai trò với Icon Mũi tên */}
          <div className="filter-box">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="CONSULTANT">Tư vấn viên</option>
            </select>
            <svg
              className="icon-chevron"
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

          {/* Lọc Trạng thái với Icon Mũi tên */}
          <div className="filter-box">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
            <svg
              className="icon-chevron"
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

          <button className="add-btn" onClick={handleCreate}>
            + Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="table-card">
        <EmployeeTable
          users={filteredUsers}
          refresh={fetchUsers}
          onEdit={handleEdit}
        />
      </div>

      {openModal && (
        <EmployeeModal
          user={selectedUser}
          close={() => setOpenModal(false)}
          reload={fetchUsers}
        />
      )}
    </div>
  );
}

export default Employees;
