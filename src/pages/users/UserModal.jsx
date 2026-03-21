import { useEffect, useRef, useState } from "react";
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
  { value: "OFFLINE_MEETING", label: "Gặp mặt" },
  { value: "EMAIL_QUOTE", label: "Email" },
  { value: "DEMO", label: "Thăm quan" },
  { value: "ONLINE_MEETING", label: "Họp online" },
  { value: "CONTRACT_SIGNING", label: "Ký hợp đồng" },
  { value: "CUSTOMER_SUPPORT", label: "Hỗ trợ khách hàng" },
  { value: "OTHER", label: "Khác" },
];

const resultOptions = [
  { value: "PENDING", label: "Đang xử lý" },
  { value: "NEED_FOLLOW_UP", label: "Cần theo dõi" },
  { value: "SUCCESSFUL", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
];

const toDateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
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
    result: interaction?.result || "PENDING",
    interactionTime: toDateOnly(interaction?.interactionTime),
    location: interaction?.location || "",
    description: interaction?.description || "",
  });

  const selectedEnterprise = enterprises.find(
    (enterprise) => String(getEnterpriseId(enterprise)) === String(form.enterpriseId)
  );
  const selectedEnterpriseName = (getEnterpriseName(selectedEnterprise) || "").trim().toLowerCase();
  const isViettelEnterprise =
    selectedEnterpriseName === "vt" || selectedEnterpriseName.includes("viettel");

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
    if (
      !interaction &&
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

    if (!contactForm.email.trim()) {
      nextErrors.email = "Không có gmail";
    }

    if (!contactForm.phone.trim()) {
      nextErrors.phone = "Không có số điện thoại";
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
      if (nextErrors.phone === "Không có số điện thoại") {
        toast.error("Không có số điện thoại");
      }
      if (nextErrors.email === "Không có gmail") {
        toast.error("Không có gmail");
      }
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
    if (!form.result) nextErrors.result = "Vui lòng chọn trạng thái";
    if (!form.interactionTime) nextErrors.interactionTime = "Vui lòng chọn ngày tiếp xúc";
    if (!form.description.trim()) {
      nextErrors.description = "Vui lòng nhập nội dung trao đổi";
    }
    if (form.location && form.location.trim().length > 255) {
      nextErrors.location = "Địa điểm tối đa 255 ký tự";
    }
    if (form.description && form.description.trim().length > 2000) {
      nextErrors.description = "Nội dung tối đa 2000 ký tự";
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
      if (nextErrors.result) {
        toast.error(nextErrors.result);
      }
      if (nextErrors.interactionTime) {
        toast.error(nextErrors.interactionTime);
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
      interactionType: form.interactionType,
      result: form.result,
      interactionTime: toIsoDate(form.interactionTime),
      location: form.location.trim() || null,
      description: (() => {
        const descriptionText = form.description.trim();
        const positionNote = form.contactPosition.trim()
          ? `Chức vụ liên hệ: ${form.contactPosition.trim()}`
          : "";

        if (!positionNote) return descriptionText || null;
        if (descriptionText.includes(positionNote)) return descriptionText;

        return [descriptionText, positionNote].filter(Boolean).join("\n\n") || null;
      })(),
    };

    try {
      if (interaction) {
        await updateInteraction(interaction.id, basePayload);
        toast.success("Cập nhật tiếp xúc thành công");
      } else {
        
        await createInteraction({
          ...basePayload,
          enterpriseId: Number(form.enterpriseId),
          contactId: form.contactId ? Number(form.contactId) : null,
        });
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
          <div className="form-group">
            <label>
              Doanh nghiệp <span className="required">*</span>
            </label>
            <select
              className={errors.enterpriseId ? "input-error" : ""}
              value={form.enterpriseId}
              onChange={(e) => {
                handleChange("enterpriseId", e.target.value);
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
              }}
              disabled={!!interaction}
            >
              <option value="">Chọn doanh nghiệp</option>
              {enterprises.map((enterprise) => (
                <option key={getEnterpriseId(enterprise)} value={getEnterpriseId(enterprise)}>
                  {getEnterpriseName(enterprise)}
                </option>
              ))}
            </select>
            {errors.enterpriseId && <span className="error-text">{errors.enterpriseId}</span>}
            {form.enterpriseId && !loadingContacts && contacts.length === 0 && isViettelEnterprise && (
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
              disabled={!form.enterpriseId || loadingContacts || !!interaction}
            >
              <option value="">{loadingContacts ? "Đang tải..." : "Chọn người liên hệ"}</option>
              {contacts.map((contact) => (
                <option key={getContactId(contact)} value={getContactId(contact)}>
                  {getContactName(contact)}
                </option>
              ))}
            </select>

            {!interaction && form.enterpriseId && !loadingContacts && !isViettelEnterprise && (
              <button
                type="button"
                className="link-add-contact-btn"
                onClick={() => setShowCreateContactForm((prev) => !prev)}
              >
                {showCreateContactForm ? "Ẩn form thêm người liên hệ" : "+ Thêm người liên hệ"}
              </button>
            )}
          </div>

          {!interaction && form.enterpriseId && !loadingContacts && showCreateContactForm && !isViettelEnterprise && (
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
                    value={contactForm.position}
                    onChange={(e) => handleContactFormChange("position", e.target.value)}
                    placeholder="VD: Nhân viên"
                  />
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
              value={form.contactPosition}
              onChange={(e) => handleChange("contactPosition", e.target.value)}
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
            {errors.interactionType && <span className="error-text">{errors.interactionType}</span>}
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select value={form.result} onChange={(e) => handleChange("result", e.target.value)}>
              {resultOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Ngày tiếp xúc <span className="required">*</span>
            </label>
            <input
              type="date"
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
