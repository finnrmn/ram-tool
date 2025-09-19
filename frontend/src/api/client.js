import axios from "axios";
const api = axios.create({
    baseURL: "http://localhost:8000/api",
    timeout: 10000,
});
export const health = async () => {
    const response = await api.get("/health");
    return response.data;
};
export const convert = async (payload) => {
    const response = await api.post("/convert", payload);
    return response.data;
};
export const solveRbd = async (scenario) => {
    const response = await api.post("/solve/rbd", scenario);
    return response.data;
};
export default api;
