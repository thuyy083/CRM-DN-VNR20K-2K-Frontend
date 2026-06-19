import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./Users.scss";

import UserTable from "./UserTable";
import UserModal from "./UserModal";
import UserDrawer from "./UserDrawer";

import { deleteInteraction, getAllInteractions, getEnterpriseInteractionSummary, getInteractions } from "../../services/interactionService";
import * as XLSX from "xlsx";
import { deleteContact, deleteEnterprise, getEnterprises } from "../../services/enterpriseService";
import { getContactsByEnterprise } from "../../services/enterpriseContactService";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

const getListFromResponse = (res) => {
 
  if (Array.isArray(res?.data?.data?.content)) return res.data.data.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const getTimeValue = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const sanitizeInteractionContent = (value) => {
  if (!value) return "-";
  const cleaned = String(value).replace(/\s*Chức\s*vụ[^:]*:\s*.*$/iu, "").trim();
  return cleaned || "-";
};

const getErrorMessage = (error, fallback = "Không thể xóa doanh nghiệp") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
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

function Users() {
  // Dữ liệu bảng chính — danh sách doanh nghiệp (server-side pagination)
  const [enterpriseSummaries, setEnterpriseSummaries] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed (giống BE)
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  // Lưu toàn bộ interactions riêng cho export Excel
  const [allInteractionsForExport, setAllInteractionsForExport] = useState([]);

  // Dữ liệu doanh nghiệp dùng cho form thêm tiếp xúc
  const [enterprises, setEnterprises] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewingInteraction, setViewingInteraction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Fetch trang hiện tại (server-side pagination) ---
  const fetchPage = useCallback(async (page = 0) => {
    try {
      setIsLoading(true);
      const res = await getEnterpriseInteractionSummary({ page, size: PAGE_SIZE });
      const data = res?.data?.data || res?.data || {};
      setEnterpriseSummaries(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách tiếp xúc");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload trang hiện tại (sau khi thêm/sửa/xóa)
  const reloadCurrentPage = useCallback(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  const fetchEnterprises = useCallback(async () => {
    try {
      const res = await getEnterprises(0, 200);
      setEnterprises(getListFromResponse(res));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreate = () => {
    setSelectedInteraction(null);
    setOpenModal(true);
  };

  const TYPE_MAP = {
    PHONE_CALL: "Gọi điện",
    SEND_MAIL: "Gửi Mail",
    EMAIL_QUOTE: "Gửi báo giá",
    ONLINE_MEETING: "Họp online",
    OFFLINE_MEETING: "Gặp trực tiếp",
    DEMO: "Demo sản phẩm",
    CONTRACT_SIGNING: "Ký hợp đồng",
    CUSTOMER_SUPPORT: "Hỗ trợ khách hàng",
    OTHER: "Khác",
  };

  const RESULT_MAP_EXPORT = {
    PENDING: "Chờ xử lý",
    NEED_FOLLOW_UP: "Cần chăm sóc",
    NEXT_APPOINTMENT: "Hẹn lần sau",
    INTERESTED: "Tiềm năng",
    IN_PROGRESS: "Đang thương thảo",
    CLOSED_WON: "Ký hợp đồng",
    CLOSED_LOST: "Thất bại",
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang tải dữ liệu để xuất...");
      const allItems = await getAllInteractions();
      setAllInteractionsForExport(allItems);

      if (!allItems || allItems.length === 0) {
        toast.warning("Không có dữ liệu để xuất!");
        return;
      }

      // Gom nhóm tiếp xúc theo doanh nghiệp
      const groupedMap = new Map();
      allItems.forEach((item) => {
        const entId = item.enterpriseId || item.enterpriseName;
        if (!groupedMap.has(entId)) {
          groupedMap.set(entId, {
            enterpriseName: item.enterpriseName || "-",
            interactions: []
          });
        }
        groupedMap.get(entId).interactions.push(item);
      });

      const rows = [];
      let index = 1;

      // Xử lý từng doanh nghiệp
      Array.from(groupedMap.values()).forEach((group) => {
        // Sắp xếp các lần tiếp xúc mới nhất lên đầu
        const sortedInteractions = group.interactions.sort((a, b) => {
          const ta = new Date(a.interactionTime).getTime() || 0;
          const tb = new Date(b.interactionTime).getTime() || 0;
          return tb - ta;
        });

        const latest = sortedInteractions[0];

        // Format cột Lịch sử tiếp xúc
        const historyLines = sortedInteractions.map(item => {
          const time = item.interactionTime
            ? new Date(item.interactionTime).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "-";
          const type = TYPE_MAP[item.interactionType] || item.interactionType || "-";
          const contact = item.contactName || "-";
          const content = sanitizeInteractionContent(item.description);
          
          return `[${time}] ${type} | LH: ${contact} | ND: ${content}`;
        });

        rows.push({
          "STT": index++,
          "Doanh nghiệp": group.enterpriseName,
          "Tổng số lần": sortedInteractions.length,
          "Nhân viên phụ trách": latest?.consultantName || "-",
          "Kết quả gần nhất": RESULT_MAP_EXPORT[latest?.result] || latest?.result || "-",
          "Lịch sử tiếp xúc": historyLines.join("\n\n") // Nối bằng xuống dòng
        });
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      // Căn chỉnh độ rộng cột
      const colWidths = [
        { wch: 6 },   // STT
        { wch: 40 },  // Doanh nghiệp
        { wch: 15 },  // Tổng số lần
        { wch: 25 },  // Nhân viên phụ trách
        { wch: 20 },  // Kết quả gần nhất
        { wch: 120 }, // Lịch sử tiếp xúc (rất dài)
      ];
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tổng hợp tiếp xúc");

      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getFullYear()}`;
      XLSX.writeFile(wb, `TongHop_TiepXuc_${dateStr}.xlsx`);
      
      toast.success(`Đã xuất ${rows.length} doanh nghiệp!`);
    } catch (err) {
      console.error(err);
      toast.error("Xuất file thất bại!");
    }
  };

  const handleView = (item) => {
    // Khi click Xem chi tiết, truyền enterpriseId để UserDrawer tự load interactions
    setViewingInteraction(item);
    setOpenDrawer(true);
  };

  const handleDeleteEnterprise = async (interaction) => {
    const enterpriseId = interaction?.enterpriseId;

    if (!enterpriseId) {
      toast.error("Không tìm thấy doanh nghiệp để xóa");
      return;
    }

    const isConfirmed = window.confirm(
      `Bạn có chắc muốn xóa doanh nghiệp ${interaction.enterpriseName || "này"}?`
    );
    if (!isConfirmed) return;

    try {
      await deleteEnterprise(enterpriseId);
      toast.success("Xóa doanh nghiệp thành công");
      await Promise.all([fetchInteractions(), fetchEnterprises()]);
    } catch (error) {
      console.error(error);

      try {
        const relatedInteractionIds = [];
        let page = 0;
        const size = 200;

        while (true) {
          const response = await getInteractions({ page, size, enterpriseId });
          const batch = getListFromResponse(response);

          relatedInteractionIds.push(
            ...batch.map((item) => item?.id).filter((id) => id !== null && id !== undefined)
          );

          if (batch.length < size) break;
          page += 1;
        }

        if (relatedInteractionIds.length > 0) {
          await Promise.allSettled(relatedInteractionIds.map((id) => deleteInteraction(id)));
        }

        const relatedContacts = await getContactsByEnterprise(enterpriseId);
        if (relatedContacts.length > 0) {
          await Promise.allSettled(
            relatedContacts
              .map((contact) => contact?.id)
              .filter((id) => id !== null && id !== undefined)
              .map((contactId) => deleteContact(enterpriseId, contactId))
          );
        }

        await deleteEnterprise(enterpriseId);
        toast.success("Xóa doanh nghiệp thành công");
        await Promise.all([fetchInteractions(), fetchEnterprises()]);
      } catch (fallbackError) {
        console.error(fallbackError);
        toast.error(getErrorMessage(fallbackError));
      }
    }
  };

  return (
    <div className="users-page">
      <div className="header">
        <h2>Quản lý tiếp xúc</h2>

        <div className="header-actions">
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
              placeholder="Tìm doanh nghiệp, nhân viên, người liên hệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button type="button" className="export-excel-btn" onClick={handleExportExcel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Xuất Excel
          </button>

          <button type="button" className="add-btn" onClick={handleCreate}>
            + Thêm tiếp xúc
          </button>
        </div>
      </div>

      <div className="table-card">
        <UserTable
          interactions={enterpriseSummaries}
          onView={handleView}
          onDeleteEnterprise={handleDeleteEnterprise}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {openModal && (
        <UserModal
          interaction={selectedInteraction}
          enterprises={enterprises}
          close={() => setOpenModal(false)}
          reload={reloadCurrentPage}
        />
      )}

      <UserDrawer
        open={openDrawer}
        interaction={viewingInteraction}
        onClose={() => setOpenDrawer(false)}
        onReload={reloadCurrentPage}
      />

    </div>
  );
}

export default Users;
