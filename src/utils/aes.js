// 先安装 crypto-js：npm install crypto-js --save
import CryptoJS from 'crypto-js'

// ========== 核心配置（前后端必须完全一致！！！） ==========
// 1. 密钥：严格16位（AES-128），字符数必须是16/24/32
const AES_KEY_STR = 'shenrui123456789' // 先检查：这个字符串长度是15位！！！（修复点1）
const AES_KEY = CryptoJS.enc.Utf8.parse(AES_KEY_STR.padEnd(16, '0')) // 补全为16位，或直接改字符串为16位

// 2. 偏移量：严格16位，字符数必须是16
const AES_IV_STR = '0392039203920300' // 检查：长度是16位，正确
const AES_IV = CryptoJS.enc.Utf8.parse(AES_IV_STR)

/**
 * AES-CBC加密（Base64输出）
 * @param {string} text 要加密的明文
 * @returns {string} Base64格式密文（空字符串返回空）
 */
export const aesEncrypt = (text) => {
    if (!text || typeof text !== 'string') return ''

    try {
        const srcs = CryptoJS.enc.Utf8.parse(text)
        const encrypted = CryptoJS.AES.encrypt(srcs, AES_KEY, {
            iv: AES_IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
        // 核心：返回CryptoJS标准的Base64密文
        return encrypted.toString()
    } catch (error) {
        console.error('AES加密失败:', error)
        return ''
    }
}

/**
 * AES-CBC解密（Base64输入）
 * @param {string} encryptedText Base64格式的密文
 * @returns {string} 解密后的明文（空/错误密文返回空）
 */
export const aesDecrypt = (encryptedText) => {
    if (!encryptedText || typeof encryptedText !== 'string') return ''

    try {
        // 核心：直接传入Base64密文，CryptoJS自动解析
        const decrypted = CryptoJS.AES.decrypt(encryptedText, AES_KEY, {
            iv: AES_IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        })
        // 还原为UTF8明文（处理解密结果为空的边界情况）
        const plainText = decrypted.toString(CryptoJS.enc.Utf8)
        return plainText || ''
    } catch (error) {
        console.error('AES解密失败:', error)
        return ''
    }
}

// 测试用例（可注释，用于验证）
// const testPwd = '123456'
// const encryptPwd = aesEncrypt(testPwd)
// const decryptPwd = aesDecrypt(encryptPwd)
// console.log('原始密码:', testPwd)
// console.log('加密后:', encryptPwd)
// console.log('解密后:', decryptPwd) // 应输出 123456