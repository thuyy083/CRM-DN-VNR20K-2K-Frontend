import axios from "../config/axios";

// export const getUsers = (page = 0, size = 10) => {
//   return axios.get("/users", {
//     params: {
//       page,
//       size,
//     },
//   });
// };

export const getUsers = () => {
  return axios.get("/users", {
    params: {
      page: 0,
      size: 10,
    },
  });
};

export const getUserById = (id) => {
  return axios.get(`/users/${id}`);
};

export const createUser = (data) => {
  return axios.post("/users", data);
};

export const updateUser = (id, data) => {
  return axios.put(`/users/${id}`, data);
};

export const deleteUser = (id) => {
  return axios.delete(`/users/${id}`);
};

export const getCurrentUser = () => {
  return axios.get("/users/me");
};
