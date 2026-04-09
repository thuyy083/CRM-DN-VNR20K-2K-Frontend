import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./AppointmentModal.scss";
import { createAppointment, updateAppointment } from "../../services/appointmentService";
import { getEnterprises, getContactsByEnterprise } from "../../services/enterpriseService";

function AppointmentModal({ appointment, close, reload }) {
  const [form, setForm] = useState({
    enterpriseId: appointment?.enterpriseId || "",
    contactId: appointment?.contactId || "",
    appointmentType: appointment?.appointmentType || "ONLINE",
    scheduledTime: appointment?.scheduledTime || "", 
    location: appointment?.location || "",
    purpose: appointment?.purpose || "",
  });

  const [enterprises, setEnterprises] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    // Load enterprises list (for select dropdown)
    // Could fetch a larger amount to show in select or search in select, using page=0, size=1000 for simplicity
    getEnterprises(0, 1000).then(res => {
      setEnterprises(res.data?.data?.content || res.data?.content || []);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (form.enterpriseId) {
      getContactsByEnterprise(form.enterpriseId).then(res => {
        setContacts(res.data?.data || res.data || []);
      }).catch(err => console.error(err));
    } else {
      setContacts([]);
    }
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

  const [dtLocal, setDtLocal] = useState(parseInitDateTime(appointment?.scheduledTime) || "");

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
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
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <div className="modal-title-row">
          <h3>{appointment ? "Cập nhật lịch hẹn" : "Thêm lịch hẹn mới"}</h3>
          <button type="button" className="modal-close-btn" onClick={close}>×</button>
        </div>

        <div className="form-grid">
          <div className="form-col">
            <div className="form-group">
              <label>Doanh nghiệp *</label>
              <select value={form.enterpriseId} onChange={e => handleChange("enterpriseId", e.target.value)}>
                <option value="">-- Chọn doanh nghiệp --</option>
                {enterprises.map(ent => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Người liên hệ</label>
              <select value={form.contactId} onChange={e => handleChange("contactId", e.target.value)}>
                <option value="">-- Chọn người liên hệ --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} - {c.position}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Hình thức *</label>
              <select value={form.appointmentType} onChange={e => handleChange("appointmentType", e.target.value)}>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline (Gặp gỡ trực tiếp)</option>
                <option value="PHONE_CALL">Gọi điện thoại</option>
              </select>
            </div>
          </div>

          <div className="form-col">
            <div className="form-group">
              <label>Thời gian (Bắt buộc) *</label>
              <input 
                type="datetime-local" 
                value={dtLocal} 
                onChange={e => handleDtChange(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Địa điểm</label>
              <input 
                type="text" 
                value={form.location} 
                placeholder="Nhập địa điểm (vd: Văn phòng, Link Google Meet,...)"
                onChange={e => handleChange("location", e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Mục đích / Ghi chú</label>
          <textarea 
            rows="4" 
            value={form.purpose} 
            onChange={e => handleChange("purpose", e.target.value)}
            placeholder="Mô tả mục đích lịch hẹn..."
          ></textarea>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>Hủy</button>
          <button className="save-btn" onClick={handleSubmit}>Lưu</button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentModal;
