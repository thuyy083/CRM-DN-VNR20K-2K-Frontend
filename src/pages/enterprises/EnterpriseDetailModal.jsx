import { useEffect, useState } from "react";
import {
  getContactsByEnterprise,
  deleteContact
} from "../../services/enterpriseService";
import ContactModal from "./ContactModal";
import "./EnterpriseDetailModal.scss";

import { toast } from "react-toastify";
function EnterpriseDetailModal({ enterprise, industries, close }) {
  const [contacts, setContacts] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const industryMap = {};
  industries.forEach((i) => (industryMap[i.code] = i.name));

  const fetchContacts = async () => {
    const res = await getContactsByEnterprise(enterprise.id);
    setContacts(res.data?.data || []);
  };
  const handleDelete = async (contactId) => {
  const confirmDelete = window.confirm("Bạn có chắc muốn xóa người liên hệ này?");
  if (!confirmDelete) return;

  try {
    await deleteContact(enterprise.id, contactId);
    toast.success("Xóa người liên hệ thành công");

    fetchContacts(); // reload lại danh sách
  } catch (err) {
    console.error(err);
    toast.error("Xóa thất bại");
  }
};

  useEffect(() => {
    fetchContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);

  return (
    <div className="modal">
      <div className="modal-box large">
        <h3>Chi tiết doanh nghiệp</h3>

        {/* INFO */}
        <div className="info-grid">
          <div>
  <b>Tên</b>
  <span>{enterprise.name}</span>
</div>
          <div><b>MST:</b> {enterprise.taxCode}</div>
          <div><b>Ngành:</b> {industryMap[enterprise.industry]}</div>
          <div><b>Nhân viên:</b> {enterprise.employeeCount}</div>
          <div><b>Phone:</b> {enterprise.phone}</div>
          <div><b>Website:</b> {enterprise.website}</div>
        </div>

        {/* CONTACT */}
        <div className="contact-header">
          <h4>Người liên hệ</h4>
          <button onClick={() => {
            setEditingContact(null);
            setOpenForm(true);
          }}>
            + Thêm
          </button>
        </div>

        <table className="contact-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Chức vụ</th>
              <th>Email</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.fullName}</td>
                <td>{c.position}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
               <td>
  <div className="action-btns">
    <button
      className="edit-btn"
      onClick={() => {
        setEditingContact(c);
        setOpenForm(true);
      }}
    >
      Sửa
    </button>

    <button
      className="delete-btn"
      onClick={() => handleDelete(c.id)}
    >
      Xóa
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>

        {openForm && (
          <ContactModal
            enterpriseId={enterprise.id}
            contact={editingContact}
            close={() => setOpenForm(false)}
            reload={fetchContacts}
          />
        )}

        <div className="modal-actions">
          <button onClick={close}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseDetailModal;