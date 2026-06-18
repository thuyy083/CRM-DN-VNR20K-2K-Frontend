import { useEffect, useMemo, useState } from "react";
import "./UserTable.scss";

function UserTable({ interactions, onView, onDeleteEnterprise }) {
  const [sortConfig, setSortConfig] = useState({
    key: "latestInteractionDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const data = [...(interactions || [])];

    // Sort phía client để thao tác nhanh với danh sách đã tải sẵn.
    data.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [interactions, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const currentTableData = useMemo(() => {
    const first = (currentPage - 1) * itemsPerPage;
    const last = first + itemsPerPage;
    return sortedData.slice(first, last);
  }, [sortedData, currentPage]);

  const changePage = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow">↕</span>;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>STT</th>

              <th
                onClick={() => requestSort("enterpriseName")}
                className="sortable"
              >
                Doanh nghiệp {getSortIcon("enterpriseName")}
              </th>
              <th
                onClick={() => requestSort("interactionCount")}
                className="sortable"
              >
                Số lần tiếp xúc {getSortIcon("interactionCount")}
              </th>
              <th
                onClick={() => requestSort("latestInteractionDate")}
                className="sortable"
              >
                Ngày tiếp xúc gần nhất {getSortIcon("latestInteractionDate")}
              </th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {currentTableData.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  Chưa có dữ liệu tiếp xúc
                </td>
              </tr>
            ) : (
              currentTableData.map((item, index) => (
                <tr key={item.id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>
                    <span className="enterprise-name-cell">
                      <span>{item.enterpriseName || "-"}</span>
                      {Boolean(item?.isPotential) && (
                        <span
                          className="potential-star"
                          title="Doanh nghiệp tiềm năng"
                        >
                          ★
                        </span>
                      )}
                    </span>
                  </td>
                  <td>{item.interactionCount || 0}</td>
                  <td>{formatDate(item.latestInteractionDate)}</td>
                  <td>
                    <div className="action-btns">
                      {/* Xem chi tiết */}
                      <button
                        className="view-btn"
                        title="Xem chi tiết"
                        onClick={() => onView(item)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          width="16"
                          height="16"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </button>

                      {/* Xóa */}
                      <button
                        className="delete-btn"
                        title="Xóa doanh nghiệp"
                        onClick={() => onDeleteEnterprise(item)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          width="16"
                          height="16"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => changePage(currentPage - 1)}
            >
              &laquo; Trước
            </button>

            <div className="page-numbers">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    className={`page-num ${currentPage === page ? "active" : ""}`}
                    onClick={() => changePage(page)}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => changePage(currentPage + 1)}
            >
              Sau &raquo;
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default UserTable;
