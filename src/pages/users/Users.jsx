import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "./Users.scss";

import UserTable from "./UserTable";
import UserModal from "./UserModal";
import UserDrawer from "./UserDrawer";

import { getInteractions, deleteInteraction } from "../../services/interactionService";
import { getEnterprises } from "../../services/enterpriseService";

const typeOptions = [
  { value: "ALL", label: "Tất cả loại" },
  { value: "PHONE_CALL", label: "Gọi điện" },
  { value: "OFFLINE_MEETING", label: "Gặp mặt" },
  { value: "EMAIL_QUOTE", label: "Email" },
  { value: "DEMO", label: "Thăm quan" },
  { value: "ONLINE_MEETING", label: "Họp online" },
  { value: "CONTRACT_SIGNING", label: "Ký hợp đồng" },
  { value: "CUSTOMER_SUPPORT", label: "Hỗ trợ khách hàng" },
  { value: "OTHER", label: "Khác" },
];

const resultOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Đang xử lý" },
  { value: "NEED_FOLLOW_UP", label: "Cần theo dõi" },
  { value: "SUCCESSFUL", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
];

const getListFromResponse = (res) => {
 
  if (Array.isArray(res?.data?.data?.content)) return res.data.data.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

function Users() {
  const [interactions, setInteractions] = useState([]);
  const [enterprises, setEnterprises] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewingInteraction, setViewingInteraction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterResult, setFilterResult] = useState("ALL");

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
   
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInteractions = useCallback(async () => {
    try {
      // Tải danh sách tiếp xúc 
      const res = await getInteractions({ page: 0, size: 200 });
      setInteractions(getListFromResponse(res));
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách tiếp xúc");
    }
  }, []);

  const fetchEnterprises = useCallback(async () => {
    try {
      // Tải danh sách doanh nghiệp 
      const res = await getEnterprises(0, 200);
      setEnterprises(getListFromResponse(res));
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách doanh nghiệp");
    }
  }, []);

  useEffect(() => {
    fetchInteractions();
    fetchEnterprises();
  }, [fetchInteractions, fetchEnterprises]);

  const handleCreate = () => {
    setSelectedInteraction(null);
    setOpenModal(true);
  };

  const handleEdit = (interaction) => {
    setSelectedInteraction(interaction);
    setOpenModal(true);
  };

  const handleView = (interaction) => {
    setViewingInteraction(interaction);
    setOpenDrawer(true);
  };

  const handleDelete = async (interaction) => {
    try {
      await deleteInteraction(interaction.id);
      toast.success("Xóa tiếp xúc thành công");
      await fetchInteractions();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const filteredInteractions = useMemo(() => {
    //  tìm kiếm + filter 
    return interactions.filter((item) => {
      const term = searchTerm.trim().toLowerCase();

      const contactName = (item.contactName || "").toLowerCase();
      const enterpriseName = (item.enterpriseName || "").toLowerCase();
      const consultantName = (item.consultantName || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const phone = (item.contactPhone || item.phone || "").toLowerCase();

      const matchesSearch =
        !term ||
        contactName.includes(term) ||
        enterpriseName.includes(term) ||
        consultantName.includes(term) ||
        description.includes(term) ||
        location.includes(term) ||
        phone.includes(term);

      const matchesType = filterType === "ALL" || item.interactionType === filterType;
      const matchesResult = filterResult === "ALL" || item.result === filterResult;

      return matchesSearch && matchesType && matchesResult;
    });
  }, [interactions, searchTerm, filterType, filterResult]);

  return (
    <div className="users-page">
      <div className="header">
        <h2>Quản lý tiếp xúc</h2>

        <div className="header-actions" ref={dropdownRef}>
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
              placeholder="Tìm doanh nghiệp, liên hệ, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "type" ? "active" : ""}`}
              onClick={() => setOpenDropdown(openDropdown === "type" ? null : "type")}
            >
              <span>{typeOptions.find((opt) => opt.value === filterType)?.label}</span>
              <svg
                className={`icon-chevron ${openDropdown === "type" ? "open" : ""}`}
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

            {openDropdown === "type" && (
              <div className="dropdown-menu">
                {typeOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterType === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterType(opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "status" ? "active" : ""}`}
              onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
            >
              <span>{resultOptions.find((opt) => opt.value === filterResult)?.label}</span>
              <svg
                className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`}
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
                {resultOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterResult === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterResult(opt.value);
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
            + Thêm tiếp xúc
          </button>
        </div>
      </div>

      <div className="table-card">
        <UserTable
          interactions={filteredInteractions}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {openModal && (
        <UserModal
          interaction={selectedInteraction}
          enterprises={enterprises}
          close={() => setOpenModal(false)}
          reload={fetchInteractions}
        />
      )}

      <UserDrawer
        open={openDrawer}
        interaction={viewingInteraction}
        onClose={() => setOpenDrawer(false)}
      />
    </div>
  );
}

export default Users;
