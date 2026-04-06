// Enterprises.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import "./Enterprises.scss";

import EnterpriseTable from "./EnterpriseTable";
import EnterpriseModal from "./EnterpriseModal";
import EnterpriseDetailModal from "./EnterpriseDetailModal";
import ImportEnterpriseModal from "./ImportEnterpriseModal";
import { downloadEnterpriseTemplate, exportEnterprises, getEnterprises, getIndustries } from "../../services/enterpriseService";
// import "../employees/Employees.scss"
import { toast } from "react-toastify";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

function Enterprises() {
  const [enterprises, setEnterprises] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [industrySearch, setIndustrySearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const [selectedEnterprise, setSelectedEnterprise] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterIndustry, setFilterIndustry] = useState("ALL");
  const [filterPotential, setFilterPotential] = useState("ALL");

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

    const industryOptions = [
    { value: "ALL", label: "Tất cả ngành" },
    ...industries.map((i) => ({ value: i.code, label: i.name })),
  ];

  const filteredIndustries = industryOptions.filter((i) =>
    i.label.toLowerCase().includes(industrySearch.toLowerCase())
  );
  const getPotentialStorageMap = () => {
    try {
      const raw = localStorage.getItem(POTENTIAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("Cannot parse potential storage", error);
      return {};
    }
  };

  const isPotentialEnterprise = (item) => {
    const raw =
      item?.isPotential ??
      item?.potential ??
      item?.is_potential ??
      item?.potentialFlag ??
      item?.isPotentialCustomer ??
      item?.potentialCustomer;

    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw === 1;
    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      return ["true", "1", "yes", "y", "potential", "tiem_nang"].includes(normalized);
    }
    return false;
  };

  const fetchEnterprises = useCallback(async () => {
    try {
      // Luôn tải nhiều bản ghi hơn để lọc tiềm năng phía client không bị thiếu dữ liệu trang đầu.
      const fetchSize = 500;
      const res = await getEnterprises(
        currentPage,
        10,
        0,
        fetchSize,
        searchTerm,
        filterStatus === "ALL" ? "" : filterStatus,
        filterIndustry === "ALL" ? "" : filterIndustry,
        ""
      );

      setEnterprises(res.data?.data?.content || []);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (err) {
      console.error(err);
    }
  }, [currentPage, searchTerm, filterStatus, filterIndustry]);
      const data = res.data?.data?.content || [];
      const potentialStorageMap = getPotentialStorageMap();

      const mergedData = data.map((item) => {
        const enterpriseId = String(item?.id ?? "");
        const hasStoragePotential = Object.prototype.hasOwnProperty.call(
          potentialStorageMap,
          enterpriseId
        );

        if (!hasStoragePotential) return item;

        const potentialFlag = Boolean(potentialStorageMap[enterpriseId]);
        return {
          ...item,
          isPotential: potentialFlag,
          potential: potentialFlag,
          is_potential: potentialFlag,
        };
      });

      const filteredByPotential = mergedData.filter((item) => {
        if (filterPotential === "ALL") return true;
        const potential = isPotentialEnterprise(item);
        return filterPotential === "POTENTIAL" ? potential : !potential;
      });

      setEnterprises(filteredByPotential);
    } catch (err) {
      console.error(err);
    }
  }, [searchTerm, filterStatus, filterIndustry, filterPotential]);

  const fetchIndustries = useCallback(async () => {
    try {
      const res = await getIndustries();
      setIndustries(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadEnterpriseTemplate();

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "enterprise_template.xlsx";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Tải file mẫu thất bại");
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportEnterprises({
        keyword: searchTerm,
        status: filterStatus === "ALL" ? "" : filterStatus,
        industry: filterIndustry === "ALL" ? "" : filterIndustry,
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "enterprises.xlsx";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Xuất file thất bại");
    }
  };

  const handleDeleteEnterprise = async (enterprise) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa doanh nghiệp ${enterprise?.name || "này"}?`
    );
    if (!confirmDelete) return;

    try {
      await deleteEnterprise(enterprise.id);
      toast.success("Xóa doanh nghiệp thành công");
      fetchEnterprises();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Xóa doanh nghiệp thất bại");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchEnterprises();
    fetchIndustries();
  }, [fetchEnterprises]);

  useEffect(() => {
    // eslint-disable-next-line
    setCurrentPage(0);
  }, [searchTerm, filterStatus, filterIndustry]);

  useEffect(() => {
    const delay = setTimeout(fetchEnterprises, 400);
    return () => clearTimeout(delay);
  }, [searchTerm, filterStatus, filterIndustry, filterPotential]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];



  const potentialOptions = [
    { value: "ALL", label: "Tất cả loại" },
    { value: "POTENTIAL", label: "Tiềm năng" },
    { value: "NORMAL", label: "Thông thường" },
  ];

  return (
    <div className="employees-page"> {/* ✅ dùng chung class */}

      <div className="header">
        <h2>Quản lý doanh nghiệp</h2>

        <div className="header-actions" ref={dropdownRef}>

          {/* Autofill fix giống Employee */}
          <input type="text" style={{ position: "absolute", opacity: 0, width: 0 }} />
          <input type="password" style={{ position: "absolute", opacity: 0, width: 0 }} />

          {/* SEARCH */}
          <div className="search-box">
            <svg
              className="icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>

            <input
              type="text"
              placeholder="Tìm tên doanh nghiệp, MST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              readOnly
              onFocus={(e) => e.target.removeAttribute("readonly")}
            />

            {searchTerm && (
              <svg
                className="icon-clear"
                viewBox="0 0 24 24"
                onClick={() => setSearchTerm("")}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </div>

          {/* DROPDOWN - TRẠNG THÁI */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "status" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "status" ? null : "status")
              }
            >
              <span>
                {statusOptions.find((o) => o.value === filterStatus)?.label}
              </span>
              <svg className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`} viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "status" && (
              <div className="dropdown-menu">
                {statusOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterStatus === opt.value ? "selected" : ""}`}
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

          {/* DROPDOWN - NGÀNH */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "industry" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "industry" ? null : "industry")
              }
            >
              <span>
                {industryOptions.find((o) => o.value === filterIndustry)?.label}
              </span>
              <svg className={`icon-chevron ${openDropdown === "industry" ? "open" : ""}`} viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "industry" && (
              <div className="dropdown-menu">

  {/* SEARCH */}
  <div className="dropdown-search">
    <input
      placeholder="Tìm ngành..."
      value={industrySearch}
      onChange={(e) => setIndustrySearch(e.target.value)}
    />
  </div>

  {/* LIST PHẢI BỌC */}
  <div className="dropdown-list">
    {filteredIndustries.map((opt) => (
      <div
        key={opt.value}
        className={`dropdown-item ${
          filterIndustry === opt.value ? "selected" : ""
        }`}
        onClick={() => {
          setFilterIndustry(opt.value);
          setOpenDropdown(null);
          setIndustrySearch("");
        }}
      >
        {opt.label}
      </div>
    ))}
  </div>
</div>
            )}
          </div>

          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "potential" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "potential" ? null : "potential")
              }
            >
              <span>
                {potentialOptions.find((o) => o.value === filterPotential)?.label}
              </span>
              <svg className={`icon-chevron ${openDropdown === "potential" ? "open" : ""}`} viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "potential" && (
              <div className="dropdown-menu">
                {potentialOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterPotential === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterPotential(opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTONS */}


          <button className="add-btn" onClick={() => setOpenImport(true)}>
            Import Excel
          </button>
          <button
            className="add-btn"
            onClick={handleDownloadTemplate}
          >
            Tải file mẫu
          </button>
          <button className="add-btn" onClick={handleExport}>
            Xuất Excel
          </button>
          <button className="add-btn" onClick={() => { setSelectedEnterprise(null); setOpenModal(true) }}>
  Xuất Excel
</button>
          <button className="add-btn" onClick={() => {
            setSelectedEnterprise(null);
            setOpenModal(true);
          }}>
            + Thêm doanh nghiệp
          </button>
        </div>
      </div>

      <div className="table-card">
        <EnterpriseTable
          enterprises={enterprises}
          industries={industries}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEdit={(e) => {
            setSelectedEnterprise(e);
            setOpenModal(true);
          }}
          onView={(e) => {
            setSelectedEnterprise(e);
            setOpenDetail(true);
          }}
          onDelete={handleDeleteEnterprise}
        />
      </div>


      {openModal && (
        <EnterpriseModal
          enterprise={selectedEnterprise}
          close={() => {
            setOpenModal(false);
            setSelectedEnterprise(null);
          }}
          reload={fetchEnterprises}
        />
      )}

      {openDetail && (
        <EnterpriseDetailModal
          enterprise={selectedEnterprise}
          industries={industries}
          reloadEnterprises={fetchEnterprises}
          onEnterpriseUpdated={setSelectedEnterprise}
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
