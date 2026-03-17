import axios from "../config/axios";

// Lấy danh sách doanh nghiệp
export const getEnterprises = (
  page = 0,
  size = 10,
  keyword = "",
  status = ""
) => {
  return axios.get("/enterprises", {
    params: {
      page,
      size,
      keyword,
      status,
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