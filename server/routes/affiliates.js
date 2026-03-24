const express = require('express');
const db = require('../db');
const supabase = require('../supabase');

module.exports = (authenticateToken, authenticateAdmin) => {
    const router = express.Router();

    // 1. Submit Affiliate Application (Public or Auth)
    router.post('/apply', async (req, res) => {
        try {
            const { name, email, phone, city, instagram_link, facebook_link, twitter_link, youtube_link, selling_experience, products_promoted, reason } = req.body;
            
            // Check if already applied
            const exists = await db.query('SELECT id FROM affiliate_applications WHERE email = $1', [email]);
            if (exists.rows.length > 0) {
                return res.status(400).json({ error: 'An application with this email already exists' });
            }

            const result = await db.query(
                `INSERT INTO affiliate_applications (name, email, phone, city, instagram_link, facebook_link, twitter_link, youtube_link, selling_experience, products_promoted, reason) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [name, email, phone, city, instagram_link, facebook_link, twitter_link, youtube_link, selling_experience, products_promoted, reason]
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

    // 6. Get Affiliated Products List (Public or Auth)
    router.get('/products', async (req, res) => {
        try {
            const result = await db.query(`SELECT id, name, slug, image, price, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount FROM products WHERE is_affiliate_eligible = true AND is_live = true`);
            res.json({ success: true, products: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch eligible products' });
        }
    });

    // --- AFFILIATE: SALES & PAYMENT INFO ---

    // 7. Get Affiliate Sales (Requires Auth)
    router.get('/me/sales', authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.query(`
                SELECT s.*, o.order_id as order_number, p.name as product_name
                FROM affiliate_sales s
                JOIN affiliates a ON s.affiliate_id = a.id
                JOIN orders o ON s.order_id = o.id
                LEFT JOIN affiliate_links l ON s.link_id = l.id
                LEFT JOIN products p ON l.product_id = p.id
                WHERE a.user_id = $1
                ORDER BY s.created_at DESC`,
                [userId]
            );
            res.json({ success: true, sales: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch sales' });
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
            const { status } = req.body;
            const result = await db.query(
                `UPDATE affiliate_applications SET status=$1, reviewed_at=NOW() WHERE id=$2 RETURNING *`, 
                [status, id]
            );
            res.json({ success: true, application: result.rows[0] });
        } catch (err) {
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
                SELECT s.*, a.name as affiliate_name, a.email as affiliate_email, o.order_id as order_number 
                FROM affiliate_sales s
                JOIN affiliates a ON s.affiliate_id = a.id
                JOIN orders o ON s.order_id = o.id
                ORDER BY s.created_at DESC
            `);
            res.json({ success: true, sales: result.rows });
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch sales' });
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

    return router;
};
