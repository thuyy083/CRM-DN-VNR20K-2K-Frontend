import axios from "../config/axios";
import "react-quill-new/dist/quill.snow.css";

export const getServices = () => {
  return axios.get("/viettel-services");
};

export const getServiceById = (id) => {
  return axios.get(`/viettel-services/${id}`);
};

export const createService = (data) => {
  return axios.post("/viettel-services", data);
};

export const updateService = (id, data) => {
  return axios.put(`/viettel-services/${id}`, data);
};

export const deleteService = (id) => {
  return axios.delete(`/viettel-services/${id}`);
};
