/**
 * Password Encoding Utility
 * 
 * 提供简单的密码编码/解码功能，用于在配置文件中保护密码不被直接读取。
 * 注意：这不是密码学安全的加密，仅用于防止明文存储。
 * 如需更高安全性，应使用系统级密钥管理。
 */

const ENCODING_PREFIX = 'nmenc:'

/**
 * 生成机器特定的密钥
 * 使用hostname和应用路径组合生成密钥，使配置文件在不同机器上不可移植
 */
function getMachineKey(): string {
  try {
    // 在浏览器环境中，使用 navigator 信息
    const hostname = window.location.hostname || 'localhost'
    const origin = window.location.origin || 'file://'
    // 组合生成机器特定密钥
    return `NetMount_${hostname}_${origin}_2024!`
  } catch {
    // 回退到固定密钥（向后兼容）
    return 'NetMount2024!'
  }
}

/**
 * 简单的 XOR 编码函数
 * 使用机器特定的密钥对密码进行 XOR 编码，然后 base64 编码
 */
function xorEncode(input: string, key: string): string {
  let result = ''
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return result
}

/**
 * 编码密码（用于存储）
 * @param plainPassword 明文密码
 * @returns 编码后的密码（带前缀标识）
 */
export function encodePassword(plainPassword: string): string {
  if (!plainPassword) return ''
  
  // 如果已经编码过，直接返回
  if (plainPassword.startsWith(ENCODING_PREFIX)) {
    return plainPassword
  }
  
  // 使用机器特定密钥进行 XOR 编码 + base64
  const key = getMachineKey()
  const encoded = xorEncode(plainPassword, key)
  const base64 = btoa(unescape(encodeURIComponent(encoded)))
  
  return ENCODING_PREFIX + base64
}

/**
 * 解码密码（用于使用）
 * @param encodedPassword 编码后的密码
 * @returns 明文密码
 */
export function decodePassword(encodedPassword: string): string {
  if (!encodedPassword) return ''
  
  // 如果不是编码格式，认为是明文（向后兼容）
  if (!encodedPassword.startsWith(ENCODING_PREFIX)) {
    return encodedPassword
  }
  
  try {
    const base64 = encodedPassword.slice(ENCODING_PREFIX.length)
    const encoded = decodeURIComponent(escape(atob(base64)))
    const key = getMachineKey()
    return xorEncode(encoded, key) // XOR 编码和解码是同一个操作
  } catch {
    // 解码失败，返回原值（可能是旧格式）
    return encodedPassword
  }
}

/**
 * 检查密码是否已编码
 * @param password 密码字符串
 * @returns 是否已编码
 */
export function isPasswordEncoded(password: string): boolean {
  return password.startsWith(ENCODING_PREFIX)
}
