// src/utils/auth.js
// 存储 Token 的 key（自定义，建议统一）
const TOKEN_KEY = 'medical_research_token';
const USER_INFO = 'medical_research_userInfo';

/**
 * 获取本地存储的 Token
 * @returns {string|null} Token字符串或null
 */
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

export const getUserInfo = () => {
    return JSON.parse(sessionStorage.getItem(USER_INFO))
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

export const setUserInfo = (userInfo) => {
    sessionStorage.setItem(USER_INFO, JSON.stringify(userInfo));
};

/**
 * 移除本地存储的 Token
 */
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_INFO)
};