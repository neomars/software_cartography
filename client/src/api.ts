import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface Software {
    id: string;
    name: string;
    parent_id: string | null;
    children: string[];
    acces: boolean;
    description: string;
    intranet: string;
    sdan: string;
    ministere: string;
    logo: string | null;
}

export interface Service {
    id: string;
    name: string;
    color: string;
    children: string[];
    parent_id: string | null;
    logo: string | null;
}

export interface Settings {
    appName: string;
    linkOpacity: number;
}

export const getSoftwares = () => axios.get<Software[]>(`${API_BASE_URL}/softwares`);
export const createSoftware = (data: Partial<Software>) => axios.post<Software>(`${API_BASE_URL}/softwares`, data);
export const updateSoftware = (id: string, data: Partial<Software>) => axios.put<Software>(`${API_BASE_URL}/softwares/${id}`, data);
export const deleteSoftware = (id: string) => axios.delete(`${API_BASE_URL}/softwares/${id}`);

export const getServices = () => axios.get<Service[]>(`${API_BASE_URL}/services`);
export const createService = (data: Partial<Service>) => axios.post<Service>(`${API_BASE_URL}/services`, data);
export const updateService = (id: string, data: Partial<Service>) => axios.put<Service>(`${API_BASE_URL}/services/${id}`, data);
export const deleteService = (id: string) => axios.delete(`${API_BASE_URL}/services/${id}`);

export const importCSV = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_BASE_URL}/import-csv`, formData);
};

export const uploadLogo = (type: 'software' | 'service', id: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return axios.post(`${API_BASE_URL}/upload-logo/${type}/${id}`, formData);
};

export const getSettings = () => axios.get<Settings>(`${API_BASE_URL}/settings`);
export const updateSettings = (data: Partial<Settings>) => axios.put<Settings>(`${API_BASE_URL}/settings`, data);

export const getAllData = () => axios.get<{ softwares: Software[], services: Service[], settings: Settings }>(`${API_BASE_URL}/data`);
