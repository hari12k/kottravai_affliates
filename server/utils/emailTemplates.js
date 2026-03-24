const getBaseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kottravai</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { padding: 30px 20px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #8E2A8B; }
        .logo { max-width: 150px; height: auto; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .footer { padding: 30px; text-align: center; background-color: #f9f9f9; color: #888888; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #2D1B4E !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; border: 2px solid #8E2A8B; }
        .info-row { margin-bottom: 12px; }
        .label { font-weight: bold; color: #555555; }
        .value { color: #333333; }
        h1, h2, h3 { color: #2D1B4E; margin-top: 0; }
        .social-links { margin-top: 15px; }
        .social-links a { margin: 0 5px; color: #8E2A8B; text-decoration: none; }
    </style>
</head>
<body>
    <div style="background-color: #f6f6f6; padding: 20px 0;">
        <div class="container">
            <div class="header">
                <img src="data:image/png;base64,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6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJCA6Dqx0lOLBNKH6lnxJtIshpIUBJC6m7r7Y+0u66OubvX" alt="Kottravai Logo" class="logo" style="display:block; margin: 0 auto;">
            </div>
            
            <div class="content">
                ${content}
            </div>
            
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Kottravai. All rights reserved.</p>
                <p>Empowering Rural Women Artisans</p>
                <div class="social-links">
                    <a href="https://kottravai.in">Website</a> | 
                    <a href="https://instagram.com/kottravai">Instagram</a>
                </div>
                <p style="margin-top: 10px;">
                    Vazhai Incubator<br>
                    S Veerachamy Chettiar college,<br>
                    Puliyangudi - 627855
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const getB2BAdminTemplate = (data) => {
    const content = `
        <h2>New B2B Inquiry Received</h2>
        <p>You have received a new inquiry from the B2B contact form. Here are the details:</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div class="info-row">
                <span class="label">Contact Name:</span> <br>
                <span class="value">${data.name}</span>
            </div>
            <div class="info-row">
                <span class="label">Email:</span> <br>
                <span class="value"><a href="mailto:${data.email}" style="color: #8E2A8B;">${data.email}</a></span>
            </div>
            <div class="info-row">
                <span class="label">Phone:</span> <br>
                <span class="value"><a href="tel:${data.phone}" style="color: #8E2A8B;">${data.phone}</a></span>
            </div>
            <div class="info-row">
                <span class="label">Company / Business:</span> <br>
                <span class="value">${data.company || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="label">Location:</span> <br>
                <span class="value">${data.location}</span>
            </div>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 15px 0;">
            <div class="info-row">
                <span class="label">Interested Products:</span> <br>
                <span class="value">${data.products}</span>
            </div>
            <div class="info-row">
                <span class="label">Approx. Quantity:</span> <br>
                <span class="value">${data.quantity}</span>
            </div>
            <div class="info-row">
                <span class="label">Additional Notes:</span> <br>
                <p class="value" style="margin-top: 5px;">${data.notes || 'None'}</p>
            </div>
        </div>
        
        <p style="text-align: center;">
            <a href="mailto:${data.email}" class="btn">Reply to Inquiry</a>
        </p>
    `;
    return getBaseLayout(content);
};

const getB2BUserTemplate = (data) => {
    const content = `
        <h2>Thank You for Your Inquiry</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for reaching out to <strong>Kottravai</strong> regarding your corporate gifting requirements.</p>
        <p>We have successfully received your inquiry for <strong>${data.products}</strong>.</p>
        <p>Our team is currently reviewing your request and will get back to you within 24 hours to discuss how we can tailor our authentic, handmade products for your needs.</p>
        
        <div style="background-color: #fdf4fc; padding: 15px; border-left: 4px solid #8E2A8B; margin: 25px 0;">
            <p style="margin: 0; font-style: italic; color: #555;">
                "Every gift you choose empowers rural women artisans and sustains traditional craftsmanship."
            </p>
        </div>

        <p>If you have any urgent questions, please feel free to reply to this email or call us at <strong style="color: #2D1B4E;">+91 97870 30811</strong>.</p>
        
        <p>Warm Regards,<br>Team Kottravai</p>
        
        <p style="text-align: center;">
            <a href="https://kottravai.in" class="btn">Visit Our Website</a>
        </p>
    `;
    return getBaseLayout(content);
};

const getContactAdminTemplate = (data) => {
    const content = `
        <h2>New Contact Form Submission</h2>
        <p>You have received a new message from the website contact form.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div class="info-row">
                <span class="label">Name:</span> <br>
                <span class="value">${data.name}</span>
            </div>
            <div class="info-row">
                <span class="label">Email:</span> <br>
                <span class="value"><a href="mailto:${data.email}" style="color: #8E2A8B;">${data.email}</a></span>
            </div>
            <div class="info-row">
                <span class="label">Subject:</span> <br>
                <span class="value">${data.subject || 'General Inquiry'}</span>
            </div>
            <div class="info-row">
                <span class="label">Message:</span> <br>
                <p class="value" style="margin-top: 5px; white-space: pre-wrap;">${data.message}</p>
            </div>
        </div>
        
        <p style="text-align: center;">
            <a href="mailto:${data.email}" class="btn">Reply to Message</a>
        </p>
    `;
    return getBaseLayout(content);
};

const getContactUserTemplate = (data) => {
    const content = `
        <h2>We Received Your Message</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for contacting <strong>Kottravai</strong>. We have received your message regarding "<strong>${data.subject || 'General Inquiry'}</strong>".</p>
        <p>Our team will review your message and get back to you as soon as possible.</p>
        
        <p>If your inquiry is urgent, please call us directly at <strong style="color: #2D1B4E;">+91 97870 30811</strong>.</p>
        
        <p>Warm Regards,<br>Team Kottravai</p>
    `;
    return getBaseLayout(content);
};

const getOrderAdminTemplate = (order) => {
    const itemsList = order.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name} (x${item.quantity})</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    const content = `
        <h2>New Order Received!</h2>
        <p>You have received a new order (<strong>#${order.orderId}</strong>) from <strong>${order.customerName}</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Customer Details</h3>
            <p>
                <strong>Name:</strong> ${order.customerName}<br>
                <strong>Email:</strong> ${order.customerEmail}<br>
                <strong>Phone:</strong> ${order.customerPhone}<br>
                <strong>Address:</strong><br>
                ${order.address}, ${order.city} - ${order.pincode}
            </p>

            <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-top: 20px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #eee;">
                        <th style="padding: 8px; text-align: left;">Item</th>
                        <th style="padding: 8px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsList}
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border-top: 2px solid #ddd;">Grand Total</td>
                        <td style="padding: 8px; font-weight: bold; border-top: 2px solid #ddd; text-align: right;">₹${order.total}</td>
                    </tr>
                </tbody>
            </table>
            <p style="margin-top: 15px;"><strong>Payment ID:</strong> ${order.paymentId}</p>
        </div>
    `;
    return getBaseLayout(content);
};

const getOrderUserTemplate = (order) => {
    const itemsList = order.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br>
                <span style="font-size: 12px; color: #666;">Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    const content = `
        <h2>Order Confirmation</h2>
        <p>Dear ${order.customerName},</p>
        <p>Thank you for shopping with <strong>Kottravai</strong>! Your order has been successfully placed.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">
                <span><strong>Order ID:</strong> #${order.orderId}</span>
                <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    ${itemsList}
                    <tr>
                        <td style="padding: 10px 8px; font-weight: bold; border-top: 2px solid #ddd;">Total Paid</td>
                        <td style="padding: 10px 8px; font-weight: bold; border-top: 2px solid #ddd; text-align: right; color: #8E2A8B; font-size: 18px;">₹${order.total}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 20px; font-size: 14px; color: #555;">
                <p><strong>Shipping Address:</strong><br>
                ${order.address}, ${order.city} - ${order.pincode}<br>
                Phone: ${order.customerPhone}</p>
            </div>
        </div>

        <p>We will notify you once your package is shipped. Usually, it takes 3-7 business days for delivery.</p>
        
        <p style="text-align: center;">
            <a href="https://kottravai.in/shop" class="btn">Continue Shopping</a>
        </p>
    `;
    return getBaseLayout(content);
};

const getAffiliateWelcomeTemplate = (data) => {
    const content = `
        <h1 style="color: #2D1B4E;">Welcome to the Kottravai Family!</h1>
        <p>Dear ${data.name},</p>
        <p>Congratulations! We are thrilled to inform you that your application for the <strong>Kottravai Affiliate Program</strong> has been <strong>Approved</strong>.</p>
        
        <p>You are now a part of our mission to empower rural women artisans. As a Kottravai Ambassador, you can start earning commissions by sharing our authentic handmade products with your community.</p>
        
        <div style="background-color: #fdf4fc; padding: 25px; border-radius: 12px; border: 1px solid #f8d7f3; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #8E2A8B;">Your Account Credentials</h3>
            <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #555;">Dashboard URL:</span><br>
                <a href="https://kottravai.in/affiliate/login" style="color: #8E2A8B;">kottravai.in/affiliate/login</a>
            </div>
            <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #555;">Email:</span><br>
                <span style="color: #333;">${data.email}</span>
            </div>
            <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #555;">Temporary Password:</span><br>
                <span style="background-color: #fff; padding: 4px 8px; border: 1px dashed #8E2A8B; font-family: monospace; font-weight: bold; color: #2D1B4E;">${data.password}</span>
            </div>
            <div style="margin-bottom: 0;">
                <span style="font-weight: bold; color: #555;">Your Referral Code:</span><br>
                <span style="font-size: 18px; font-weight: 2000; color: #8E2A8B;">${data.referral_code}</span>
            </div>
        </div>

        <h3 style="color: #2D1B4E;">Next Steps:</h3>
        <ol style="color: #555; line-height: 1.8;">
            <li>Login to your dashboard using the credentials above.</li>
            <li>Change your temporary password in the Account Settings.</li>
            <li>Complete your profile and add your <strong>UPI ID / Bank Details</strong> for payouts.</li>
            <li>Generate your unique affiliate links and start sharing!</li>
        </ol>

        <p>If you have any questions, please reach out to our affiliate support team at <a href="mailto:affiliates@kottravai.in" style="color: #8E2A8B;">affiliates@kottravai.in</a>.</p>
        
        <p>Warm Regards,<br><strong>Team Kottravai</strong></p>
    `;
    return getBaseLayout(content);
};

module.exports = {
    getB2BAdminTemplate,
    getB2BUserTemplate,
    getContactAdminTemplate,
    getContactUserTemplate,
    getOrderAdminTemplate,
    getOrderUserTemplate,
    getAffiliateWelcomeTemplate
};
