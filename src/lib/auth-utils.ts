/**
 * Clear all authentication-related data from browser storage
 */
export function clearAuthStorage() {
  try {
    // Clear localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // Clear sessionStorage
    const sessionKeysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

    console.log('Cleared authentication storage')
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}

/**
 * Check if the current error is related to invalid tokens
 */
export function isTokenError(error: unknown): boolean {
  if (!error) return false
  
  const message = error.message || error.toString()
  return message.includes('Refresh Token') || 
         message.includes('Invalid') || 
         message.includes('expired') ||
         message.includes('token')
}
