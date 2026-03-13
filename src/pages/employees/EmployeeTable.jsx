import { useState, useMemo } from "react";
import "./EmployeeTable.scss";

function EmployeeTable({ users, onEdit }) {
  // Trạng thái sort: mặc định sort theo ID tăng dần
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const roleMap = {
    ADMIN: "Quản trị viên",
    CONSULTANT: "Tư vấn viên",
    STAFF: "Nhân viên",
  };

  // Hàm xử lý khi click vào tiêu đề cột
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Logic sắp xếp dữ liệu
  const sortedUsers = useMemo(() => {
    let sortableItems = users ? [...users] : [];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Xử lý giá trị null/undefined để tránh lỗi khi so sánh
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Hiển thị icon mũi tên dựa trên trạng thái sort
  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <span className="sort-arrow-default">↕</span>;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="table-container">
      <table className="employee-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("id")} className="sortable">
              ID {getSortIcon("id")}
            </th>
            <th onClick={() => requestSort("fullName")} className="sortable">
              Họ tên {getSortIcon("fullName")}
            </th>
            <th onClick={() => requestSort("email")} className="sortable">
              Email {getSortIcon("email")}
            </th>
            <th onClick={() => requestSort("phone")} className="sortable">
              SĐT {getSortIcon("phone")}
            </th>
            <th>Ngày sinh</th>
            <th onClick={() => requestSort("status")} className="sortable">
              Trạng thái {getSortIcon("status")}
            </th>
            <th onClick={() => requestSort("role")} className="sortable">
              Vai trò {getSortIcon("role")}
            </th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>

        <tbody>
          {sortedUsers.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-state">
                Chưa có dữ liệu nhân viên nào
              </td>
            </tr>
          ) : (
            sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td className="font-medium">{user.fullName || user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || "-"}</td>
                <td>{formatDate(user.dateOfBirth)}</td>
                <td>
                  <span
                    className={`status-badge ${user.status?.toLowerCase()}`}
                  >
                    {user.status === "ACTIVE"
                      ? "Hoạt động"
                      : user.status === "INACTIVE"
                        ? "Ngưng HĐ"
                        : "-"}
                  </span>
                </td>
                <td>
                  <span className={`role-badge ${user.role?.toLowerCase()}`}>
                    {roleMap[user.role] || user.role}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="edit-btn"
                      title="Sửa"
                      onClick={() => onEdit(user)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;
