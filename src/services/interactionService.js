
import axios from "../config/axios";

// Lấy danh sách các interaction 
export const getInteractions = ({
  page = 0,
  size = 200,
  enterpriseId,
  consultantId,
  type,
  result,
} = {}) => {
  return axios.get("/interactions", {
    params: {
      page,
      size,
      enterpriseId: enterpriseId || undefined,
      consultantId: consultantId || undefined,
      type: type || undefined,
      result: result || undefined,
    },
  });
};


export const getInteractionById = (id) => {
  return axios.get(`/interactions/${id}`);
};

// Tạo mới một interaction
export const createInteraction = (data) => {
  return axios.post("/interactions", data);
};


export const updateInteraction = (id, data) => {
  return axios.put(`/interactions/${id}`, data);
};


export const deleteInteraction = (id) => {
  return axios.delete(`/interactions/${id}`);
};
