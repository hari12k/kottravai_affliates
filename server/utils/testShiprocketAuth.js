require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * Shiprocket API Authentication Test Module
 * Tests authentication and basic API operations
 */

class ShiprocketAuthTest {
    constructor() {
        this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
        this.token = null;
        this.email = process.env.SHIPROCKET_EMAIL;
        this.password = process.env.SHIPROCKET_PASSWORD;
    }

    /**
     * Step 1: Authenticate with Shiprocket API
     */
    async authenticate() {
        console.log('\n========================================');
        console.log('STEP 1: SHIPROCKET AUTHENTICATION TEST');
        console.log('========================================\n');

        try {
            console.log('Attempting to authenticate...');
            console.log(`Email: ${this.email}`);
            console.log(`Password: ${'*'.repeat(this.password?.length || 0)}`);

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
                console.log('\n✅ Shiprocket Authentication SUCCESS');
                console.log(`Token Generated: ${this.token.substring(0, 20)}...`);
                console.log(`Token Length: ${this.token.length} characters`);
                return { success: true, token: this.token };
            } else {
                console.log('\n❌ Shiprocket Authentication FAILED');
                console.log('Status:', response.status);
                console.log('Response:', JSON.stringify(data, null, 2));
                return { success: false, error: data };
            }
        } catch (error) {
            console.log('\n❌ Shiprocket Authentication ERROR');
            console.log('Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Step 2: Fetch pickup locations
     */
    async fetchPickupLocations() {
        console.log('\n========================================');
        console.log('STEP 2: FETCH PICKUP LOCATIONS');
        console.log('========================================\n');

        if (!this.token) {
            console.log('❌ No authentication token available');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            console.log('Fetching pickup locations...');

            const response = await fetch(`${this.baseUrl}/settings/company/pickup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            const data = await response.json();

            if (response.ok && data.data) {
                console.log('\n✅ Pickup Locations Fetched Successfully');
                console.log(`Total Locations: ${data.data.shipping_address?.length || 0}`);

                if (data.data.shipping_address && data.data.shipping_address.length > 0) {
                    console.log('\nAvailable Pickup Locations:');
                    data.data.shipping_address.forEach((location, index) => {
                        console.log(`\n${index + 1}. ${location.pickup_location}`);
                        console.log(`   Address: ${location.address}, ${location.city}, ${location.state} - ${location.pin_code}`);
                        console.log(`   Phone: ${location.phone}`);
                    });

                    // Return the first pickup location as default
                    const defaultPickup = data.data.shipping_address[0].pickup_location;
                    console.log(`\n📍 Default Pickup Location: "${defaultPickup}"`);
                    return {
                        success: true,
                        locations: data.data.shipping_address,
                        defaultPickup
                    };
                } else {
                    console.log('\n⚠️ No pickup locations found');
                    return { success: true, locations: [], defaultPickup: null };
                }
            } else {
                console.log('\n❌ Failed to Fetch Pickup Locations');
                console.log('Status:', response.status);
                console.log('Response:', JSON.stringify(data, null, 2));
                return { success: false, error: data };
            }
        } catch (error) {
            console.log('\n❌ Error Fetching Pickup Locations');
            console.log('Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Step 3: Create test order
     */
    async createTestOrder(pickupLocation) {
        console.log('\n========================================');
        console.log('STEP 3: CREATE TEST ORDER');
        console.log('========================================\n');

        if (!this.token) {
            console.log('❌ No authentication token available');
            return { success: false, error: 'Not authenticated' };
        }

        if (!pickupLocation) {
            console.log('❌ No pickup location provided');
            return { success: false, error: 'No pickup location' };
        }

        const testOrderPayload = {
            order_id: `TEST-${Date.now()}`,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: pickupLocation,
            billing_customer_name: 'Test',
            billing_last_name: 'User',
            billing_address: 'Chennai test address',
            billing_city: 'Chennai',
            billing_pincode: '600001',
            billing_state: 'Tamil Nadu',
            billing_country: 'India',
            billing_email: 'test@kottravai.in',
            billing_phone: '9876543210',
            shipping_is_billing: true,
            order_items: [
                {
                    name: 'Test product',
                    sku: 'TESTSKU',
                    units: 1,
                    selling_price: 100,
                },
            ],
            payment_method: 'Prepaid',
            sub_total: 100,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
        };

        try {
            console.log('Creating test order...');
            console.log('Order ID:', testOrderPayload.order_id);
            console.log('Pickup Location:', testOrderPayload.pickup_location);

            const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify(testOrderPayload),
            });

            const data = await response.json();

            if (response.ok && data.order_id) {
                console.log('\n✅ Test Order Created Successfully');
                console.log('Order ID:', data.order_id);
                console.log('Shipment ID:', data.shipment_id);
                console.log('Status:', data.status || 'Created');
                console.log('\nFull Response:');
                console.log(JSON.stringify(data, null, 2));
                return {
                    success: true,
                    orderId: data.order_id,
                    shipmentId: data.shipment_id,
                    status: data.status,
                    fullResponse: data
                };
            } else {
                console.log('\n❌ Failed to Create Test Order');
                console.log('Status:', response.status);
                console.log('Response:', JSON.stringify(data, null, 2));
                return { success: false, error: data };
            }
        } catch (error) {
            console.log('\n❌ Error Creating Test Order');
            console.log('Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate final report
     */
    generateReport(authResult, pickupResult, orderResult) {
        console.log('\n\n');
        console.log('========================================');
        console.log('   SHIPROCKET CONNECTION REPORT');
        console.log('========================================\n');

        const report = {
            authStatus: authResult.success ? 'SUCCESS' : 'FAIL',
            tokenGenerated: authResult.success ? 'YES' : 'NO',
            pickupLocationsFetched: pickupResult.success ? 'YES' : 'NO',
            pickupNameUsed: pickupResult.defaultPickup || 'N/A',
            testOrderCreated: orderResult.success ? 'YES' : 'NO',
            shipmentIdReceived: orderResult.shipmentId ? 'YES' : 'NO',
            errorsFound: [],
            integrationReady: false,
        };

        // Collect errors
        if (!authResult.success) {
            report.errorsFound.push('Authentication failed');
        }
        if (!pickupResult.success) {
            report.errorsFound.push('Failed to fetch pickup locations');
        }
        if (!orderResult.success) {
            report.errorsFound.push('Failed to create test order');
        }

        // Determine if integration is ready
        report.integrationReady = authResult.success &&
            pickupResult.success &&
            orderResult.success;

        // Print report
        console.log(`Auth Status: ${report.authStatus}`);
        console.log(`Token Generated: ${report.tokenGenerated}`);
        console.log(`Pickup Locations Fetched: ${report.pickupLocationsFetched}`);
        console.log(`Pickup Name Used: ${report.pickupNameUsed}`);
        console.log(`Test Order Created: ${report.testOrderCreated}`);
        console.log(`Shipment ID Received: ${report.shipmentIdReceived}`);
        console.log(`Errors Found: ${report.errorsFound.length > 0 ? report.errorsFound.join(', ') : 'None'}`);
        console.log(`Integration Ready: ${report.integrationReady ? 'YES ✅' : 'NO ❌'}`);

        console.log('\n========================================\n');

        return report;
    }

    /**
     * Run complete test suite
     */
    async runTests() {
        console.log('\n🚀 Starting Shiprocket API Integration Test...\n');

        // Step 1: Authenticate
        const authResult = await this.authenticate();

        // Step 2: Fetch pickup locations
        let pickupResult = { success: false };
        if (authResult.success) {
            pickupResult = await this.fetchPickupLocations();
        }

        // Step 3: Create test order
        let orderResult = { success: false };
        if (authResult.success && pickupResult.success && pickupResult.defaultPickup) {
            orderResult = await this.createTestOrder(pickupResult.defaultPickup);
        }

        // Generate final report
        const report = this.generateReport(authResult, pickupResult, orderResult);

        return report;
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new ShiprocketAuthTest();
    tester.runTests()
        .then(() => {
            console.log('Test completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Test failed with error:', error);
            process.exit(1);
        });
}

module.exports = ShiprocketAuthTest;
