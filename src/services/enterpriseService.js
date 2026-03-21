import axios from "../config/axios";

// Lấy danh sách doanh nghiệp
export const getEnterprises = (
  page = 0,
  size = 10,
  keyword = "",
  status = "",
  industry = ""
) => {
  return axios.get("/enterprises", {
    params: {
      page,
      size,
      keyword,
      status,
      industry,
    },
  });
};

// Lấy chi tiết doanh nghiệp
export const getEnterpriseById = (id) => {
  return axios.get(`/enterprises/${id}`);
};

// Tạo doanh nghiệp
export const createEnterprise = (data) => {
  return axios.post("/enterprises", data);
};

// Cập nhật doanh nghiệp
export const updateEnterprise = (id, data) => {
  return axios.put(`/enterprises/${id}`, data);
};

// Xóa doanh nghiệp
export const deleteEnterprise = (id) => {
  return axios.delete(`/enterprises/${id}`);
};

//Lấy ngành nghề
export const getIndustries = () => {
  return axios.get("/enterprises/industries");
};

// ===== CONTACT =====

// Lấy danh sách contact theo enterprise
export const getContactsByEnterprise = (enterpriseId) => {
  return axios.get(`/enterprises/${enterpriseId}/contacts`);
};

// Tạo contact
export const createContact = (enterpriseId, data) => {
  return axios.post(`/enterprises/${enterpriseId}/contacts`, data);
};

// Update contact
export const updateContact = (enterpriseId, contactId, data) => {
  return axios.put(
    `/enterprises/${enterpriseId}/contacts/${contactId}`,
    data
  );
};

//Delete contact
export const deleteContact = (enterpriseId, contactId) => {
  return axios.delete(`/enterprises/${enterpriseId}/contacts/${contactId}`);
};

export const importEnterprises = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("/enterprises/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};