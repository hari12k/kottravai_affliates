/**
 * Utility to optimize Supabase Storage URLs by adding transformation parameters.
 * Helps reduce bandwidth usage (egress) by requesting resized versions of images.
 */

interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'origin';
    resize?: 'cover' | 'contain' | 'fill';
}

export const getOptimizedImage = (url: string | undefined, _options: ImageOptions = {}) => {
    if (!url) return '';

    // DISABLED: Supabase Image Transformation requires a Pro/Enterprise plan.
    // Re-enable this only if the Supabase project has image transformation enabled.
    /*
    if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/')) {
        let optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');

        const params: string[] = [];
        if (options.width) params.push(`width=${options.width}`);
        if (options.height) params.push(`height=${options.height}`);
        if (options.quality) params.push(`quality=${options.quality}`);
        if (options.format && options.format !== 'origin') params.push(`format=${options.format}`);
        if (options.resize) params.push(`resize=${options.resize}`);

        if (params.length > 0) {
            optimizedUrl += (optimizedUrl.includes('?') ? '&' : '?') + params.join('&');
        }

        return optimizedUrl;
    }
    */
    // Only apply transformation logic if we are using a supported CDN that allows on-the-fly resizing
    // (Future: add Cloudinary/Imgix logic here if needed)

    return url;
};

/**
 * Standard sizes for common UI elements
 */
export const IMAGE_SIZES = {
    THUMBNAIL: { width: 150, quality: 60 },
    CARD: { width: 400, quality: 75 },
    HERO: { width: 1200, quality: 80 },
    PRODUCT_DETAIL: { width: 800, quality: 80 }
};
