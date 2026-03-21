import axiosClient from "../config/axios";

export const getDashboardMetrics = () => {
    return axiosClient.get("/dashboard");
};

