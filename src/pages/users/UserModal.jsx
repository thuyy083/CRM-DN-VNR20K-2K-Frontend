import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "./UserModal.scss";

import { createContact, getContactsByEnterprise } from "../../services/enterpriseContactService";
import { createInteraction, updateInteraction } from "../../services/interactionService";

const getEnterpriseId = (enterprise) =>
  enterprise?.id ?? enterprise?.enterpriseId ?? enterprise?.enterprise_id ?? "";

const getEnterpriseName = (enterprise) =>
  enterprise?.name ?? enterprise?.enterpriseName ?? enterprise?.enterprise_name ?? "";

// Hỗ trợ  API để tránh lỗi 
const getContactId = (contact) => contact?.id ?? contact?.contactId ?? contact?.contact_id ?? "";

const getContactName = (contact) =>
  contact?.fullName ?? contact?.full_name ?? contact?.contactName ?? contact?.contact_name ?? "";

const typeOptions = [
  { value: "PHONE_CALL", label: "Gọi điện" },
  { value: "EMAIL_QUOTE", label: "Gửi báo giá" },
  { value: "ONLINE_MEETING", label: "Họp online" },
  { value: "OFFLINE_MEETING", label: "Gặp trực tiếp" },
  { value: "DEMO", label: "Demo sản phẩm" },
  { value: "CONTRACT_SIGNING", label: "Ký hợp đồng" },
  { value: "CUSTOMER_SUPPORT", label: "Hỗ trợ khách hàng" },
  { value: "OTHER", label: "Khác" },
];


const sanitizeInteractionContent = (value) => {
  if (!value) return "";
  return String(value).replace(/\s*Chức\s*vụ[^:]*:\s*.*$/giu, "").trim();
};

/**
 * Chuyển giá trị thời gian sang format YYYY-MM-DDTHH:mm cho input datetime-local.
 * Xử lý được 2 format backend trả về:
 *   - ISO string: "2026-04-16T02:00:00Z" → "2026-04-16T09:00" (UTC+7)
 *   - dd/MM/yyyy HH:mm: "16/04/2026 09:00" (do @JsonFormat backend)
 */
