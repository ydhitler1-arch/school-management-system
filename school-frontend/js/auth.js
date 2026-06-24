// API_BASE comes from config.js which is loaded before this script on every page
const API_BASE = CONFIG.API_URL + "/api";

function getToken() {
    return localStorage.getItem("sms_token");
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("sms_user"));
    } catch (err) {
        return null;
    }
}

function clearAuth() {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_user");
}

function logout() {
    clearAuth();
    window.location.href = "/pages/login.html";
}

function requireLogin() {
    if (!getToken()) {
        window.location.href = "/pages/login.html";
    }
}

function requireAdmin() {
    requireLogin();
    const user = getUser();
    if (user && user.role !== "admin") {
        window.location.href = "/index.html";
    }
}

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = Object.assign({}, options.headers, {
        Authorization: token ? `Bearer ${token}` : ""
    });
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (res.status === 401) {
        clearAuth();
        window.location.href = "/pages/login.html";
    }
    return res;
}
