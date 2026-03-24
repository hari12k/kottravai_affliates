/**
 * Example: Shiprocket Integration in Order Flow
 * This file demonstrates how to integrate Shiprocket into your order processing
 */

const shiprocketService = require('./services/shiprocketService');

/**
 * Example 1: Create shipment after successful payment
 * This would typically be called in your payment verification endpoint
 */
async function createShipmentAfterPayment(orderDetails) {
    try {
        console.log('Creating shipment for order:', orderDetails.orderId);

        // Prepare order data for Shiprocket
        const shiprocketOrderData = {
            orderId: orderDetails.orderId,
            orderDate: new Date().toISOString().split('T')[0],

            customer: {
                firstName: orderDetails.customer.firstName,
                lastName: orderDetails.customer.lastName,
                email: orderDetails.customer.email,
                phone: orderDetails.customer.phone,
                address: orderDetails.customer.address,
                city: orderDetails.customer.city,
                state: orderDetails.customer.state,
                pincode: orderDetails.customer.pincode,
                country: 'India',
            },

            // If shipping address is different from billing
            shippingAddress: orderDetails.shippingAddress || null,

            items: orderDetails.items.map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount || 0,
                tax: item.tax || 0,
            })),

            payment: {
                method: orderDetails.paymentMethod, // 'prepaid' or 'cod'
            },

            // Optional: Provide package dimensions
            dimensions: {
                length: 10,
                breadth: 10,
                height: 10,
                weight: 0.5,
            },
        };

        // Create order in Shiprocket
        const result = await shiprocketService.createOrder(shiprocketOrderData);

        // Save shipment details to your database
        // await saveShipmentToDatabase({
        //   orderId: orderDetails.orderId,
        //   shiprocketOrderId: result.orderId,
        //   shipmentId: result.shipmentId,
        //   status: result.status,
        // });

        console.log('✅ Shipment created successfully:', result);
        return result;

    } catch (error) {
        console.error('❌ Failed to create shipment:', error.message);
        throw error;
    }
}

/**
 * Example 2: Complete order fulfillment workflow
 * This includes creating order, selecting courier, generating AWB, and scheduling pickup
 */
async function completeOrderFulfillment(orderDetails) {
    try {
        // Step 1: Create order in Shiprocket
        console.log('Step 1: Creating order in Shiprocket...');
        const orderResult = await shiprocketService.createOrder(orderDetails);
        const shipmentId = orderResult.shipmentId;

        // Step 2: Get available couriers
        console.log('Step 2: Fetching available couriers...');
        const couriers = await shiprocketService.getAvailableCouriers(shipmentId);

        if (couriers.length === 0) {
            throw new Error('No couriers available for this shipment');
        }

        // Select the recommended courier (usually first in the list)
        const selectedCourier = couriers[0];
        console.log(`Selected courier: ${selectedCourier.courier_name}`);

        // Step 3: Generate AWB
        console.log('Step 3: Generating AWB...');
        const awbResult = await shiprocketService.generateAWB(
            shipmentId,
            selectedCourier.courier_company_id
        );

        // Step 4: Schedule pickup
        console.log('Step 4: Scheduling pickup...');
        const pickupResult = await shiprocketService.schedulePickup(shipmentId);

        // Step 5: Generate shipping label
        console.log('Step 5: Generating shipping label...');
        const labelResult = await shiprocketService.generateLabel(shipmentId);

        console.log('✅ Order fulfillment completed successfully!');

        return {
            orderId: orderResult.orderId,
            shipmentId: shipmentId,
            awbCode: awbResult.awbCode,
            courierName: awbResult.courierName,
            pickupToken: pickupResult.pickupTokenNumber,
            labelUrl: labelResult.labelUrl,
        };

    } catch (error) {
        console.error('❌ Order fulfillment failed:', error.message);
        throw error;
    }
}

/**
 * Example 3: Track shipment
 */
async function trackOrder(shipmentId) {
    try {
        const trackingData = await shiprocketService.trackShipment(shipmentId);
        console.log('Tracking data:', trackingData);
        return trackingData;
    } catch (error) {
        console.error('❌ Tracking failed:', error.message);
        throw error;
    }
}

/**
 * Example 4: Cancel shipment
 */
async function cancelOrder(shipmentId) {
    try {
        const result = await shiprocketService.cancelShipment(shipmentId);
        console.log('✅ Order cancelled:', result);
        return result;
    } catch (error) {
        console.error('❌ Cancellation failed:', error.message);
        throw error;
    }
}

/**
 * Example 5: Integration with your existing payment verification endpoint
 * Add this to your server/index.js payment verification route
 */
/*
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;

    // Verify Razorpay payment signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Save order to database
    const savedOrder = await saveOrderToDatabase(orderDetails);

    // Create shipment in Shiprocket
    try {
      const shipmentResult = await createShipmentAfterPayment({
        orderId: savedOrder.id,
        customer: orderDetails.customer,
        items: orderDetails.items,
        paymentMethod: 'prepaid',
      });

      // Update order with shipment details
      await updateOrderShipment(savedOrder.id, {
        shiprocketOrderId: shipmentResult.orderId,
        shipmentId: shipmentResult.shipmentId,
      });

      console.log('✅ Order and shipment created successfully');
    } catch (shipmentError) {
      // Log error but don't fail the order
      console.error('⚠️ Shipment creation failed, will retry later:', shipmentError.message);
    }

    // Send confirmation email
    await sendOrderConfirmationEmail(orderDetails);

    res.json({ 
      success: true, 
      message: 'Payment verified and order created',
      orderId: savedOrder.id,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});
*/

module.exports = {
    createShipmentAfterPayment,
    completeOrderFulfillment,
    trackOrder,
    cancelOrder,
};