const toDateTimeLocal = (value) => {
  if (!value) return "";

  // Thử parse format "dd/MM/yyyy HH:mm" từ backend @JsonFormat
  const ddMMyyyyMatch = String(value).match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  );
  if (ddMMyyyyMatch) {
    const [, day, month, year, hour, minute] = ddMMyyyyMatch;
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  // Fallback: parse ISO string, chuyển sang giờ local
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Chuyển giá trị từ input datetime-local (YYYY-MM-DDTHH:mm) sang ISO string.
 * Cách dùng: new Date(value) với giá trị datetime-local sẽ dùng timezone local.
 */
const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

function UserModal({ interaction, enterprises, close, reload }) {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showCreateContactForm, setShowCreateContactForm] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [createContactErrors, setCreateContactErrors] = useState({});
  const [errors, setErrors] = useState({});

  const [openEnterpriseDropdown, setOpenEnterpriseDropdown] = useState(false);
  const [searchEnterprise, setSearchEnterprise] = useState("");
  const enterpriseDropdownRef = useRef(null);

  const noContactToastEnterpriseRef = useRef("");

  const [contactForm, setContactForm] = useState({
    fullName: "",
    position: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

  const [form, setForm] = useState({
    enterpriseId: interaction?.enterpriseId ? String(interaction.enterpriseId) : "",
    contactId: interaction?.contactId ? String(interaction.contactId) : "",
    contactPosition: "",
    interactionType: interaction?.interactionType || "PHONE_CALL",
    interactionTime: toDateTimeLocal(interaction?.interactionTime),
    futureInteractionDate: "",
    location: interaction?.location || "",
    description: sanitizeInteractionContent(interaction?.description || ""),
  });

  const selectedEnterprise = useMemo(() => {
    return enterprises.find(
      (e) => getEnterpriseId(e) === form.enterpriseId
    );
  }, [enterprises, form.enterpriseId]);
  const selectedEnterpriseName = (getEnterpriseName(selectedEnterprise) || "").trim().toLowerCase();
  const isViettelEnterprise =
    selectedEnterpriseName === "vt" || selectedEnterpriseName.includes("viettel");
  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((e) =>
      (getEnterpriseName(e) || "")
        .toLowerCase()
        .includes(searchEnterprise.toLowerCase())
    );
  }, [enterprises, searchEnterprise]);



  useEffect(() => {
    const run = async () => {
      if (!form.enterpriseId) {
        setContacts([]);
        noContactToastEnterpriseRef.current = "";
        return;
      }

      setLoadingContacts(true);
      try {

        const list = await getContactsByEnterprise(form.enterpriseId);
        setContacts(list);

        if (list.length === 0) {
          if (noContactToastEnterpriseRef.current !== String(form.enterpriseId)) {
            toast.warning("Doanh nghiệp chưa có người liên hệ");
            noContactToastEnterpriseRef.current = String(form.enterpriseId);
          }
        } else {
          noContactToastEnterpriseRef.current = "";
        }

        if (form.contactId) {
          // Khi mở form edit, đồng bộ lại chức vụ từ contact đang chọn (nếu có).
          const selected = list.find(
            (contact) => String(getContactId(contact)) === String(form.contactId)
          );
          handleChange("contactPosition", selected?.position || "");
        }
      } catch (error) {
        console.error(error);
        setContacts([]);
        noContactToastEnterpriseRef.current = "";
        toast.error("Không tải được danh bạ liên hệ");
      } finally {
        setLoadingContacts(false);
      }
    };

    run();
  }, [form.enterpriseId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        enterpriseDropdownRef.current &&
        !enterpriseDropdownRef.current.contains(event.target)
      ) {
        setOpenEnterpriseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      form.enterpriseId &&
      !loadingContacts &&
      contacts.length === 0 &&
      !isViettelEnterprise
    ) {
      setShowCreateContactForm(true);
    }
  }, [interaction, form.enterpriseId, loadingContacts, contacts.length, isViettelEnterprise]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleContactFormChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    if (createContactErrors[field]) {
      setCreateContactErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateContactForm = () => {
    const nextErrors = {};

    if (!contactForm.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên người liên hệ";
    }

    if (!contactForm.position.trim()) {
      nextErrors.position = "Vui lòng nhập chức vụ";
    }

    if (!contactForm.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    }

    if (contactForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (contactForm.phone.trim() && !/^[0-9+\s-]{8,20}$/.test(contactForm.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }

    setCreateContactErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
    };
  };

  const handleCreateContact = async () => {
    if (!form.enterpriseId) {
      toast.error("Vui lòng chọn doanh nghiệp trước khi tạo người liên hệ");
      return;
    }

    const { isValid, nextErrors } = validateContactForm();
    if (!isValid) {
      if (nextErrors.phone === "Vui lòng nhập số điện thoại") {
        toast.error("Vui lòng nhập số điện thoại");
      }
      // if (nextErrors.email === "Không có gmail") {
      //   toast.error("Không có gmail");
      // }
      return;
    }

    setCreatingContact(true);
    try {
      const payload = {
        fullName: contactForm.fullName.trim(),
        position: contactForm.position.trim() || "",
        email: contactForm.email.trim() || "",
        phone: contactForm.phone.trim() || "",
        isPrimary: Boolean(contactForm.isPrimary),
      };

      const created = await createContact(form.enterpriseId, payload);
      const latestContacts = await getContactsByEnterprise(form.enterpriseId);
      setContacts(latestContacts);

      const createdId = String(getContactId(created));
      if (createdId) {
        handleChange("contactId", createdId);
        const selected = latestContacts.find(
          (contact) => String(getContactId(contact)) === createdId
        );
        handleChange("contactPosition", selected?.position || payload.position || "");
      }

      setContactForm({
        fullName: "",
        position: "",
        email: "",
        phone: "",
        isPrimary: false,
      });
      setCreateContactErrors({});
      toast.success("Tạo người liên hệ thành công");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setCreatingContact(false);
    }
  };

  const validate = () => {

    const nextErrors = {};

    if (!form.enterpriseId) nextErrors.enterpriseId = "Vui lòng chọn doanh nghiệp";
    if (!form.interactionType) nextErrors.interactionType = "Vui lòng chọn loại tiếp xúc";
    if (!form.interactionTime) nextErrors.interactionTime = "Vui lòng chọn ngày tiếp xúc";

    if (interaction && form.futureInteractionDate && form.interactionTime) {
      const currentDate = new Date(`${form.interactionTime}T00:00:00`).getTime();
      const futureDate = new Date(`${form.futureInteractionDate}T00:00:00`).getTime();
      if (!Number.isNaN(currentDate) && !Number.isNaN(futureDate) && futureDate <= currentDate) {
        nextErrors.futureInteractionDate = "Ngày tương lai phải lớn hơn ngày tiếp xúc";
      }
    }
    if (!form.description.trim()) {
      nextErrors.description = "Vui lòng nhập nội dung trao đổi";
    }
    if (form.location && form.location.trim().length > 255) {
      nextErrors.location = "Địa điểm tối đa 255 ký tự";
    }
    if (form.description && form.description.trim().length > 20000) {
      nextErrors.description = "Nội dung tối đa 20000 ký tự";
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
    };
  };



  const handleSubmit = async () => {
    const { isValid, nextErrors } = validate();
    if (!isValid) {
      if (nextErrors.enterpriseId) {
        toast.error(nextErrors.enterpriseId);
      }
      if (nextErrors.interactionType) {
        toast.error(nextErrors.interactionType);
      }
      if (nextErrors.interactionTime) {
        toast.error(nextErrors.interactionTime);
      }
      if (nextErrors.futureInteractionDate) {
        toast.error(nextErrors.futureInteractionDate);
      }
      if (nextErrors.location) {
        toast.error(nextErrors.location);
      }
      if (nextErrors.description) {
        toast.error(nextErrors.description);
      }
      return;
    }

    //  tạo mới và cập nhật.
    const basePayload = {
      enterpriseId: Number(form.enterpriseId),
      contactId: form.contactId ? Number(form.contactId) : null,
      interactionType: form.interactionType,
      interactionTime: toIsoDate(form.interactionTime),
      location: form.location?.trim() || null,
      description: sanitizeInteractionContent(form.description) || null,
    };

    try {
      if (interaction) {
        await updateInteraction(interaction.id, basePayload);

        if (form.futureInteractionDate) {
          await createInteraction({
            enterpriseId: Number(interaction.enterpriseId || form.enterpriseId),
            contactId: form.contactId ? Number(form.contactId) : interaction.contactId ?? null,
            interactionType: form.interactionType,
            interactionTime: toIsoDate(form.futureInteractionDate),
            location: form.location.trim() || null,
            description: sanitizeInteractionContent(form.description) || null,
          });
        }

        toast.success("Cập nhật tiếp xúc thành công");
      } else {

        await createInteraction(basePayload);
        toast.success("Thêm tiếp xúc thành công");
      }

      await reload();
      close();
    } catch (error) {
      console.error(error);
      const responseData = error?.response?.data;

      if (responseData?.errors && !Array.isArray(responseData.errors)) {
        setErrors(responseData.errors);
      } else if (Array.isArray(responseData?.errors)) {
        const backendErrors = {};
        responseData.errors.forEach((err) => {
          if (err?.field) {
            backendErrors[err.field] = err.message;
          }
        });
        setErrors(backendErrors);
      }

      // Đồng bộ toast lỗi chung với các module khác (đã có ToastContainer ở main.jsx)
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="modal" onClick={close}>
      <div className="modal-box users-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{interaction ? "Cập nhật tiếp xúc" : "Thêm tiếp xúc"}</h3>

        <div className="section-title">Thông tin tiếp xúc</div>
        {!interaction && enterprises.length === 0 && (
          <p className="form-hint-warning">
            Chưa có doanh nghiệp trong hệ thống. Hãy tạo doanh nghiệp trước khi thêm tiếp xúc.
          </p>
        )}

        <div className="form-grid">
          <div className="form-group" ref={enterpriseDropdownRef}>
            <label>
              Doanh nghiệp <span className="required">*</span>
            </label>

            <div
              className={`select-box ${openEnterpriseDropdown ? "active" : ""} ${errors.enterpriseId ? "input-error" : ""
                }`}
              onClick={() => !interaction && setOpenEnterpriseDropdown(!openEnterpriseDropdown)}
            >
              <span className={form.enterpriseId ? "selected" : "placeholder"}>
                {selectedEnterprise
                  ? getEnterpriseName(selectedEnterprise)
                  : "Chọn doanh nghiệp"}
              </span>

              <svg
                className={`icon ${openEnterpriseDropdown ? "open" : ""}`}
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {openEnterpriseDropdown && !interaction && (
              <div className="select-dropdown">
                <input
                  className="search"
                  placeholder="Tìm doanh nghiệp..."
                  value={searchEnterprise}
                  onChange={(e) => setSearchEnterprise(e.target.value)}
                />

                <div className="options">
                  {filteredEnterprises.map((enterprise) => (
                    <div
                      key={getEnterpriseId(enterprise)}
                      className={`option ${String(form.enterpriseId) === String(getEnterpriseId(enterprise))
                        ? "selected"
                        : ""
                        }`}
                      onClick={() => {
                        handleChange("enterpriseId", getEnterpriseId(enterprise));

                        // reset giống code cũ
                        handleChange("contactId", "");
                        handleChange("contactPosition", "");
                        noContactToastEnterpriseRef.current = "";
                        setShowCreateContactForm(false);
                        setContactForm({
                          fullName: "",
                          position: "",
                          email: "",
                          phone: "",
                          isPrimary: false,
                        });
                        setCreateContactErrors({});

                        setOpenEnterpriseDropdown(false);
                      }}
                    >
                      {getEnterpriseName(enterprise)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.enterpriseId && (
              <span className="error-text">{errors.enterpriseId}</span>
            )}

            {form.enterpriseId &&
              !loadingContacts &&
              contacts.length === 0 &&
              isViettelEnterprise && (
                <span className="error-text">
                  Doanh nghiệp này chưa có người liên hệ. Hãy tạo liên hệ trước khi gắn vào tiếp xúc.
                </span>
              )}
          </div>

          <div className="form-group">
            <label>Người liên hệ</label>
            <select
              value={form.contactId}
              onChange={(e) => {
                const selectedContactId = e.target.value;
                handleChange("contactId", selectedContactId);

                const selected = contacts.find(
                  (contact) => String(getContactId(contact)) === String(selectedContactId)
                );
                handleChange("contactPosition", selected?.position || "");
              }}
              disabled={!form.enterpriseId || loadingContacts}
            >
              <option value="">{loadingContacts ? "Đang tải..." : "Chọn người liên hệ"}</option>
              {contacts.map((contact) => (
                <option key={getContactId(contact)} value={getContactId(contact)}>
                  {getContactName(contact)}
                </option>
              ))}
            </select>

            {form.enterpriseId && !loadingContacts && !isViettelEnterprise && (
              <button
                type="button"
                className="link-add-contact-btn"
                onClick={() => setShowCreateContactForm((prev) => !prev)}
              >
                {showCreateContactForm ? "Ẩn form thêm người liên hệ" : "+ Thêm người liên hệ"}
              </button>
            )}
          </div>

          {form.enterpriseId && !loadingContacts && showCreateContactForm && !isViettelEnterprise && (
            <div className="form-group full-width contact-inline-module">
              <div className="contact-inline-header">
                <strong>Thêm nhanh người liên hệ</strong>
                <span>
                  {contacts.length === 0
                    ? "Doanh nghiệp này chưa có người liên hệ. Tạo mới ngay tại đây."
                    : "Bạn có thể thêm nhiều người liên hệ cho cùng doanh nghiệp ngay tại đây."}
                </span>
              </div>

              <div className="contact-inline-grid">
                <div className="form-group">
                  <label>
                    Họ tên <span className="required">*</span>
                  </label>
                  <input
                    className={createContactErrors.fullName ? "input-error" : ""}
                    value={contactForm.fullName}
                    onChange={(e) => handleContactFormChange("fullName", e.target.value)}
                    placeholder="VD: Nguyễn Văn F"
                  />
                  {createContactErrors.fullName && (
                    <span className="error-text">{createContactErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Chức vụ</label>
                  <input
                    className={createContactErrors.position ? "input-error" : ""}
                    value={contactForm.position}
                    onChange={(e) => handleContactFormChange("position", e.target.value)}
                    placeholder="VD: Nhân viên"
                  />
                  {createContactErrors.position && (
                    <span className="error-text">{createContactErrors.position}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    className={createContactErrors.email ? "input-error" : ""}
                    value={contactForm.email}
                    onChange={(e) => handleContactFormChange("email", e.target.value)}
                    placeholder="VD: nguyenvanF@gmail.com"
                  />
                  {createContactErrors.email && (
                    <span className="error-text">{createContactErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    className={createContactErrors.phone ? "input-error" : ""}
                    value={contactForm.phone}
                    onChange={(e) => handleContactFormChange("phone", e.target.value)}
                    placeholder="VD: 0987654321"
                  />
                  {createContactErrors.phone && (
                    <span className="error-text">{createContactErrors.phone}</span>
                  )}
                </div>
              </div>

              <label className="inline-checkbox">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(e) => handleContactFormChange("isPrimary", e.target.checked)}
                />
                Người liên hệ chính
              </label>

              <div className="contact-inline-actions">
                <button
                  type="button"
                  className="cancel-inline-btn"
                  onClick={() => {
                    setShowCreateContactForm(false);
                    setContactForm({
                      fullName: "",
                      position: "",
                      email: "",
                      phone: "",
                      isPrimary: false,
                    });
                    setCreateContactErrors({});
                  }}
                  disabled={creatingContact}
                >
                  Đóng form
                </button>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleCreateContact}
                  disabled={creatingContact}
                >
                  {creatingContact ? "Đang tạo..." : "Tạo người liên hệ"}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Chức vụ người liên hệ</label>
            <input
              readOnly
              value={form.contactPosition}
              // onChange={(e) => handleChange("contactPosition", e.target.value)}
              placeholder="VD: Giám đốc, Kế toán..."
            />
          </div>

          <div className="form-group">
            <label>
              Loại tiếp xúc <span className="required">*</span>
            </label>
            <select
              className={errors.interactionType ? "input-error" : ""}
              value={form.interactionType}
              onChange={(e) => handleChange("interactionType", e.target.value)}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.interactionType && (
              <span className="error-text">{errors.interactionType}</span>
            )}
          </div>
          <div className="form-group">
            <label>
              Ngày tiếp xúc <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              className={errors.interactionTime ? "input-error" : ""}
              value={form.interactionTime}
              onChange={(e) => handleChange("interactionTime", e.target.value)}
            />
            {errors.interactionTime && <span className="error-text">{errors.interactionTime}</span>}
          </div>
          <div className="form-group">
            <label>Địa điểm</label>
            <input
              className={errors.location ? "input-error" : ""}
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="VD: Văn phòng Viettel"
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group full-width">
            <label>Nội dung trao đổi</label>
            <textarea
              className={errors.description ? "input-error" : ""}
              rows="3"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Mô tả nội dung tiếp xúc"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserModal;
