import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "./Users.scss";

import UserTable from "./UserTable";
import UserModal from "./UserModal";
import UserDrawer from "./UserDrawer";

import { deleteInteraction, getInteractions } from "../../services/interactionService";
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
  const [interactions, setInteractions] = useState([]);
  const [enterprises, setEnterprises] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewingInteraction, setViewingInteraction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");


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

  const handleView = (interaction) => {
    setViewingInteraction(interaction);
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

  const groupedEnterpriseInteractions = useMemo(() => {
    const potentialStorageMap = (() => {
      try {
        const raw = localStorage.getItem(POTENTIAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (error) {
        console.error("Cannot parse potential storage", error);
        return {};
      }
    })();

    const enterprisePotentialById = new Map();
    (enterprises || []).forEach((ent) => {
      enterprisePotentialById.set(String(ent.id), isPotentialEnterprise(ent));
    });

    Object.keys(potentialStorageMap).forEach((id) => {
      enterprisePotentialById.set(String(id), Boolean(potentialStorageMap[id]));
    });

    const groupedMap = new Map();

    interactions.forEach((item) => {
      const enterpriseKey = String(
        item.enterpriseId || item.enterprise?.id || item.enterprise_id || item.enterpriseName || item.id
      );

      if (!groupedMap.has(enterpriseKey)) {
        groupedMap.set(enterpriseKey, {
          enterpriseKey,
          enterpriseId: item.enterpriseId || item.enterprise?.id || null,
          enterpriseName: item.enterpriseName || "-",
          allInteractions: [],
        });
      }

      groupedMap.get(enterpriseKey).allInteractions.push(item);
    });

    const now = Date.now();
    const normalizedRows = [...groupedMap.values()].map((group) => {
      const sortedByDateDesc = [...group.allInteractions].sort((a, b) => {
        const firstTime = getTimeValue(a.interactionTime) || 0;
        const secondTime = getTimeValue(b.interactionTime) || 0;
        return secondTime - firstTime;
      });

      const pastInteractions = sortedByDateDesc.filter((item) => {
        const time = getTimeValue(item.interactionTime);
        return time !== null && time <= now;
      });

      const futureInteractions = sortedByDateDesc
        .filter((item) => {
          const time = getTimeValue(item.interactionTime);
          return time !== null && time > now;
        })
        .sort((a, b) => {
          const firstTime = getTimeValue(a.interactionTime) || 0;
          const secondTime = getTimeValue(b.interactionTime) || 0;
          return firstTime - secondTime;
        });

      const latestCompletedInteraction = pastInteractions[0] || null;
      const latestInteraction =
        latestCompletedInteraction ||
        futureInteractions[0] ||
        sortedByDateDesc[0] ||
        null;

      const requiresFutureSchedule =
        latestCompletedInteraction?.result === "PENDING" && futureInteractions.length === 0;

      return {
        id: group.enterpriseId || latestInteraction?.id || group.enterpriseKey,
        enterpriseId: group.enterpriseId,
        enterpriseName: group.enterpriseName,
        isPotential: enterprisePotentialById.get(String(group.enterpriseId)) || false,
        consultantName: latestInteraction?.consultantName || "-",
        interactionCount: sortedByDateDesc.length,
        latestInteractionDate: latestInteraction?.interactionTime || null,
        nextFutureDate: futureInteractions[0]?.interactionTime || null,
        futureCount: futureInteractions.length,
        latestStatus: latestInteraction?.result || null,
        requiresFutureSchedule,
        latestContent: sanitizeInteractionContent(latestInteraction?.description),
        latestInteractionRecord: latestInteraction,
        allInteractions: sortedByDateDesc,
      };
    });

    const term = searchTerm.trim().toLowerCase();
    const filteredRows = normalizedRows.filter((item) => {
      if (!term) return true;

      const contactNames = (item.allInteractions || [])
        .map((it) => (it.contactName || "").toLowerCase())
        .join(" ");

      return (
        (item.enterpriseName || "").toLowerCase().includes(term) ||
        (item.consultantName || "").toLowerCase().includes(term) ||
        (item.latestContent || "").toLowerCase().includes(term) ||
        contactNames.includes(term)
      );
    });

    return filteredRows.sort((a, b) => {
      const firstTime = getTimeValue(a.latestInteractionDate) || 0;
      const secondTime = getTimeValue(b.latestInteractionDate) || 0;
      return secondTime - firstTime;
    });
  }, [interactions, searchTerm, enterprises]);

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

          <button type="button" className="add-btn" onClick={handleCreate}>
            + Thêm tiếp xúc
          </button>
        </div>
      </div>

      <div className="table-card">
        <UserTable
          interactions={groupedEnterpriseInteractions}
          onView={handleView}
          onDeleteEnterprise={handleDeleteEnterprise}
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
        onReload={fetchInteractions}
      />

    </div>
  );
}

export default Users;
