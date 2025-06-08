export * from "./firebase";

export function login(payload: { email: string; password: string }) {
    console.log("Called login with:", payload);
    return Promise.resolve({ success: true, userId: "dummy-id" });
}

export function signup(payload: { email: string; password: string; name: string }) {
    console.log("Called signup with:", payload);
    return Promise.resolve({ success: true, userId: "dummy-id" });
}
