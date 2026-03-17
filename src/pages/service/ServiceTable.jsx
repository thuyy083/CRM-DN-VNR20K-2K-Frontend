import { useState, useMemo } from "react";
import "./ServiceTable.scss";

function ServiceTable({ services, onEdit, onDelete, currentUserRole }) {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedServices = useMemo(() => {
    let sortableItems = services ? [...services] : [];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [services, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedServices.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedServices]);

  const totalPages = Math.ceil(sortedServices.length / itemsPerPage);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow">↕</span>;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="table-container">
      <table className="service-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("serviceCode")} className="sortable">
              Mã dịch vụ {getSortIcon("serviceCode")}
            </th>
            <th onClick={() => requestSort("serviceName")} className="sortable">
              Tên dịch vụ {getSortIcon("serviceName")}
            </th>
            <th
              onClick={() => requestSort("category")}
              className="sortable text-center"
            >
              Phân loại {getSortIcon("category")}
            </th>
            <th
              onClick={() => requestSort("isActive")}
              className="sortable text-center"
            >
              Tình trạng bán {getSortIcon("isActive")}
            </th>
            {currentUserRole === "ADMIN" && (
              <th className="text-center">Hành động</th>
            )}
          </tr>
        </thead>

        <tbody>
          {currentTableData.length === 0 ? (
            <tr>
              {/* Đã thêm text-center vào đây để ép nó ra giữa */}
              <td
                colSpan={currentUserRole === "ADMIN" ? "5" : "4"}
                className="empty-state text-center"
              >
                Chưa có dịch vụ nào trong hệ thống
              </td>
            </tr>
          ) : (
            currentTableData.map((service) => {
              const code = service.serviceCode || service.service_code;
              const name = service.serviceName || service.service_name;
              const isActive = service.isActive ?? service.is_active ?? false;

              return (
                <tr key={service.id || code}>
                  <td className="font-bold highlight-code">{code}</td>
                  <td className="font-medium">{name}</td>
                  <td className="text-center">
                    <span className="category-badge">{service.category}</span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`status-badge ${isActive ? "active" : "inactive"}`}
                    >
                      {isActive ? "Đang bán" : "Ngừng cung cấp"}
                    </span>
                  </td>

                  {currentUserRole === "ADMIN" && (
                    <td className="text-center">
                      <div className="action-btns">
                        <button
                          className="edit-btn"
                          title="Sửa"
                          onClick={() => onEdit(service)}
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
                        <button
                          className="delete-btn"
                          title="Xóa"
                          onClick={() => onDelete(service.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
          >
            &laquo; Trước
          </button>
          <div className="page-numbers">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`page-num ${currentPage === i + 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
          >
            Sau &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default ServiceTable;
