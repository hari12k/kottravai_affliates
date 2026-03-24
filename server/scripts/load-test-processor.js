const states = [
    'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh',
    'Telangana', 'Maharashtra', 'Delhi', 'Gujarat'
];

function generateCartData(requestParams, context, ee, next) {
    const total = Math.floor(Math.random() * 2000) + 200; // Random total 200-2200
    context.vars.cartTotal = total;
    context.vars.state = states[Math.floor(Math.random() * states.length)];
    return next();
}

function prepareOrderData(requestParams, context, ee, next) {
    // This function mimics the frontend logic to calculate the total to send to the backend
    // If the backend validation is working, it should accept valid totals and reject manipulated ones.

    // Hardcoded logic for simulation purposes (should match server rules)
    let shipping = 125;
    if (context.vars.state === 'Tamil Nadu') {
        shipping = context.vars.cartTotal >= 599 ? 0 : 75;
    } else if (['Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana'].includes(context.vars.state)) {
        shipping = context.vars.cartTotal >= 799 ? 0 : 99;
    } else {
        shipping = context.vars.cartTotal >= 999 ? 0 : 125;
    }

    context.vars.totalWithShipping = context.vars.cartTotal + shipping;
    context.vars.items = [
        { id: "test-prod-1", name: "Load Test Item", price: context.vars.cartTotal, quantity: 1 }
    ];

    // In a real test, you'd fetch a valid JWT token first
    context.vars.testToken = "MOCK_TOKEN_OR_REAL_TEST_TOKEN";

    return next();
}

module.exports = {
    generateCartData,
    prepareOrderData
};
