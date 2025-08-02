import axios from "axios";
import { API_BASE_URL } from "../config";

export async function dummyApi() {
    const res = await axios.get(`${API_BASE_URL}/dummy`)
    return res;
}
