import { useEffect, useState, useCallback, useRef } from "react";
import "./Enterprises.scss";

import EnterpriseTable from "./EnterpriseTable";
import EnterpriseModal from "./EnterpriseModal";
import EnterpriseDetailModal from "./EnterpriseDetailModal";
import { getEnterprises, getIndustries } from "../../services/enterpriseService";
import ImportEnterpriseModal from "./ImportEnterpriseModal";


function Enterprises() {
  const [enterprises, setEnterprises] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [filterIndustry, setFilterIndustry] = useState("ALL");
  const [openImport, setOpenImport] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [industries, setIndustries] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchEnterprises = useCallback(async () => {
    try {
      const res = await getEnterprises(
        0,
        10,
        searchTerm,
        filterStatus === "ALL" ? "" : filterStatus,
        filterIndustry === "ALL" ? "" : filterIndustry
      );

      setEnterprises(res.data?.data?.content || []);
    } catch (err) {
      console.error(err);
    }
  }, [searchTerm, filterStatus, filterIndustry]);



  const fetchIndustries = useCallback(async () => {
    try {
      const res = await getIndustries();
      setIndustries(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEnterprises();
    fetchIndustries();
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
  const handleView = (enterprise) => {
  setSelectedEnterprise(enterprise);
  setOpenDetail(true);
};

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];
  const industryOptions = [
    { value: "ALL", label: "Tất cả ngành" },
    ...industries.map((i) => ({
      value: i.code,
      label: i.name,
    })),
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
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchEnterprises();
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm, filterStatus, filterIndustry]);



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
              className={`dropdown-trigger ${openDropdown === "status" ? "active" : ""
                }`}
              onClick={() =>
                setOpenDropdown(openDropdown === "status" ? null : "status")
              }
            >
              <span>
                {statusOptions.find((opt) => opt.value === filterStatus)?.label}
              </span>

              <svg
                className={`icon-chevron ${openDropdown === "status" ? "open" : ""
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
                    className={`dropdown-item ${filterStatus === opt.value ? "selected" : ""
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
          {/* =========================================
    CUSTOM DROPDOWN - NGÀNH NGHỀ
========================================== */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "industry" ? "active" : ""
                }`}
              onClick={() =>
                setOpenDropdown(openDropdown === "industry" ? null : "industry")
              }
            >
              <span>
                {
                  industryOptions.find((opt) => opt.value === filterIndustry)
                    ?.label
                }
              </span>

              <svg
                className={`icon-chevron ${openDropdown === "industry" ? "open" : ""
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

            {openDropdown === "industry" && (
              <div className="dropdown-menu">
                {industryOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterIndustry === opt.value ? "selected" : ""
                      }`}
                    onClick={() => {
                      setFilterIndustry(opt.value);
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
          <button
  className="import-btn"
  onClick={() => setOpenImport(true)}
>
  Import Excel
</button>
        </div>
      </div>

      <div className="table-card">
        <EnterpriseTable
  enterprises={enterprises}
  industries={industries}
  onEdit={handleEdit}
  onView={handleView}
/>
      </div>

      {openModal && (
        <EnterpriseModal
          enterprise={selectedEnterprise}
          close={() => setOpenModal(false)}
          reload={fetchEnterprises}
        />
      )}
      {openDetail && (
  <EnterpriseDetailModal
    enterprise={selectedEnterprise}
    industries={industries}
    close={() => setOpenDetail(false)}
  />
)}
{openImport && (
  <ImportEnterpriseModal
    close={() => setOpenImport(false)}
    reload={fetchEnterprises}
  />
)}
    </div>
  );
}

export default Enterprises;