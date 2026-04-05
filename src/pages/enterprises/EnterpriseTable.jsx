import { useState, useMemo } from "react";
import "./EnterpriseTable.scss";


function EnterpriseTable({ enterprises, industries = [], onEdit, onView, currentPage,
  totalPages,
  onPageChange, }) {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const industryMap = useMemo(() => {
    const map = {};
    industries.forEach((i) => {
      map[i.code] = i.name;
    });
    return map;
  }, [industries]);

  const sortedData = useMemo(() => {
    let items = [...enterprises];

    items.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

    return items;
  }, [enterprises, sortConfig]);
  const handlePageChange = (pageNumber) => {
  onPageChange(pageNumber - 1); // 👈 convert về 0-based
};

  return (
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>STT</th>
            <th onClick={() => requestSort("id")}>ID</th>
            <th onClick={() => requestSort("name")}>Tên doanh nghiệp</th>
            <th>MST</th>
            <th>Ngành</th>
            <th>Nhân viên</th>
            <th>Điện thoại</th>
            <th>Website</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sortedData.map((e, index) => (
            <tr key={e.id}>
              <td>
        {currentPage * 10 + index + 1}
      </td>
              <td>{e.id}</td>
              <td className="font-medium">{e.name}</td>
              <td>{e.taxCode}</td>

              {/* FIX Ở ĐÂY */}
              <td>{industryMap[e.industry] || "-"}</td>

              <td>{e.employeeCount}</td>
              <td>{e.phone}</td>
              <td>{e.website}</td>

              <td>
                <span className={`status ${e.status?.toLowerCase()}`}>
                  {e.status}
                </span>
              </td>

              <td>
  <div className="action-btns">
    <button
      className="view-btn"
      onClick={() => onView(e)}
    >
      Xem
    </button>

    <button
      className="edit-btn"
      onClick={() => onEdit(e)}
    >
      Sửa
    </button>
  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
     {totalPages > 1 && (
  <div className="pagination">
    <button
      className="page-btn"
      disabled={currentPage === 0}
      onClick={() => onPageChange(currentPage - 1)}
    >
      &laquo; Trước
    </button>

    <div className="page-numbers">
      {[...Array(totalPages)].map((_, index) => {
        const pageNumber = index + 1;

        return (
          <button
            key={pageNumber}
            className={`page-num ${
              currentPage === index ? "active" : ""
            }`}
            onClick={() => handlePageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        );
      })}
    </div>

    <button
      className="page-btn"
      disabled={currentPage === totalPages - 1}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Sau &raquo;
    </button>
  </div>
)}
    </div>
  );
}

export default EnterpriseTable;