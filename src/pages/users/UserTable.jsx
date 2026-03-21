import { useEffect, useMemo, useState } from "react";
import "./UserTable.scss";

const typeMap = {
  PHONE_CALL: "Gọi điện",
  OFFLINE_MEETING: "Gặp mặt",
  EMAIL_QUOTE: "Email",
  DEMO: "Thăm quan",
  ONLINE_MEETING: "Họp online",
  CONTRACT_SIGNING: "Ký hợp đồng",
  CUSTOMER_SUPPORT: "Hỗ trợ",
  OTHER: "Khác",
};

const resultMap = {
  PENDING: "Đang xử lý",
  NEED_FOLLOW_UP: "Cần theo dõi",
  SUCCESSFUL: "Thành công",
  FAILED: "Thất bại",
};

function UserTable({ interactions, onView, onEdit, onDelete }) {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    // Hiển thị ngày theo định dạng 
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
              <th onClick={() => requestSort("id")} className="sortable">
                ID {getSortIcon("id")}
              </th>
              <th onClick={() => requestSort("consultantName")} className="sortable">
                Nhân viên {getSortIcon("consultantName")}
              </th>
              <th onClick={() => requestSort("enterpriseName")} className="sortable">
                Doanh nghiệp {getSortIcon("enterpriseName")}
              </th>
              <th onClick={() => requestSort("contactName")} className="sortable">
                Người liên hệ {getSortIcon("contactName")}
              </th>
              <th onClick={() => requestSort("interactionType")} className="sortable">
                Loại {getSortIcon("interactionType")}
              </th>
              <th onClick={() => requestSort("interactionTime")} className="sortable">
                Ngày {getSortIcon("interactionTime")}
              </th>
              <th>Nội dung</th>
              <th onClick={() => requestSort("result")} className="sortable">
                Trạng thái {getSortIcon("result")}
              </th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {currentTableData.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  Chưa có dữ liệu tiếp xúc
                </td>
              </tr>
            ) : (
              currentTableData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="font-medium">{item.consultantName || "-"}</td>
                  <td>{item.enterpriseName || "-"}</td>
                  <td>{item.contactName || "-"}</td>
                  <td>{typeMap[item.interactionType] || item.interactionType || "-"}</td>
                  <td>{formatDate(item.interactionTime)}</td>
                  <td className="content-col">{item.description || "-"}</td>
                  <td>
                    <span className={`status-badge ${(item.result || "").toLowerCase()}`}>
                      {resultMap[item.result] || item.result || "-"}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="view-btn" title="Xem chi tiết" onClick={() => onView(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>

                      <button className="edit-btn" title="Sửa" onClick={() => onEdit(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      <button className="delete-btn" title="Xóa" onClick={() => setDeleteTarget(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                          <path d="M10 11v6"></path>
                          <path d="M14 11v6"></path>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
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
            <button className="page-btn" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
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

            <button className="page-btn" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>
              Sau &raquo;
            </button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h4>Xác nhận xóa</h4>
            <p>Bạn có chắc muốn xóa tiếp xúc #{deleteTarget.id} không?</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setDeleteTarget(null)}>
                Hủy
              </button>
              <button
                className="delete-confirm-btn"
                onClick={async () => {
                  await onDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserTable;
