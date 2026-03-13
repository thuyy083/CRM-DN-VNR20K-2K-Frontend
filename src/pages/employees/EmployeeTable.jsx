import { useState, useMemo } from "react";
import "./EmployeeTable.scss";

function EmployeeTable({ users, onEdit, onView }) {
  // 1. STATE SẮP XẾP
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  // 2. STATE PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const roleMap = {
    ADMIN: "Quản trị viên",
    CONSULTANT: "Nhân viên tư vấn",
    STAFF: "Nhân viên",
  };

  // Hàm xử lý hiển thị Giới tính
  const getGenderLabel = (gender) => {
    if (!gender) return "-";
    const genderUpper = gender.toUpperCase();
    if (genderUpper === "MALE") return "Nam";
    if (genderUpper === "FEMALE") return "Nữ";
    if (genderUpper === "OTHER") return "Khác";
    return gender;
  };

  // Hàm xử lý Sắp xếp
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Logic Sắp xếp toàn bộ dữ liệu
  const sortedUsers = useMemo(() => {
    let sortableItems = users ? [...users] : [];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
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

  // Logic Phân trang
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedUsers.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedUsers]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow">↕</span>;
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
            <th onClick={() => requestSort("gender")} className="sortable">
              Giới tính {getSortIcon("gender")}
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
          {currentTableData.length === 0 ? (
            <tr>
              <td colSpan="9" className="empty-state">
                Chưa có dữ liệu nhân viên nào
              </td>
            </tr>
          ) : (
            currentTableData.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td className="font-medium">{user.fullName || user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || "-"}</td>
                <td>{getGenderLabel(user.gender)}</td>
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
                    {/* NÚT CHỮ "I" XEM CHI TIẾT */}
                    <button
                      className="view-btn"
                      title="Xem chi tiết"
                      onClick={() => onView && onView(user)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </button>

                    {/* NÚT SỬA */}
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

      {/* GIAO DIỆN NÚT PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            &laquo; Trước
          </button>

          <div className="page-numbers">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  className={`page-num ${currentPage === pageNumber ? "active" : ""}`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Sau &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default EmployeeTable;
