import api from "./api";

export const getWaitlists = () => {
  return api.get("/waitlists");
};

export const addToWaitlist = (data) => {
  return api.post("/waitlists", data);
};

export const approveWaitlist = (id) => {
  return api.put(`/waitlists/${id}/approve`);
};

export const notifyWaitlist = (id) => {
  return api.put(`/waitlists/${id}/notify`);
};

export const deleteWaitlist = (id) => {
  return api.delete(`/waitlists/${id}`);
};