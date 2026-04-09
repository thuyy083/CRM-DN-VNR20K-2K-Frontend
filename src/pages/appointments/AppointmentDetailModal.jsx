import "./AppointmentDetailModal.scss";

function AppointmentDetailModal({ appointment, close }) {
  if (!appointment) return null;

  return (
    <div className="modal">
      <div className="modal-box">
        <div className="modal-title-row">
          <h3>Chi tiết lịch hẹn #{appointment.id}</h3>
          <button type="button" className="modal-close-btn" onClick={close}>×</button>
        </div>

        <div className="detail-content">
          <div className="detail-row">
            <span className="label">Doanh nghiệp:</span>
            <span className="value font-medium">{appointment.enterpriseName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Người liên hệ:</span>
            <span className="value">{appointment.contactName || "Không có"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Chuyên viên phụ trách:</span>
            <span className="value">{appointment.consultantName} ({appointment.consultantEmail})</span>
          </div>
          <div className="detail-row">
            <span className="label">Thời gian:</span>
            <span className="value">{appointment.scheduledTime}</span>
          </div>
          <div className="detail-row">
            <span className="label">Hình thức:</span>
            <span className="value">{appointment.appointmentType}</span>
          </div>
          <div className="detail-row">
            <span className="label">Địa điểm:</span>
            <span className="value">{appointment.location || "Không có"}</span>
          </div>
          <div className="detail-row">
            <span className="label">Trạng thái:</span>
            <span className={`status ${appointment.status?.toLowerCase()}`}>{appointment.status}</span>
          </div>
          <div className="detail-row full-row">
            <span className="label">Mục đích / Ghi chú:</span>
            <div className="value description-box">{appointment.purpose || "Chưa có nội dung"}</div>
          </div>
          
          {appointment.interactionId && (
            <div className="detail-row">
              <span className="label">Interaction ID:</span>
              <span className="value">{appointment.interactionId}</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailModal;
