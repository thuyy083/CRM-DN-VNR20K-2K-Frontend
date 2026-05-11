
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

export const updateInteractionDescription = async (id, description) => {
  return axios.put(`/interactions/${id}`, {
    description,
  });
};

export const getInteractionImageUrl = (path) => {
  if (!path) return null;

  // import.meta.env.DEV là biến tự động của Vite. 
  // Nó sẽ là true khi bạn gõ 'npm run dev', và false khi bạn 'npm run build'
  if (import.meta.env.DEV) {
    return `http://localhost:8080/uploads/${path}`;
  }

  // Trên môi trường Server Production, chỉ cần dùng đường dẫn tương đối.
  // Nginx sẽ tự động hiểu và gắn tên miền https://crmkhdncto.id.vn vào.
  return `/uploads/${path}`;
};