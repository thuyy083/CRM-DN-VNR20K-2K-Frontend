import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "./Services.scss";
import { getServices, deleteService } from "../../services/servicesService";
import ServiceTable from "./ServiceTable";
import ServiceModal from "./ServiceModal";

function Services() {
  const currentUser = useSelector((state) => state.auth.user);
  const [services, setServices] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const getNormalizedRole = (user) => {
    const directRole = user?.role || user?.roleName;
    if (typeof directRole === "string" && directRole.trim()) {
      return directRole.trim().toUpperCase();
    }

    const firstRole = user?.roles?.[0];
    if (typeof firstRole === "string" && firstRole.trim()) {
      return firstRole.trim().toUpperCase();
    }
    if (firstRole?.name && typeof firstRole.name === "string") {
      return firstRole.name.trim().toUpperCase();
    }

    return "";
  };

  const currentUserRole = getNormalizedRole(currentUser);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setOpenDropdown(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await getServices();
      setServices(res.data?.data?.content || res.data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleEdit = (service) => {
    setSelectedService(service);
    setOpenModal(true);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setOpenModal(true);
  };

  // ĐÃ SỬA: Xóa bỏ dòng `if (window.confirm(...))`
  const handleDelete = async (id) => {
    try {
      await deleteService(id);
      toast.success("Đã xóa dịch vụ thành công!");
      fetchServices();
    } catch (error) {
      toast.error("Lỗi khi xóa dịch vụ!");
    }
  };

  // ĐÃ SỬA: Sửa lỗi lọc trạng thái và tối ưu tìm kiếm
  const filteredServices = services.filter((srv) => {
    const term = searchTerm.toLowerCase();

    // 1. Lấy dữ liệu an toàn (hỗ trợ cả snake_case và camelCase từ API)
    const code = srv.service_code || srv.serviceCode || "";
    const name = srv.service_name || srv.serviceName || "";
    const status = srv.is_active ?? srv.isActive ?? false;

    // 2. Lọc theo text search
    const matchSearch =
      code.toLowerCase().includes(term) || name.toLowerCase().includes(term);

    // 3. Lọc theo trạng thái
    let matchStatus = true;
    if (filterStatus === "ACTIVE") {
      matchStatus = status === true || String(status) === "true";
    }
    if (filterStatus === "INACTIVE") {
      matchStatus = status === false || String(status) === "false";
    }

    return matchSearch && matchStatus;
  });

  const statusOptions = [
    { value: "ALL", label: "Tất cả tình trạng" },
    { value: "ACTIVE", label: "Đang bán" },
    { value: "INACTIVE", label: "Ngừng cung cấp" },
  ];

  return (
    <div className="services-page">
      <div className="header">
        <h2>Quản lý dịch vụ</h2>

        <div className="header-actions" ref={dropdownRef}>
          <input
            type="text"
            style={{ position: "absolute", opacity: 0, width: 0, zIndex: -1 }}
            tabIndex="-1"
          />

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
              autoComplete="off"
              placeholder="Tìm mã, tên dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              readOnly={true}
              onFocus={(e) => e.target.removeAttribute("readonly")}
            />
            {searchTerm && (
              <svg
                className="icon-clear"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                onClick={() => setSearchTerm("")}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </div>

          {/* ĐÃ SỬA: Xóa Dropdown Filter Category ở đây */}

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
              <svg
                className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            {openDropdown === "status" && (
              <div className="dropdown-menu">
                {statusOptions.map((o) => (
                  <div
                    key={o.value}
                    className={`dropdown-item ${filterStatus === o.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterStatus(o.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentUserRole === "ADMIN" && (
            <button className="add-btn" onClick={handleCreate}>
              + Thêm dịch vụ
            </button>
          )}
        </div>
      </div>

      <div className="table-card">
        <ServiceTable
          services={filteredServices}
          currentUserRole={currentUserRole}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {openModal && (
        <ServiceModal
          services={
            services
          } /* TRUYỀN DANH SÁCH DỊCH VỤ ĐỂ MODAL DÒ TRÙNG MÃ */
          service={selectedService}
          close={() => setOpenModal(false)}
          reload={fetchServices}
        />
      )}
    </div>
  );
}

export default Services;
