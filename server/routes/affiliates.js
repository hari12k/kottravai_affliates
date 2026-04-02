const express = require('express');
const db = require('../db');
const supabase = require('../supabase');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');
const { getAffiliateWelcomeTemplate } = require('../utils/emailTemplates');

module.exports = (authenticateToken, authenticateAdmin) => {
    const router = express.Router();

    // 1. Submit Affiliate Application (Public or Auth)
    router.post('/apply', async (req, res) => {
        try {
            const { name, email, phone, city, instagram_link, facebook_link, twitter_link, youtube_link, selling_experience, products_promoted, reason, user_id } = req.body;
            
            // Check if already applied
            const exists = await db.query('SELECT id FROM affiliate_applications WHERE email = $1 AND status != \'rejected\'', [email]);
            if (exists.rows.length > 0) {
                return res.status(400).json({ error: 'An application with this email already exists or is under review' });
            }

            const result = await db.query(
                `INSERT INTO affiliate_applications (name, email, phone, city, instagram_link, facebook_link, twitter_link, youtube_link, selling_experience, products_promoted, reason, user_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [name, email, phone, city, instagram_link, facebook_link, twitter_link, youtube_link, selling_experience, products_promoted, reason, user_id]
            );
            res.status(201).json({ success: true, application: result.rows[0] });
        } catch (err) {
            console.error('Affiliate apply error:', err);
            res.status(500).json({ error: 'Failed to submit application' });
        }
    });

    // 2. Track Affiliate Click (Public)
    router.post('/click', async (req, res) => {
        try {
            const { slug, referrer, userAgent } = req.body;
            // Get link ID
            const linkRes = await db.query('SELECT id FROM affiliate_links WHERE slug = $1 AND is_active = true', [slug]);
            if (linkRes.rows.length === 0) return res.status(404).json({ error: 'Link not found' });
            
            const linkId = linkRes.rows[0].id;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

            // Insert click
            await db.query(`INSERT INTO affiliate_clicks (link_id, ip_address, user_agent, referrer) VALUES ($1, $2, $3, $4)`, [linkId, ipAddress, userAgent, referrer]);
            
            // Update link total clicks
            await db.query(`UPDATE affiliate_links SET total_clicks = total_clicks + 1 WHERE id = $1`, [linkId]);
            
            res.json({ success: true });
        } catch (err) {
            console.error('Affiliate click tracking error:', err);
            res.status(500).json({ error: 'Failed to track click' });
        }
    });

    // 3. Get Current Affiliate Profile (Requires Auth)
    router.get('/me', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.query(`SELECT * FROM affiliates WHERE user_id = $1`, [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Affiliate profile not found' });
            }
            res.json({ success: true, affiliate: result.rows[0] });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    });

    // 4. Generate Affiliate Link (Requires Auth)
    router.post('/links', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const { productId, requestedSlug } = req.body;
            
            // Get affiliate ID
            const affRes = await db.query(`SELECT id FROM affiliates WHERE user_id = $1 AND status = 'active'`, [userId]);
            if (affRes.rows.length === 0) return res.status(403).json({ error: 'Not an active affiliate' });
            
            const affiliateId = affRes.rows[0].id;
            const finalSlug = requestedSlug || (Math.random().toString(36).substring(2, 8));

            const result = await db.query(
                `INSERT INTO affiliate_links (affiliate_id, product_id, slug) VALUES ($1, $2, $3) RETURNING *`,
                [affiliateId, productId, finalSlug]
            );
            res.status(201).json({ success: true, link: result.rows[0] });
        } catch (err) {
            if (err.code === '23505') return res.status(400).json({ error: 'Slug already exists' });
            console.error('Create link error:', err);
            res.status(500).json({ error: 'Failed to create link' });
        }
    });

    // 5. Get Affiliate Links (Requires Auth)
    router.get('/links', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.query(`
                SELECT al.*, p.name as product_name 
                FROM affiliate_links al 
                JOIN affiliates a ON al.affiliate_id = a.id 
                LEFT JOIN products p ON al.product_id = p.id
                WHERE a.user_id = $1
                ORDER BY al.created_at DESC`, 
                [userId]
            );
            res.json({ success: true, links: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch links' });
        }
    });

    // 6. Get Affiliated Products List
    router.get('/products', authenticateToken, async (req, res) => {
        try {
            const result = await db.query(
                `SELECT id, name, slug, image, price, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount 
                 FROM products 
                 WHERE is_affiliate_eligible = true 
                 AND is_live = true`
            );
            res.json({ success: true, products: result.rows });
        } catch (err) {
            console.error('Fetch affiliate products error:', err);
            res.status(500).json({ error: 'Failed to fetch eligible products' });
        }
    });

    // --- AFFILIATE: SALES & PAYMENT INFO ---

    // 7. Get Affiliate Sales (Requires Auth)
    router.get('/me/sales', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.query(`
                SELECT s.*, o.order_id as order_number, s.product_name as product_name
                FROM affiliate_sales s
                JOIN affiliates a ON s.affiliate_id = a.id
                JOIN orders o ON s.order_id = o.id
                WHERE a.user_id = $1
                ORDER BY s.created_at DESC`,
                [userId]
            );
            res.json({ success: true, sales: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    });

    // 7.1. Get Dashboard Stats (Requires Auth)
    router.get('/me/dashboard-stats', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            
            // 1. Get affiliate profile and basic stats
            const affRes = await db.query('SELECT * FROM affiliates WHERE user_id = $1', [userId]);
            if (affRes.rows.length === 0) return res.status(404).json({ error: 'Affiliate profile not found' });
            
            const affiliate = affRes.rows[0];
            const affiliateId = affiliate.id;

            // 2. Get click and conversion stats from links
            const linkStatsRes = await db.query(`
                SELECT 
                    COALESCE(SUM(total_clicks), 0) as total_clicks,
                    COALESCE(SUM(total_conversions), 0) as total_conversions
                FROM affiliate_links
                WHERE affiliate_id = $1
            `, [affiliateId]);
            
            const linkStats = linkStatsRes.rows[0];
            const totalClicks = parseInt(linkStats.total_clicks) || 0;
            const totalConversions = parseInt(linkStats.total_conversions) || 0;
            const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;

            // 3. Get commission breakdown
            const commissionRes = await db.query(`
                SELECT 
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) as pending_commission,
                    COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END), 0) as approved_commission,
                    COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as paid_commission
                FROM affiliate_sales
                WHERE affiliate_id = $1
            `, [affiliateId]);
            
            const commStats = commissionRes.rows[0];

            // 4. Get last 7 days performance (clicks and sales)
            const performanceRes = await db.query(`
                WITH days AS (
                    SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day
                )
                SELECT 
                    d.day,
                    COALESCE(SUM(s.commission_amount), 0) as commission,
                    COALESCE(COUNT(s.id), 0) as sales
                FROM days d
                LEFT JOIN affiliate_sales s ON DATE(s.created_at AT TIME ZONE 'UTC') = d.day AND s.affiliate_id = $1
                GROUP BY d.day
                ORDER BY d.day ASC
            `, [affiliateId]);
            
            const clicksPerformanceRes = await db.query(`
                WITH days AS (
                    SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day
                )
                SELECT 
                    d.day,
                    COALESCE(COUNT(c.id), 0) as clicks
                FROM days d
                LEFT JOIN affiliate_links l ON l.affiliate_id = $1
                LEFT JOIN affiliate_clicks c ON c.link_id = l.id AND DATE(c.created_at AT TIME ZONE 'UTC') = d.day
                GROUP BY d.day
                ORDER BY d.day ASC
            `, [affiliateId]);

            const performance = performanceRes.rows.map((row, index) => ({
                date: row.day,
                sales: parseInt(row.sales),
                commission: parseFloat(row.commission),
                clicks: parseInt(clicksPerformanceRes.rows[index].clicks)
            }));

            // 5. Recent Sales
            const recentSalesRes = await db.query(`
                SELECT s.*, o.order_id as order_number, s.product_name as product_name
                FROM affiliate_sales s
                JOIN orders o ON s.order_id = o.id
                WHERE s.affiliate_id = $1
                ORDER BY s.created_at DESC
                LIMIT 5
            `, [affiliateId]);

            res.json({
                success: true,
                stats: {
                    total_revenue: parseFloat(affiliate.total_sales) || 0,
                    total_commission: parseFloat(affiliate.total_commission) || 0,
                    available_balance: parseFloat(affiliate.available_balance) || 0,
                    pending_commission: parseFloat(commStats.pending_commission) || 0,
                    approved_commission: parseFloat(commStats.approved_commission) || 0,
                    paid_commission: parseFloat(commStats.paid_commission) || 0,
                    total_clicks: totalClicks,
                    total_orders: totalConversions,
                    conversion_rate: parseFloat(conversionRate)
                },
                performance,
                recent_sales: recentSalesRes.rows,
                profile: {
                    name: affiliate.name,
                    referral_code: affiliate.referral_code,
                    level: affiliate.level,
                    status: affiliate.status
                }
            });
        } catch (err) {
            console.error('Affiliate Dashboard Stats Error:', err);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    });


    // 8. Update Payment Info (Requires Auth)
    router.put('/me/payment-info', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const { upi_id, bank_name, account_number, ifsc_code } = req.body;
            const result = await db.query(
                `UPDATE affiliates SET upi_id=$1, bank_name=$2, account_number=$3, ifsc_code=$4 WHERE user_id=$5 RETURNING *`,
                [upi_id, bank_name, account_number, ifsc_code, userId]
            );
            res.json({ success: true, affiliate: result.rows[0] });
        } catch (err) {
            res.status(500).json({ error: 'Failed to update payment info' });
        }
    });

    // --- ADMIN ROUTES ---

    // 9. Get all applications (Admin)
    router.get('/admin/applications', authenticateAdmin, async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM affiliate_applications ORDER BY created_at DESC');
            res.json({ success: true, applications: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch applications' });
        }
    });

    // 10. Update application status (Admin)
    router.put('/admin/applications/:id', authenticateAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'Approved', 'Rejected', 'Pending'
            
            // 1. Get the current application data
            const appRes = await db.query('SELECT * FROM affiliate_applications WHERE id = $1', [id]);
            if (appRes.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
            const application = appRes.rows[0];

            // 2. If status is being changed to 'Approved', handle onboarding
            if (status === 'Approved' && application.status !== 'Approved') {
                const tempPassword = crypto.randomBytes(6).toString('hex'); // 12-char password
                const referralCode = `${application.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;

                let userId = application.user_id;
                
                try {
                    console.log(`🚀 Starting onboarding for ${application.email}`);
                    
                    if (!userId) {
                        // Create User in Supabase Auth if not already linked
                        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                            email: application.email,
                            password: tempPassword,
                            email_confirm: true,
                            user_metadata: { full_name: application.name, role: 'affiliate' }
                        });

                        if (authError) {
                            console.log(`⚠️ Auth creation error/warning: ${authError.message}`);
                            // If user already exists, we try to find them by email
                            if (authError.message.includes('already registered') || authError.status === 422 || authError.code === 'email_exists') {
                                // Important: We should search for the user by email using a more reliable method if possible
                                // but for now, we'll stick to the listUsers approach or assume the email is the key
                                const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
                                if (!listError) {
                                    const matchedUser = usersData.users.find(u => u.email?.toLowerCase() === application.email.toLowerCase());
                                    if (matchedUser) {
                                        userId = matchedUser.id;
                                        console.log(`✅ Using existing user ID from Supabase list: ${userId}`);
                                    }
                                }
                                
                                if (!userId) {
                                    throw new Error(`User with email ${application.email} exists but could not be located for mapping.`);
                                }
                            } else {
                                throw authError;
                            }
                        } else {
                            userId = authData.user.id;
                            console.log(`✅ Created new user ID in Supabase: ${userId}`);
                        }
                    } else {
                        console.log(`✅ Using pre-linked user ID from application: ${userId}`);
                    }

                    // Ensure user metadata has role: 'affiliate' even for existing users
                    await supabase.auth.admin.updateUserById(userId, {
                        user_metadata: { role: 'affiliate' }
                    });
                    console.log(`✅ Updated metadata for user ${userId}`);

                    // Create Affiliate Profile
                    console.log(`📝 Inserting affiliate profile for ${userId}`);
                    await db.query(`
                        INSERT INTO affiliates (user_id, name, email, phone, city, referral_code, status, instagram_link, facebook_link, twitter_link, youtube_link)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status
                    `, [
                        userId, application.name, application.email, application.phone, application.city, 
                        referralCode, 'Approved', 
                        application.instagram_link, application.facebook_link, application.twitter_link, application.youtube_link
                    ]);
                    console.log(`✅ Profile created for ${application.email}`);

                    // Send Welcome Email
                    console.log(`📧 Sending welcome email to ${application.email}`);
                    await sendEmail({
                        to: application.email,
                        subject: 'Welcome to Kottravai Affiliate Program!',
                        html: getAffiliateWelcomeTemplate({
                            name: application.name,
                            email: application.email,
                            password: tempPassword,
                            referral_code: referralCode
                        })
                    });
                    console.log(`✅ Welcome email sent to ${application.email}`);

                } catch (onboardError) {
                    console.error('Affiliate onboarding error:', onboardError);
                    try {
                        const fs = require('fs');
                        const logData = `[${new Date().toISOString()}] Error for ${application.email}:\n${onboardError.message}\n${onboardError.stack}\n---\n`;
                        fs.appendFileSync('d:/Kottravai-main/Kottravai-main/tmp/affiliate_errors.log', logData);
                    } catch (fsErr) {}
                    return res.status(500).json({ error: 'Failed to complete affiliate onboarding', details: onboardError.message });
                }
            }

            // 3. Update the application record
            const result = await db.query(
                `UPDATE affiliate_applications SET status=$1, reviewed_at=NOW() WHERE id=$2 RETURNING *`, 
                [status, id]
            );
            res.json({ success: true, application: result.rows[0] });
        } catch (err) {
            console.error('Update application error:', err);
            res.status(500).json({ error: 'Failed to update application' });
        }
    });

    // 11. Create new Affiliate profile directly/manually (Admin)
    router.post('/admin/affiliates', authenticateAdmin, async (req, res) => {
        try {
            const { user_id, name, email, phone, city, status, level, referral_code, upi_id, bank_name, account_number, ifsc_code } = req.body;
            const result = await db.query(
                `INSERT INTO affiliates (user_id, name, email, phone, city, status, level, referral_code, upi_id, bank_name, account_number, ifsc_code) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [user_id, name, email, phone, city, status || 'active', level || 'Ambassador', referral_code, upi_id, bank_name, account_number, ifsc_code]
            );
            res.status(201).json({ success: true, affiliate: result.rows[0] });
        } catch (err) {
            console.error('Create affiliate error:', err);
            res.status(500).json({ error: 'Failed to create affiliate', details: err.message });
        }
    });

    // 12. Get all affiliates (Admin)
    router.get('/admin/affiliates', authenticateAdmin, async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM affiliates ORDER BY created_at DESC');
            res.json({ success: true, affiliates: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch affiliates' });
        }
    });

    // 13. Update affiliate details/status/balances (Admin)
    router.put('/admin/affiliates/:id', authenticateAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { status, level, total_sales, total_commission, available_balance } = req.body;
            
            // Build dynamic update query
            let updates = [];
            let values = [];
            let idx = 1;
            if(status !== undefined) { updates.push(`status=$${idx++}`); values.push(status); }
            if(level !== undefined) { updates.push(`level=$${idx++}`); values.push(level); }
            if(total_sales !== undefined) { updates.push(`total_sales=$${idx++}`); values.push(total_sales); }
            if(total_commission !== undefined) { updates.push(`total_commission=$${idx++}`); values.push(total_commission); }
            if(available_balance !== undefined) { updates.push(`available_balance=$${idx++}`); values.push(available_balance); }
            
            if(updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
            values.push(id);
            
            const result = await db.query(
                `UPDATE affiliates SET ${updates.join(', ')} WHERE id=$${idx} RETURNING *`,
                values
            );
            res.json({ success: true, affiliate: result.rows[0] });
        } catch (err) {
            res.status(500).json({ error: 'Failed to update affiliate' });
        }
    });

    // 14. Get all affiliate sales (Admin)
    router.get('/admin/sales', authenticateAdmin, async (req, res) => {
        try {
            const result = await db.query(`
                SELECT 
                    s.*, 
                    a.name as affiliate_name, 
                    a.email as affiliate_email, 
                    o.order_id as order_number,
                    s.product_name as product_name,
                    l.slug as link_slug
                FROM affiliate_sales s
                JOIN affiliates a ON s.affiliate_id = a.id
                JOIN orders o ON s.order_id = o.id
                LEFT JOIN affiliate_links l ON s.link_id = l.id
                ORDER BY s.created_at DESC
            `);
            res.json({ success: true, sales: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    });

    // 14.1. External API endpoint for sales table (for other applications)
    router.get('/external/sales', async (req, res) => {
        try {
            const { affiliate_id, email } = req.query;
            let query = `
                SELECT 
                    s.*, 
                    a.name as affiliate_name, 
                    a.email as affiliate_email, 
                    o.order_id as order_number,
                    s.product_name as product_name,
                    l.slug as link_slug
                FROM affiliate_sales s
                JOIN affiliates a ON s.affiliate_id = a.id
                JOIN orders o ON s.order_id = o.id
                LEFT JOIN affiliate_links l ON s.link_id = l.id
            `;
            let params = [];

            if (affiliate_id) {
                query += ` WHERE s.affiliate_id = $1`;
                params.push(affiliate_id);
            } else if (email) {
                query += ` WHERE a.email = $1`;
                params.push(email);
            }

            query += ` ORDER BY s.created_at DESC`;

            const result = await db.query(query, params);
            res.json({ success: true, sales: result.rows });
        } catch (err) {
            console.error('Fetch external sales error:', err);
            res.status(500).json({ error: 'Failed to fetch sales for external app' });
        }
    });

    // 15. Update sale status (Admin) - e.g. marking as paid/settled
    router.put('/admin/sales/:id', authenticateAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'pending', 'approved', 'paid', 'cancelled'
            
            const result = await db.query(`UPDATE affiliate_sales SET status=$1 WHERE id=$2 RETURNING *`, [status, id]);
            res.json({ success: true, sale: result.rows[0] });
        } catch (err) {
            res.status(500).json({ error: 'Failed to update sale status' });
        }
    });

    // 16. Delete an affiliate completely (Admin)
    router.delete('/admin/affiliates/:id', authenticateAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            await db.query(`DELETE FROM affiliates WHERE id = $1`, [id]);
            res.json({ success: true, message: 'Affiliate deleted' });
        } catch (err) {
            res.status(500).json({ error: 'Failed to delete affiliate' });
        }
    });

    // 17. Get all payouts (Admin)
    router.get('/admin/payouts', authenticateAdmin, async (req, res) => {
        try {
            const result = await db.query(`
                SELECT p.*, a.name as affiliate_name, a.email as affiliate_email 
                FROM affiliate_payouts p 
                JOIN affiliates a ON p.affiliate_id = a.id 
                ORDER BY p.created_at DESC
            `);
            res.json({ success: true, payouts: result.rows });
        } catch (err) {
            console.error('Fetch payouts error:', err);
            res.status(500).json({ error: 'Failed to fetch payouts' });
        }
    });

    // 18. Record manual payout (Admin)
    router.post('/admin/payouts', authenticateAdmin, async (req, res) => {
        try {
            const { affiliateId, amount, date } = req.body; // affiliateId can be ID or Email based on frontend usage
            
            // Find affiliate by email if ID is not uuid-like or is passed as email
            let finalAffiliateId = affiliateId;
            if (affiliateId.includes('@')) {
                const affRes = await db.query('SELECT id FROM affiliates WHERE email = $1', [affiliateId]);
                if (affRes.rows.length === 0) return res.status(404).json({ error: 'Affiliate not found with this email' });
                finalAffiliateId = affRes.rows[0].id;
            }

            const result = await db.query(
                `INSERT INTO affiliate_payouts (affiliate_id, amount, created_at) VALUES ($1, $2, $3) RETURNING *`,
                [finalAffiliateId, amount, date || new Date()]
            );

            // Update affiliate balance (Subtract from total_earned if tracked that way, or just log)
            // Assuming balance is calculated on the fly or needs a field update:
            // await db.query('UPDATE affiliates SET balance = balance - $1 WHERE id = $2', [amount, finalAffiliateId]);

            res.status(201).json({ success: true, payout: result.rows[0] });
        } catch (err) {
            console.error('Record payout error:', err);
            res.status(500).json({ error: 'Failed to record payout' });
        }
    });

    // --- Affiliate Profile Management (Self-Service) ---

    /**
     * @route GET /api/affiliates/profile
     * @desc Get current logged-in affiliate's profile data
     */
    router.get('/profile', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.query('SELECT * FROM affiliates WHERE user_id = $1', [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Affiliate profile not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Fetch affiliate profile error:', err);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    });

    /**
     * @route PUT /api/affiliates/profile
     * @desc Update current affiliate's profile details
     */
    router.put('/profile', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                name, phone, city,
                instagram_link, facebook_link, twitter_link, youtube_link,
                upi_id, bank_name, account_number, ifsc_code
            } = req.body;

            const result = await db.query(`
                UPDATE affiliates 
                SET name = COALESCE($1, name), 
                    phone = COALESCE($2, phone), 
                    city = COALESCE($3, city), 
                    instagram_link = COALESCE($4, instagram_link), 
                    facebook_link = COALESCE($5, facebook_link), 
                    twitter_link = COALESCE($6, twitter_link), 
                    youtube_link = COALESCE($7, youtube_link),
                    upi_id = COALESCE($8, upi_id),
                    bank_name = COALESCE($9, bank_name),
                    account_number = COALESCE($10, account_number),
                    ifsc_code = COALESCE($11, ifsc_code)
                WHERE user_id = $12
                RETURNING *
            `, [
                name, phone, city,
                instagram_link, facebook_link, twitter_link, youtube_link,
                upi_id, bank_name, account_number, ifsc_code,
                userId
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Affiliate profile not found' });
            }

            res.json({ success: true, profile: result.rows[0], message: 'Profile updated successfully' });
        } catch (err) {
            console.error('Update affiliate profile error:', err);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    });

    return router;
};
