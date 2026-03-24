export const generateWhatsAppLink = (params: {
    productName: string;
    productId: string;
    price: number | string;
    quantity: number;
    size?: string;
    color?: string;
    customerCity?: string;
}) => {
    const WHATSAPP_NUMBER = "916385792718";

    const message = `Hello, I'm interested in ${params.productName} (ID: ${params.productId}). Price: ₹${params.price}. Qty: ${params.quantity}. ${params.size ? `Size: ${params.size}` : ""}`;
    const encodedMessage = encodeURIComponent(message);

    // Check if we are on a mobile device to use deep linking if needed
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
};

export const openWhatsApp = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
};
