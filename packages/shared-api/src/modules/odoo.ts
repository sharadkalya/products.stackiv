import axios from 'axios';

import { API_BASE_URL } from '../config';
import { OdooConnectionPayload, OdooTestConnectionResponse, OdooConnectionResponse, OdooStatusResponse } from 'shared-types';

export async function getOdooStatus(): Promise<OdooStatusResponse> {
    const response = await axios.get(
        `${API_BASE_URL}/odoo/status`,
        { withCredentials: true },
    );
    return response.data;
}

export async function initOdooDashboard(): Promise<{ message: string }> {
    const response = await axios.get(
        `${API_BASE_URL}/odoo/init`,
        { withCredentials: true },
    );
    return response.data;
}

export async function getOdooDashboard(): Promise<{ message: string }> {
    const response = await axios.get(
        `${API_BASE_URL}/odoo/dashboard`,
        { withCredentials: true },
    );
    return response.data;
}

export async function testOdooConnection(payload: OdooConnectionPayload): Promise<OdooTestConnectionResponse> {
    const response = await axios.post(
        `${API_BASE_URL}/odoo/test-connection`,
        payload,
        { withCredentials: true },
    );
    return response.data;
}

export async function saveOdooConnection(payload: OdooConnectionPayload): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(
        `${API_BASE_URL}/odoo/save-connection`,
        payload,
        { withCredentials: true },
    );
    return response.data;
}

export async function getOdooConnection(): Promise<OdooConnectionResponse> {
    const response = await axios.get(
        `${API_BASE_URL}/odoo/connection`,
        { withCredentials: true },
    );
    return response.data;
}
