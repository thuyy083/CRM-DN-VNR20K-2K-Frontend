import axiosClient from "../config/axios";

export const getDashboardMetrics = (month, year) => {
    return axiosClient.get("/dashboard", {
        params: { month, year },
    });
};

export const getRegionDetail = (month, year) => {
  return axiosClient.get("/dashboard/region-detail", {
    params: { month, year },
  });
};
 