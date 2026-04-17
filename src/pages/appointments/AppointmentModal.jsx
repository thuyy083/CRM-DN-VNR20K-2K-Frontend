import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./AppointmentModal.scss";
import {
  createAppointment,
  updateAppointment,
} from "../../services/appointmentService";
import {
  getEnterprises,
  getContactsByEnterprise,
  createContact,
} from "../../services/enterpriseService";

function AppointmentModal({ appointment, close, reload }) {
  const [form, setForm] = useState({
    enterpriseId: appointment?.enterpriseId || "",
    contactId: appointment?.contactId || "",
    appointmentType: appointment?.appointmentType || "ONLINE_MEETING",
    scheduledTime: appointment?.scheduledTime || "",
    location: appointment?.location || "",
    purpose: appointment?.purpose || "",
  });

  const [enterprises, setEnterprises] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showCreateContactForm, setShowCreateContactForm] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: "",
    position: "",
    email: "",
    phone: "",
  });
  const [createContactErrors, setCreateContactErrors] = useState({});

  useEffect(() => {
    // Load enterprises list (for select dropdown)
    // Could fetch a larger amount to show in select or search in select, using page=0, size=1000 for simplicity
    getEnterprises(0, 1000)
      .then((res) => {
        setEnterprises(res.data?.data?.content || res.data?.content || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!form.enterpriseId) {
        setContacts([]);
        return;
      }

      try {
        const res = await getContactsByEnterprise(form.enterpriseId);
        const list = res.data?.data || res.data || [];
        setContacts(list);

        if (list.length === 0) {
          toast.warning("Doanh nghiệp chưa có người liên hệ");
          setShowCreateContactForm(true);
        }
      } catch (err) {
        console.error(err);
        setContacts([]);
      }
    };

    fetchContacts();
  }, [form.enterpriseId]);

  // Handle datetime conversion for backend requirement format (dd/MM/yyyy HH:mm)
  // Input type datetime-local has format "YYYY-MM-DDThh:mm"
  const parseInitDateTime = (str) => {
    if (!str) return "";
    const parts = str.split(" ");
    if (parts.length === 2) {
      const dateParts = parts[0].split("/");
      if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1]}`;
      }
    }
    return str; // fallback
  };

  const [dtLocal, setDtLocal] = useState(
    parseInitDateTime(appointment?.scheduledTime) || "",
  );

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
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

  if (
    contactForm.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())
  ) {
    nextErrors.email = "Email không đúng định dạng";
  }

  if (
    contactForm.phone.trim() &&
    !/^[0-9+\s-]{8,20}$/.test(contactForm.phone.trim())
  ) {
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
    // show 1 số lỗi chính
    if (nextErrors.fullName) toast.error(nextErrors.fullName);
    else if (nextErrors.phone) toast.error(nextErrors.phone);
    else if (nextErrors.position) toast.error(nextErrors.position);

    return;
  }

  try {
    setCreatingContact(true);

    const payload = {
      fullName: contactForm.fullName.trim(),
      position: contactForm.position.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
    };

    const created = await createContact(form.enterpriseId, payload);

    const res = await getContactsByEnterprise(form.enterpriseId);
    const list = res.data?.data || res.data || [];
    setContacts(list);

    const createdId = created?.id;
    if (createdId) {
      setForm((prev) => ({
        ...prev,
        contactId: createdId,
      }));
    }

    // reset
    setContactForm({
      fullName: "",
      position: "",
      email: "",
      phone: "",
    });

    setCreateContactErrors({});
    setShowCreateContactForm(false);

    toast.success("Tạo người liên hệ thành công");
  }catch (err) {
  console.error(err);

  const res = err?.response?.data;

  // ✅ Nếu BE trả validation dạng array
  if (Array.isArray(res?.message)) {
    // map lỗi vào UI (input đỏ + text dưới)
    const backendErrors = {};
    res.message.forEach((e) => {
      if (e?.field) {
        backendErrors[e.field] = e.message;
      }
    });

    setCreateContactErrors(backendErrors);

    // show toast list lỗi
    toast.error(
      <div style={{ maxHeight: 250, overflowY: "auto" }}>
        {res.message.map((e, i) => (
          <div key={i}>
            {e.message}
          </div>
        ))}
      </div>,
      {
        autoClose: false,
        closeButton: true,
      }
    );
  } else {
    toast.error(res?.message || "Có lỗi xảy ra");
  }
} finally {
    setCreatingContact(false);
  }
};


  const handleDtChange = (val) => {
    setDtLocal(val);
    // convert to dd/MM/yyyy HH:mm
    if (val) {
      const d = new Date(val);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      let h = String(d.getHours()).padStart(2, "0");
      let m = String(d.getMinutes()).padStart(2, "0");
      handleChange("scheduledTime", `${day}/${month}/${year} ${h}:${m}`);
    } else {
      handleChange("scheduledTime", "");
    }
  };

  const handleSubmit = async () => {
    if (!form.enterpriseId || !form.appointmentType || !form.scheduledTime) {
      toast.warning("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }

    try {
      if (appointment?.id) {
        await updateAppointment(appointment.id, form);
        toast.success("Cập nhật lịch hẹn thành công!");
      } else {
        await createAppointment(form);
        toast.success("Tạo lịch hẹn thành công!");
      }
      reload();
      close();
    } catch (err) {
      console.error(err);

      const res = err?.response?.data;

      // Nếu là validation error dạng array
      if (Array.isArray(res?.message)) {
        toast.error(
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {res.message.map((e, i) => (
              <div key={i}>
                {e.message}
              </div>
            ))}
          </div>,
          {
            autoClose: false,
            closeButton: true,
          }
        );
      } else {
        // fallback lỗi thường
        toast.error(res?.message || "Có lỗi xảy ra");
      }
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <div className="modal-title-row">
          <h3>{appointment ? "Cập nhật lịch hẹn" : "Thêm lịch hẹn mới"}</h3>
          <button type="button" className="modal-close-btn" onClick={close}>
            ×
          </button>
        </div>

        <div className="form-grid">
          <div className="form-col">
            <div className="form-group">
              <label>Doanh nghiệp *</label>
              <select
                value={form.enterpriseId}
                onChange={(e) => handleChange("enterpriseId", e.target.value)}
              >
                <option value="">-- Chọn doanh nghiệp --</option>
                {enterprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Người liên hệ</label>
              <select
                value={form.contactId}
                onChange={(e) => handleChange("contactId", e.target.value)}
              >
                <option value="">-- Chọn người liên hệ --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.position}
                  </option>
                ))}
              </select>
            </div>

           
            <div className="form-group">
              <label>Hình thức *</label>
              <select
                value={form.appointmentType}
                onChange={(e) =>
                  handleChange("appointmentType", e.target.value)
                }
              >
                <option value="ONLINE_MEETING">Online</option>
                <option value="OFFLINE_MEETING">
                  Offline (Gặp gỡ trực tiếp)
                </option>
                <option value="PHONE_CALL">Gọi điện thoại</option>
                <option value="EMAIL_QUOTE">Gửi báo giá</option>
                <option value="CONTRACT_SIGNING">Ký hợp đồng</option>
                <option value="CUSTOMER_SUPPORT">Hỗ trợ khách hàng</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div className="form-col">
            <div className="form-group">
              <label>Thời gian (Bắt buộc) *</label>
              <input
                type="datetime-local"
                value={dtLocal}
                onChange={(e) => handleDtChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Địa điểm</label>
              <input
                type="text"
                value={form.location}
                placeholder="Nhập địa điểm (vd: Văn phòng, Link Google Meet,...)"
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>
          </div>
           {showCreateContactForm && (
                      <div className="form-group full-width">

             <div className="contact-inline-form">
  <h4>Thêm người liên hệ</h4>

<div className="contact-grid">

  <div className="form-group">
    <input
      className={createContactErrors.fullName ? "input-error" : ""}
      placeholder="Họ tên *"
      value={contactForm.fullName}
      onChange={(e) =>
        setContactForm({ ...contactForm, fullName: e.target.value })
      }
    />
    {createContactErrors.fullName && (
      <span className="error-text">{createContactErrors.fullName}</span>
    )}
  </div>

  <div className="form-group">
    <input
      className={createContactErrors.position ? "input-error" : ""}
      placeholder="Chức vụ"
      value={contactForm.position}
      onChange={(e) =>
        setContactForm({ ...contactForm, position: e.target.value })
      }
    />
    {createContactErrors.position && (
      <span className="error-text">{createContactErrors.position}</span>
    )}
  </div>

  <div className="form-group">
    <input
      className={createContactErrors.email ? "input-error" : ""}
      placeholder="Email"
      value={contactForm.email}
      onChange={(e) =>
        setContactForm({ ...contactForm, email: e.target.value })
      }
    />
    {createContactErrors.email && (
      <span className="error-text">{createContactErrors.email}</span>
    )}
  </div>

  <div className="form-group">
    <input
      className={createContactErrors.phone ? "input-error" : ""}
      placeholder="SĐT"
      value={contactForm.phone}
      onChange={(e) =>
        setContactForm({ ...contactForm, phone: e.target.value })
      }
    />
    {createContactErrors.phone && (
      <span className="error-text">{createContactErrors.phone}</span>
    )}
  </div>

</div>

  <button onClick={handleCreateContact} disabled={creatingContact}>
    {creatingContact ? "Đang tạo..." : "Tạo người liên hệ"}
  </button>
</div>
</div>

            )}

        </div>
        <div className="form-group full-width">
          <label>Mục đích / Ghi chú</label>
          <textarea
            rows="4"
            value={form.purpose}
            onChange={(e) => handleChange("purpose", e.target.value)}
            placeholder="Mô tả mục đích lịch hẹn..."
          ></textarea>
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

export default AppointmentModal;
