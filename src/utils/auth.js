// src/utils/auth.js
// 存储 Token 的 key（自定义，建议统一）
const TOKEN_KEY = 'medical_research_token';

/**
 * 获取本地存储的 Token
 * @returns {string|null} Token字符串或null
 */
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

/**
 * 设置 Token 到本地存储
 * @param {string} token - JWT Token
 * @param {boolean} rememberMe - 是否持久化（true: localStorage，false: sessionStorage）
 */
export const setToken = (token, rememberMe = false) => {
    if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
};

/**
 * 移除本地存储的 Token
 */
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
};