import { useState, useMemo } from "react";
import "./EnterpriseTable.scss";


function EnterpriseTable({ enterprises, industries = [], onEdit, onView }) {
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

  return (
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
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
          {sortedData.map((e) => (
            <tr key={e.id}>
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
    </div>
  );
}

export default EnterpriseTable;