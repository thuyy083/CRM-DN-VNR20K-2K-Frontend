import axiosClient from "../config/axios";

export const loginApi = (data) => {
  return axiosClient.post("/login", data);
};