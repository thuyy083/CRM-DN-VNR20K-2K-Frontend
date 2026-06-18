import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "./EnterpriseModal.scss";
import {
  createEnterprise,
  getIndustries,
  updateEnterprise,
  addServiceToEnterprise,
} from "../../services/enterpriseService";
import { createContact } from "../../services/enterpriseContactService";
import { searchCommunes } from "../../services/locationsService";
import { searchUsers } from "../../services/userService";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

function EnterpriseModal({ enterprise, close, reload }) {
  // const isCreateMode = !enterprise;
  const normalizePotentialValue = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return ["true", "1", "yes", "y", "potential", "tiem_nang"].includes(normalized);
    }
    return false;
  };

  const [form, setForm] = useState({
    name: enterprise?.name || "",
    taxCode: enterprise?.taxCode || "",
    industry: enterprise?.industry || "",
    employeeCount: enterprise?.employeeCount || "",
    address: enterprise?.address || "",
    website: enterprise?.website || "",
    phone: enterprise?.phone || "",
    email: enterprise?.email || "",
    status: enterprise?.status || "ACTIVE",
    communeId: enterprise?.communeId || "",
    consultantId: enterprise?.consultantId || "",
    type: enterprise?.type || "HKD",
    establishedDate: enterprise?.establishedDate || "",
    taxAuthority: enterprise?.taxAuthority || "",

    isPotential:
      normalizePotentialValue(
        enterprise?.isPotential ??
        enterprise?.potential ??
        enterprise?.is_potential
      ),
    note: enterprise?.note || "",
    contactFullName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: "",
  });

  const [industries, setIndustries] = useState([]);
  const [searchIndustry, setSearchIndustry] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [searchCommune, setSearchCommune] = useState(
    enterprise?.communeName ? `${enterprise.communeName}` : ""
  );
  const [communeOptions, setCommuneOptions] = useState([]);
  const [openCommuneDropdown, setOpenCommuneDropdown] = useState(false);
  const [loadingCommune, setLoadingCommune] = useState(false);
  const communeDropdownRef = useRef(null);

  const [searchConsultant, setSearchConsultant] = useState(
    enterprise?.consultantName ? `${enterprise.consultantName}` : ""
  );
  const [consultantOptions, setConsultantOptions] = useState([]);
  const [openConsultantDropdown, setOpenConsultantDropdown] = useState(false);
  const [loadingConsultant, setLoadingConsultant] = useState(false);
  const consultantDropdownRef = useRef(null);

  const [showServiceForm] = useState(false);
  const [serviceForm] = useState({
    viettelServiceId: "",
    contractNumber: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  const savePotentialToStorage = (enterpriseId, isPotential) => {
    if (!enterpriseId) return;
    try {
      const raw = localStorage.getItem(POTENTIAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[String(enterpriseId)] = Boolean(isPotential);
      localStorage.setItem(POTENTIAL_STORAGE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error("Cannot persist potential flag", error);
    }
  };

  useEffect(() => {
    fetchIndustries();
     
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

  const validateServiceForm = () => {
    if (!showServiceForm) return true;
    if (!serviceForm.viettelServiceId) {
      toast.error("Vui lòng chọn dịch vụ");
      return false;
    }
    if (!serviceForm.contractNumber.trim()) {
      toast.error("Vui lòng nhập số hợp đồng");
      return false;
    }
    if (!serviceForm.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu");
      return false;
    }
    if (serviceForm.endDate && serviceForm.endDate < serviceForm.startDate) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return false;
    }
    if (form.establishedDate && new Date(form.establishedDate) > new Date()) {
  toast.error("Ngày thành lập không hợp lệ");
  return;
}
    return true;
  };

  const cacheCommuneRef = useRef({});
  useEffect(() => {
    const debounce = setTimeout(() => {
      const run = async () => {
        const keyword = searchCommune.trim().toLowerCase();
        if (keyword.length < 2) {
          setCommuneOptions([]);
          return;
        }
        if (cacheCommuneRef.current[keyword]) {
          setCommuneOptions(cacheCommuneRef.current[keyword]);
          return;
        }
        setLoadingCommune(true);
        try {
          const res = await searchCommunes(keyword);
          setCommuneOptions(res.data || []);
          cacheCommuneRef.current[keyword] = res.data || [];
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingCommune(false);
        }
      };
      run();
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchCommune]);

  useEffect(() => {
    const fetchAllConsultants = async () => {
      setLoadingConsultant(true);
      try {
        const res = await searchUsers("CONSULTANT", "", 0, 100);
        setConsultantOptions(res.data?.data?.content || res.data?.content || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConsultant(false);
      }
    };
    if (form.type === "VNR20K" || form.type === "VNR2000") {
      fetchAllConsultants();
    }
  }, [form.type]);

  // đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(false);
      if (communeDropdownRef.current && !communeDropdownRef.current.contains(e.target)) setOpenCommuneDropdown(false);
      if (consultantDropdownRef.current && !consultantDropdownRef.current.contains(e.target)) setOpenConsultantDropdown(false);
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
      const potentialFlag = Boolean(form.isPotential);
      const payloadWithPotential = {
        ...form,
        isPotential: potentialFlag,
        potential: potentialFlag,
        is_potential: potentialFlag,
      };

      if (enterprise) {
        const {
          // contactFullName,
          // contactEmail,
          // contactPhone,
          // contactPosition,
          ...updatePayload
        } = payloadWithPotential;
        await updateEnterprise(enterprise.id, updatePayload);
        savePotentialToStorage(enterprise.id, potentialFlag);
        toast.success("Cập nhật doanh nghiệp thành công");
      } else {
         if (!validateServiceForm()) {
    return;
  }

  // ❗ tách contact ra khỏi payload
  const {
    contactFullName,
    contactEmail,
    contactPhone,
    contactPosition,
    ...enterpriseData
  } = payloadWithPotential;

  const createPayload = {
    ...enterpriseData,
    status: "ACTIVE",
  };

  const createRes = await createEnterprise(createPayload);

  const createdEnterpriseId =
    createRes?.data?.data?.id ||
    createRes?.data?.id;

  // ✅ chỉ tạo contact ở đây (1 lần duy nhất)
  if (
    createdEnterpriseId &&
    (contactFullName || contactEmail || contactPhone)
  ) {
    try {
      await createContact(createdEnterpriseId, {
        fullName: contactFullName.trim() || "",
        position: contactPosition.trim() || "",
        email: contactEmail.trim() || "",
        phone: contactPhone.trim() || "",
        isPrimary: true,
      });
    } catch (err) {
      console.error("Create contact error:", err);
      toast.warning("Tạo doanh nghiệp thành công nhưng thêm người đại diện thất bại");
    }
  }

  savePotentialToStorage(createdEnterpriseId, potentialFlag);

  if (showServiceForm) {
    if (!createdEnterpriseId) {
      toast.warning("Đã tạo doanh nghiệp nhưng không lấy được ID để gắn dịch vụ");
    } else {
      await addServiceToEnterprise(createdEnterpriseId, {
        viettelServiceId: Number(serviceForm.viettelServiceId),
        contractNumber: serviceForm.contractNumber.trim(),
        startDate: serviceForm.startDate,
        endDate: serviceForm.endDate || null,
        status: serviceForm.status,
      });
    }
  }

  toast.success("Thêm doanh nghiệp thành công");
      }

      await reload();
      close();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
    }
  };
  useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "";
  };
}, []);

  return (
<div className="modal open" onClick={close}>
  <div className="modal-box enterprise-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title-row">
          <h3>{enterprise ? "Cập nhật doanh nghiệp" : "Thêm doanh nghiệp"}</h3>
          <button type="button" className="modal-close-btn" onClick={close}>
            ×
          </button>
        </div>

        <div className="form-grid">
          {/* CỘT 1 */}
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

            <div className="form-group">
              <label>Cơ quan thuế</label>
              <input
                value={form.taxAuthority}
                onChange={(e) => handleChange("taxAuthority", e.target.value)}
                placeholder="VD: Cục thuế TP..."
              />
            </div>

            {/* XÃ/PHƯỜNG (COMMUNE) */}
            <div className="form-group" ref={communeDropdownRef}>
              <label>Xã / Phường / Khu vực</label>
              <div
                className={`select-box ${openCommuneDropdown ? "active" : ""}`}
              >
                <input
                  className="search"
                  style={{ border: "none", padding: 0, outline: "none", height: "auto", width: "100%" }}
                  placeholder="Tìm xã/phường..."
                  value={searchCommune}
                  onFocus={(e) => {
                    setOpenCommuneDropdown(true);
                    e.target.select();
                  }}
                  onChange={(e) => {
                    setSearchCommune(e.target.value);
                    handleChange("communeId", "");
                  }}
                />
              </div>

              {openCommuneDropdown && (
                <div className="select-dropdown">
                  <div className="options">
                    {loadingCommune ? (
                      <div className="option">Đang tìm...</div>
                    ) : searchCommune.length < 2 ? (
                      <div className="option">Nhập ít nhất 2 ký tự</div>
                    ) : communeOptions.length === 0 ? (
                      <div className="option">Không tìm thấy xã</div>
                    ) : (
                      communeOptions.map((item) => (
                        <div
                          key={item.id}
                          className={`option ${form.communeId === item.id ? "selected" : ""}`}
                          onClick={() => {
                            handleChange("communeId", item.id);
                            setSearchCommune(`${item.name} - ${item.clusterName}`);
                            setOpenCommuneDropdown(false);
                          }}
                        >
                          {item.name} - {item.clusterName}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                        className={`option ${form.industry === item.code ? "selected" : ""}`}
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
          </div>

          {/* CỘT 2 */}
          <div className="form-col">
            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Loại hình doanh nghiệp <span className="required">*</span></label>
              <select
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <option value="HKD">Hộ kinh doanh</option>
                <option value="VNR20K">VNR20K</option>
                <option value="VNR2000">VNR2000</option>
                <option value="SME">SME</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ngày thành lập</label>
              <input
                type="date"
                value={form.establishedDate}
                onChange={(e) => handleChange("establishedDate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nhân sự</label>
              <input
                type="number"
                value={form.employeeCount}
                onChange={(e) => handleChange("employeeCount", e.target.value)}
              />
            </div>
          </div>

          {/* CỘT 3 */}
          <div className="form-col">
            <div className="form-group">
              <label>Điện thoại</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email doanh nghiệp</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="VD: info@congty.com"
              />
            </div>

            <div className="form-group">
              <label>Website</label>
              <input
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
              />
            </div>

            {enterprise && (
              <div className="form-group">
                <label>Trạng thái doanh nghiệp</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngưng hoạt động</option>
                </select>
              </div>
            )}

            {/* CONSULTANT (Chỉ hiển thị khi type là VNR20K hoặc VNR2000) */}
            {(form.type === "VNR20K" || form.type === "VNR2000") && (
              <div className="form-group" ref={consultantDropdownRef}>
                <label>Nhân viên dự án phụ trách</label>
                <div
                  className={`select-box ${openConsultantDropdown ? "active" : ""}`}
                >
                  <input
                    className="search"
                    style={{ border: "none", padding: 0, outline: "none", height: "auto", width: "100%" }}
                    placeholder="Tìm theo tên/sđt/email..."
                    value={searchConsultant}
                    onFocus={(e) => {
                      setOpenConsultantDropdown(true);
                      e.target.select();
                    }}
                    onChange={(e) => {
                      setSearchConsultant(e.target.value);
                      handleChange("consultantId", "");
                    }}
                  />
                </div>

                {openConsultantDropdown && (
                  <div className="select-dropdown">
                    <div className="options">
                      {loadingConsultant ? (
                        <div className="option">Đang tải danh sách...</div>
                      ) : consultantOptions.length === 0 ? (
                        <div className="option">Chưa có nhân viên nào</div>
                      ) : (
                        consultantOptions
                          .filter((item) => 
                            item.fullName.toLowerCase().includes(searchConsultant.toLowerCase()) || 
                            (item.phone && item.phone.includes(searchConsultant))
                          )
                          .map((item) => (
                          <div
                            key={item.id}
                            className={`option ${form.consultantId === item.id ? "selected" : ""}`}
                            onClick={() => {
                              handleChange("consultantId", item.id);
                              setSearchConsultant(`${item.fullName} - ${item.phone}`);
                              setOpenConsultantDropdown(false);
                            }}
                          >
                            {item.fullName} - {item.phone}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-group full-width contact-inline-module">
          <div className="contact-inline-header">
            <strong>Thêm người đại diện (không bắt buộc)</strong>
          </div>

          <div className="contact-inline-grid">
            <div className="form-group">
              <label>Họ tên</label>
              <input
                value={form.contactFullName}
                onChange={(e) => handleChange("contactFullName", e.target.value)}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>

            <div className="form-group">
              <label>Chức vụ</label>
              <input
                value={form.contactPosition}
                onChange={(e) => handleChange("contactPosition", e.target.value)}
                placeholder="VD: Giám đốc"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                value={form.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="VD: abc@gmail.com"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                value={form.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="VD: 0987654321"
              />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>
          <button type="button" className="save-btn" onClick={handleSubmit}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseModal;