/**
 * Safe wrapper for localStorage.setItem to handle QuotaExceededError
 * especially when storing base64 images or large lists.
 */
export const safeSetItem = (key: string, value: string): boolean => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        if (error instanceof DOMException && (
            error.code === 22 ||
            error.code === 1014 ||
            error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        )) {
            // Quota exceeded is common with large product lists, fail silently
            // as this is just a cache and will be refetched.
            localStorage.removeItem(key);
            return false;
        }
        throw error;
    }
};

export const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error(`Error reading from localStorage for key: ${key}`, error);
        return null;
    }
};
