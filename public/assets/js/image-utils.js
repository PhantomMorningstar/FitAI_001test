(function exposeImageUtils(root) {
    const MAX_DIMENSION = 1600;
    const MAX_PREPARED_BYTES = 4 * 1024 * 1024;
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
            let size = calculateContainSize(bitmap.width, bitmap.height);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Không thể xử lý ảnh trên trình duyệt này.');
            let imageDataUrl;
            let quality = 0.82;
            do {
                canvas.width = size.width;
                canvas.height = size.height;
                context.drawImage(bitmap, 0, 0, size.width, size.height);
                imageDataUrl = canvas.toDataURL('image/jpeg', quality);
                const preparedBytes = Math.floor((imageDataUrl.length - imageDataUrl.indexOf(',') - 1) * 3 / 4);
                if (preparedBytes <= MAX_PREPARED_BYTES) return imageDataUrl;
                if (quality > 0.58) quality -= 0.12;
                else size = calculateContainSize(size.width * 0.8, size.height * 0.8);
            } while (Math.max(size.width, size.height) > 320);
            throw new Error('Ảnh không thể được nén đủ nhỏ. Hãy chọn ảnh có độ phân giải thấp hơn.');
        } finally {
            bitmap.close();
        }
    }

    const api = {
        ALLOWED_TYPES,
        calculateContainSize,
        MAX_DIMENSION,
        MAX_PREPARED_BYTES,
        MAX_SOURCE_BYTES,
        prepareImageFile,
        validateImageFile
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIImageUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
