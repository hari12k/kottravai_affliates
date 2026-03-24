require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * Shiprocket Service
 * Production-ready service for Shiprocket API integration
 */

class ShiprocketService {
    constructor() {
        this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
        this.token = null;
        this.tokenExpiry = null;
        this.email = process.env.SHIPROCKET_EMAIL;
        this.password = process.env.SHIPROCKET_PASSWORD;
        this.defaultPickupLocation = 'Coconut Shell Hub'; // Validated from available locations
    }

    /**
     * Authenticate with Shiprocket API
     * Caches token for reuse
     */
    async authenticate() {
        // Return cached token if still valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.email,
                    password: this.password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                this.token = data.token;
                // Cache token for 23 hours (tokens typically valid for 24 hours)
                this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
                console.log('✅ Shiprocket authentication successful');
                return this.token;
            } else {
                console.error('❌ Shiprocket authentication failed:', data);
                throw new Error(`Authentication failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Shiprocket authentication error:', error.message);
            throw error;
        }
    }

    /**
     * Ensure we have a valid token before making API calls
     */
    async ensureAuthenticated() {
        if (!this.token || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
            await this.authenticate();
        }
        return this.token;
    }

    /**
     * Fetch available pickup locations
     */
    async getPickupLocations() {
        try {
            await this.ensureAuthenticated();

            const response = await fetch(`${this.baseUrl}/settings/company/pickup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            const data = await response.json();

            if (response.ok && data.data) {
                return data.data.shipping_address || [];
            } else {
                throw new Error(`Failed to fetch pickup locations: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error fetching pickup locations:', error.message);
            throw error;
        }
    }

    /**
     * Create order in Shiprocket
     * @param {Object} orderData - Order details from your system
     */
    async createOrder(orderData) {
        try {
            await this.ensureAuthenticated();

            // Prepare Shiprocket order payload
            const shiprocketPayload = this.prepareOrderPayload(orderData);

            const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify(shiprocketPayload),
            });

            const data = await response.json();

            if (response.ok && data.order_id) {
                console.log(`✅ Shiprocket order created: ${data.order_id}, Shipment: ${data.shipment_id}`);
                return {
                    success: true,
                    orderId: data.order_id,
                    shipmentId: data.shipment_id,
                    status: data.status,
                    channelOrderId: data.channel_order_id,
                    fullResponse: data,
                };
            } else {
                console.error('❌ Failed to create Shiprocket order:', data);
                throw new Error(`Order creation failed: ${data.message || JSON.stringify(data.errors || {})}`);
            }
        } catch (error) {
            console.error('❌ Error creating Shiprocket order:', error.message);
            throw error;
        }
    }

    /**
     * Prepare order payload for Shiprocket API
     * Maps your order data to Shiprocket's expected format
     */
    prepareOrderPayload(orderData) {
        const {
            orderId,
            orderDate,
            customer,
            shippingAddress,
            items,
            payment,
            dimensions,
            pickupLocation,
        } = orderData;

        // Calculate totals
        const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            order_id: orderId,
            order_date: orderDate || new Date().toISOString().split('T')[0],
            pickup_location: pickupLocation || this.defaultPickupLocation,

            // Billing details (customer info)
            billing_customer_name: customer.firstName || customer.name?.split(' ')[0] || 'Customer',
            billing_last_name: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
            billing_address: customer.address || shippingAddress.address,
            billing_city: customer.city || shippingAddress.city,
            billing_pincode: customer.pincode || shippingAddress.pincode,
            billing_state: customer.state || shippingAddress.state,
            billing_country: customer.country || shippingAddress.country || 'India',
            billing_email: customer.email,
            billing_phone: customer.phone,

            // Shipping details
            shipping_is_billing: shippingAddress ? false : true,
            ...(shippingAddress && {
                shipping_customer_name: shippingAddress.firstName || shippingAddress.name?.split(' ')[0] || customer.firstName,
                shipping_last_name: shippingAddress.lastName || shippingAddress.name?.split(' ').slice(1).join(' ') || customer.lastName,
                shipping_address: shippingAddress.address,
                shipping_city: shippingAddress.city,
                shipping_pincode: shippingAddress.pincode,
                shipping_state: shippingAddress.state,
                shipping_country: shippingAddress.country || 'India',
                shipping_email: shippingAddress.email || customer.email,
                shipping_phone: shippingAddress.phone || customer.phone,
            }),

            // Order items
            order_items: items.map(item => ({
                name: item.name,
                sku: item.sku || `SKU-${item.id}`,
                units: item.quantity,
                selling_price: item.price,
                discount: item.discount || 0,
                tax: item.tax || 0,
                hsn: item.hsn || '',
            })),

            // Payment details
            payment_method: payment.method === 'prepaid' ? 'Prepaid' : 'COD',
            sub_total: subTotal,

            // Package dimensions (use provided or defaults)
            length: dimensions?.length || 10,
            breadth: dimensions?.breadth || 10,
            height: dimensions?.height || 10,
            weight: dimensions?.weight || 0.5,
        };
    }

    /**
     * Get available couriers for a shipment
     */
    async getAvailableCouriers(shipmentId) {
        try {
            await this.ensureAuthenticated();

            const response = await fetch(
                `${this.baseUrl}/courier/serviceability?shipment_id=${shipmentId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok && data.data) {
                return data.data.available_courier_companies || [];
            } else {
                throw new Error(`Failed to fetch couriers: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error fetching available couriers:', error.message);
            throw error;
        }
    }

    /**
     * Generate AWB (Air Waybill) for shipment
     */
    async generateAWB(shipmentId, courierId) {
        try {
            await this.ensureAuthenticated();

            const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify({
                    shipment_id: shipmentId,
                    courier_id: courierId,
                }),
            });

            const data = await response.json();

            if (response.ok && data.awb_assign_status === 1) {
                console.log(`✅ AWB generated for shipment ${shipmentId}: ${data.response.data.awb_code}`);
                return {
                    success: true,
                    awbCode: data.response.data.awb_code,
                    courierName: data.response.data.courier_name,
                };
            } else {
                throw new Error(`AWB generation failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error generating AWB:', error.message);
            throw error;
        }
    }

    /**
     * Schedule pickup for shipment
     */
    async schedulePickup(shipmentId) {
        try {
            await this.ensureAuthenticated();

            const response = await fetch(`${this.baseUrl}/courier/generate/pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify({
                    shipment_id: [shipmentId],
                }),
            });

            const data = await response.json();

            if (response.ok && data.pickup_status === 1) {
                console.log(`✅ Pickup scheduled for shipment ${shipmentId}`);
                return {
                    success: true,
                    pickupTokenNumber: data.response.pickup_token_number,
                };
            } else {
                throw new Error(`Pickup scheduling failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error scheduling pickup:', error.message);
            throw error;
        }
    }

    /**
     * Track shipment
     */
    async trackShipment(shipmentId) {
        try {
            await this.ensureAuthenticated();

            const response = await fetch(
                `${this.baseUrl}/courier/track/shipment/${shipmentId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                return data.tracking_data || {};
            } else {
                throw new Error(`Tracking failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error tracking shipment:', error.message);
            throw error;
        }
    }

    /**
     * Cancel shipment
     */
    async cancelShipment(shipmentIds) {
        try {
            await this.ensureAuthenticated();

            const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];

            const response = await fetch(`${this.baseUrl}/orders/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify({
                    ids: ids,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`✅ Shipment(s) cancelled: ${ids.join(', ')}`);
                return {
                    success: true,
                    message: data.message,
                };
            } else {
                throw new Error(`Cancellation failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error cancelling shipment:', error.message);
            throw error;
        }
    }

    /**
     * Generate shipping label
     */
    async generateLabel(shipmentIds) {
        try {
            await this.ensureAuthenticated();

            const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];

            const response = await fetch(`${this.baseUrl}/courier/generate/label`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify({
                    shipment_id: ids,
                }),
            });

            const data = await response.json();

            if (response.ok && data.label_url) {
                console.log(`✅ Label generated for shipment(s): ${ids.join(', ')}`);
                return {
                    success: true,
                    labelUrl: data.label_url,
                };
            } else {
                throw new Error(`Label generation failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error generating label:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new ShiprocketService();
