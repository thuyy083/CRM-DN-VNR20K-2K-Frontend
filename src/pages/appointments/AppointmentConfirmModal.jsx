import { useState } from "react";
import { toast } from "react-toastify";
import "./AppointmentConfirmModal.scss";
import { confirmAppointment } from "../../services/appointmentService";

function AppointmentConfirmModal({ appointment, close, reload }) {
  const [result, setResult] = useState("SUCCESSFUL");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!result) {
      toast.warning("Vui lòng chọn kết quả cuộc hẹn!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("result", result);
      formData.append("description", description);
      
      photos.forEach(file => {
        formData.append("photos", file);
      });

      await confirmAppointment(appointment.id, formData);
      toast.success("Xác nhận lịch hẹn thành công!");
      reload();
      close();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi xác nhận!");
    }
  };

  return (
    <div className="modal">
      <div className="modal-box confirm-box">
        <div className="modal-title-row">
          <h3>Xác nhận hoàn thành lịch hẹn</h3>
          <button type="button" className="modal-close-btn" onClick={close}>×</button>
        </div>

        <div className="form-group">
          <label>Kết quả *</label>
          <select value={result} onChange={e => setResult(e.target.value)}>
            <option value="SUCCESSFUL">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="NEED_FOLLOW_UP">Cần theo dõi thêm (Need follow up)</option>
            <option value="PENDING">Chờ xử lý (Pending)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Mô tả chi tiết</label>
          <textarea 
            rows="4" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder="Nhập ghi chú, kết quả hoặc vấn đề tồn tại..."
          ></textarea>
        </div>

        <div className="form-group">
          <label>Tài liệu/Hình ảnh minh chứng</label>
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange} 
            accept="image/*,.pdf,.doc,.docx"
            className="file-input"
          />
          {photos.length > 0 && (
            <div className="file-list">
              {photos.map((file, idx) => (
                <div key={idx} className="file-item">
                  📄 {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>Hủy</button>
          <button className="save-btn" onClick={handleSubmit}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentConfirmModal;
