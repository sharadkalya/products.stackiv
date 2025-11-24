import axios from 'axios';

import { API_BASE_URL } from '../config';
import { OdooConnectionPayload, OdooTestConnectionResponse, OdooConnectionResponse } from 'shared-types';

export async function testOdooConnection(payload: OdooConnectionPayload): Promise<OdooTestConnectionResponse> {
    const response = await axios.post(
        `${API_BASE_URL}/odoo/test-connection`,
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
