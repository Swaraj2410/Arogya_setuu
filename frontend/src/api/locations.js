import api from './client';

export const fetchStates = async () => {
  const { data } = await api.get('/locations/states');
  return data;
};

export const fetchDistricts = async (stateCode) => {
  const { data } = await api.get('/locations/districts', { params: { stateCode } });
  return data;
};

export const fetchTalukas = async (districtCode) => {
  const { data } = await api.get('/locations/talukas', { params: { districtCode } });
  return data;
};

export const fetchVillages = async (talukaCode) => {
  const { data } = await api.get('/locations/villages', { params: { talukaCode } });
  return data;
};
