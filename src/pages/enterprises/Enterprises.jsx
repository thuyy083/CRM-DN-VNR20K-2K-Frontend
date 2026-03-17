import { useEffect, useState, useCallback, useRef } from "react";
import "./Enterprises.scss";

import EnterpriseTable from "./EnterpriseTable";
import EnterpriseModal from "./EnterpriseModal";
import { getEnterprises } from "../../services/enterpriseService";


function Enterprises() {
  const [enterprises, setEnterprises] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchEnterprises = useCallback(async () => {
    try {
      const res = await getEnterprises();
      setEnterprises(res.data?.data?.content || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEnterprises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEnterprises]);

  const handleEdit = (enterprise) => {
    setSelectedEnterprise(enterprise);
    setOpenModal(true);
  };

  const handleCreate = () => {
    setSelectedEnterprise(null);
    setOpenModal(true);
  };

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Ngưng hoạt động" },
];
useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setOpenDropdown(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, []);

  const filteredEnterprises = enterprises.filter((e) => {
    const term = searchTerm.toLowerCase();

    const nameMatch = (e.name || "").toLowerCase().includes(term);
    const taxMatch = (e.taxCode || "").toLowerCase().includes(term);
    const phoneMatch = (e.phone || "").includes(term);

    const matchesSearch = nameMatch || taxMatch || phoneMatch;
    const matchesStatus =
      filterStatus === "ALL" || e.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="enterprises-page">
<div className="header">
  <h2>Quản lý doanh nghiệp</h2>

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

    {/* SEARCH */}
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
        type="search"
        name="search_real_field"
        autoComplete="new-password"
        placeholder="Tìm tên doanh nghiệp, MST..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    {/* =========================================
        CUSTOM DROPDOWN - TRẠNG THÁI
    ========================================== */}
    <div className="custom-dropdown">
      <div
        className={`dropdown-trigger ${
          openDropdown === "status" ? "active" : ""
        }`}
        onClick={() =>
          setOpenDropdown(openDropdown === "status" ? null : "status")
        }
      >
        <span>
          {statusOptions.find((opt) => opt.value === filterStatus)?.label}
        </span>

        <svg
          className={`icon-chevron ${
            openDropdown === "status" ? "open" : ""
          }`}
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
              className={`dropdown-item ${
                filterStatus === opt.value ? "selected" : ""
              }`}
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
      + Thêm doanh nghiệp
    </button>
  </div>
</div>

      <div className="table-card">
        <EnterpriseTable
          enterprises={filteredEnterprises}
          onEdit={handleEdit}
        />
      </div>

      {openModal && (
        <EnterpriseModal
          enterprise={selectedEnterprise}
          close={() => setOpenModal(false)}
          reload={fetchEnterprises}
        />
      )}
    </div>
  );
}

export default Enterprises;