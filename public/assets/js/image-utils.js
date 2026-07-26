(function exposeImageUtils(root) {
    const MAX_DIMENSION = 1600;
    const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
    const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

    function calculateContainSize(width, height, maxDimension = MAX_DIMENSION) {
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            throw new Error('Kích thước ảnh không hợp lệ.');
        }
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        return { width: Math.round(width * scale), height: Math.round(height * scale) };
    }

    function validateImageFile(file) {
        if (!file) return { valid: false, error: 'Hãy chọn một ảnh món ăn.' };
        if (!ALLOWED_TYPES.has(file.type)) return { valid: false, error: 'Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF.' };
        if (file.size > MAX_SOURCE_BYTES) return { valid: false, error: 'Ảnh gốc phải nhỏ hơn hoặc bằng 20 MB.' };
        return { valid: true };
    }

    async function prepareImageFile(file) {
        const validation = validateImageFile(file);
        if (!validation.valid) throw new Error(validation.error);
        const bitmap = await createImageBitmap(file);
        try {
            const size = calculateContainSize(bitmap.width, bitmap.height);
            const canvas = document.createElement('canvas');
            canvas.width = size.width;
            canvas.height = size.height;
            canvas.getContext('2d').drawImage(bitmap, 0, 0, size.width, size.height);
            return canvas.toDataURL('image/jpeg', 0.84);
        } finally {
            bitmap.close();
        }
    }

    const api = { ALLOWED_TYPES, calculateContainSize, MAX_DIMENSION, MAX_SOURCE_BYTES, prepareImageFile, validateImageFile };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIImageUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
