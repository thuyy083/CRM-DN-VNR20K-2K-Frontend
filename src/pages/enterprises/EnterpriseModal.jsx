import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "./EnterpriseModal.scss";
import {
  createEnterprise,
  getIndustries,
  updateEnterprise,
} from "../../services/enterpriseService";

function EnterpriseModal({ enterprise, close, reload }) {
  const [form, setForm] = useState({
    name: enterprise?.name || "",
    taxCode: enterprise?.taxCode || "",
    industry: enterprise?.industry || "", // lưu CODE
    employeeCount: enterprise?.employeeCount || "",
    address: enterprise?.address || "",
    website: enterprise?.website || "",
    phone: enterprise?.phone || "",
    status: enterprise?.status || "ACTIVE",
    note: enterprise?.note || "",
  });

  const [industries, setIndustries] = useState([]);
  const [searchIndustry, setSearchIndustry] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchIndustries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIndustries = async () => {
    try {
      const res = await getIndustries();
      setIndustries(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  // đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredIndustries = industries.filter((i) =>
    i.name.toLowerCase().includes(searchIndustry.toLowerCase())
  );

  const selectedIndustry = industries.find(
    (i) => i.code === form.industry
  );

  const handleSubmit = async () => {
    try {
      if (enterprise) {
        await updateEnterprise(enterprise.id, form);
        toast.success("Cập nhật doanh nghiệp thành công");
      } else {
        await createEnterprise(form);
        toast.success("Thêm doanh nghiệp thành công");
      }

      await reload();
      close();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <h3>{enterprise ? "Cập nhật doanh nghiệp" : "Thêm doanh nghiệp"}</h3>

        <div className="form-grid">
          {/* LEFT */}
          <div className="form-col">
            <div className="form-group">
              <label>Tên doanh nghiệp</label>
              <input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Mã số thuế</label>
              <input
                value={form.taxCode}
                onChange={(e) => handleChange("taxCode", e.target.value)}
              />
            </div>

            {/* INDUSTRY */}
            <div className="form-group" ref={dropdownRef}>
              <label>Ngành nghề</label>

              <div
                className={`select-box ${openDropdown ? "active" : ""}`}
                onClick={() => setOpenDropdown(!openDropdown)}
              >
                <span className={form.industry ? "selected" : "placeholder"}>
                  {selectedIndustry?.name || "Chọn ngành nghề"}
                </span>

                <svg
                  className={`icon ${openDropdown ? "open" : ""}`}
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {openDropdown && (
                <div className="select-dropdown">
                  <input
                    className="search"
                    placeholder="Tìm ngành..."
                    value={searchIndustry}
                    onChange={(e) => setSearchIndustry(e.target.value)}
                  />

                  <div className="options">
                    {filteredIndustries.map((item) => (
                      <div
                        key={item.code}
                        className={`option ${form.industry === item.code ? "selected" : ""
                          }`}
                        onClick={() => {
                          handleChange("industry", item.code);
                          setOpenDropdown(false);
                        }}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Số nhân viên</label>
              <input
                type="number"
                value={form.employeeCount}
                onChange={(e) =>
                  handleChange("employeeCount", e.target.value)
                }
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="form-col">
            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Website</label>
              <input
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Điện thoại</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
              </select>
            </div>
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

export default EnterpriseModal;