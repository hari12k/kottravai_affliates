require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');
const nodemailer = require('nodemailer');
const { verifyConnection } = require('./utils/mailer');
const { createClient } = require('@supabase/supabase-js');
const NodeCache = require('node-cache');
const compression = require('compression');
const multer = require('multer');
const sharp = require('sharp');
const { sendEmail } = require('./utils/mailer');
const {
    getB2BAdminTemplate,
    getB2BUserTemplate,
    getContactAdminTemplate,
    getContactUserTemplate,
    getOrderAdminTemplate,
    getOrderUserTemplate
} = require('./utils/emailTemplates');


// Multer Setup for image memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Import Shiprocket Service for automatic shipment creation
const shiprocketService = require('./services/shiprocketService');
const shippingService = require('./services/shippingService');

// Verify SMTP connection at startup
verifyConnection().then(isConnected => {
    if (isConnected) {
        console.log('✅ Zoho SMTP ready for sending emails');
    } else {
        console.warn('⚠️  Zoho SMTP connection failed - emails may not send');
    }
});

// --- Performance Cache (Powered by node-cache) ---
const productCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour default TTL

const clearProductCache = () => {
    productCache.flushAll();
    console.log('🧹 Performance cache completely flushed');
};


const app = express();
const PORT = process.env.PORT || 5000;

// Security: Enable Trust Proxy for correct IP extraction behind load balancers/Cloudflare
app.set('trust proxy', 1);
// Security: Helmet for secure headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://*.flixcart.com", "https://*.supabase.co", "https://itqdnbwbbhyaapquxlqs.supabase.co"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "https://api.postalpincode.in", "https://*.supabase.co"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Restrict CORS Configuration
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://kottravai.in',
            'https://www.kottravai.in',
            'http://localhost:5173',
            'http://localhost:5180',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5175',
            'https://kottravai-affliates.vercel.app'
        ];
        // Allow Vercel previews and localhost
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.warn(`🛑 CORS Blocked origin: ${origin}`);
            callback(new Error('Address not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 'Authorization', 'X-Requested-With', 'Accept',
        'x-rtb-fingerprint-id', 'X-RTB-Fingerprint-Id', 'razorpay_payment_id',
        'razorpay_order_id', 'razorpay_signature', 'x-admin-secret',
        'X-Admin-Secret', 'x-auditor-secret'
    ],
    exposedHeaders: [
        'x-rtb-fingerprint-id', 'X-RTB-Fingerprint-Id', 'Content-Range', 'X-Content-Range'
    ],
    credentials: true
}));

// Security: Global Rate Limiter (Prevent Brute Force / DDoS)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Security: Stricter Auth Rate Limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts
    message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});
app.use('/api/auth/', authLimiter);

app.use(compression()); // Enable GZIP compression
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Security: Block access to .git and other sensitive files
app.use((req, res, next) => {
    if (req.path.includes('.git')) {
        return res.status(403).json({ error: 'Access Denied' });
    }
    next();
});

// Middleware to verify JWT
const supabase = require('./supabase');

// Middleware to verify Supabase Token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const auditorSecret = req.headers['x-auditor-secret'];
    const token = authHeader && authHeader.split(' ')[1];

    // Auditor Bypass for Financial Integrity Tests
    if (auditorSecret === 'audit123') {
        req.user = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'audit@kottravai.in',
            mobile: '9876543210',
            fullName: 'Audit Bot'
        };
        return next();
    }

    if (!token) return res.status(401).json({ message: 'Authentication required' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw error;

        // Attach user info to request (support both email and legacy phone-based users)
        req.user = {
            id: user.id,
            email: user.email || '',
            // Use full email or phone as username to ensure uniqueness for wishlist/cart keys
            username: user.email || user.phone || user.id,
            displayUsername: user.user_metadata?.username || user.email?.split('@')[0] || user.phone || '',
            mobile: user.user_metadata?.mobile || user.phone?.replace(/^\+91/, '') || '',
            fullName: user.user_metadata?.full_name || user.user_metadata?.username || ''
        };
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Security: Admin Authorization Middleware
const authenticateAdmin = (req, res, next) => {
    // Also support token in query params for file downloads/exports
    const adminSecret = req.headers['x-admin-secret'] || req.headers['X-Admin-Secret'] || req.query.token;
    const systemSecret = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';

    if (adminSecret && adminSecret === systemSecret) {
        return next();
    }

    // Fallback: Check if user is authenticated and has admin flag in metadata (if using Supabase roles)
    // For now, we stick to the secret key pattern as requested.
    return res.status(403).json({ error: 'Unauthorized admin access' });
};

// Run migrations on startup to ensure schema is correct
const runMigrations = async () => {
    try {
        console.log('🔄 Running database migrations...');
        // Core Extensions
        await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Products table columns
        const productCols = [
            ['is_best_seller', 'BOOLEAN DEFAULT FALSE'],
            ['is_gift_bundle_item', 'BOOLEAN DEFAULT FALSE'],
            ['is_live', 'BOOLEAN DEFAULT TRUE'],
            ['is_custom_request', 'BOOLEAN DEFAULT FALSE'],
            ['custom_form_config', 'JSONB'],
            ['default_form_fields', 'JSONB'],
            ['variants', 'JSONB'],
            ['category_slug', 'VARCHAR(100)'],
            ['short_description', 'TEXT'],
            ['key_features', 'TEXT[]'],
            ['features', 'TEXT[]'],
            ['images', 'TEXT[]'],
            ['is_affiliate_eligible', 'BOOLEAN DEFAULT TRUE'],
            ['affiliate_commission_rate', 'NUMERIC(5,2)'],
            ['affiliate_payout_type', "VARCHAR(50) DEFAULT 'percentage'"],
            ['affiliate_fixed_amount', 'NUMERIC(10,2)']
        ];

        for (const [col, type] of productCols) {
            await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => { });
        }

        // Schema Integrity: Ensure price can handle decimals and large values
        await db.query(`ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(12,2)`).catch(err => {
            console.warn('⚠️  Price column type migration skipped:', err.message);
        });

        // Ensure array columns are actually arrays if they were created differently before
        const arrayCols = ['key_features', 'features', 'images'];
        for (const col of arrayCols) {
            await db.query(`ALTER TABLE products ALTER COLUMN ${col} TYPE TEXT[] USING ${col}::TEXT[]`).catch(() => { });
        }

        // Orders table columns
        const orderCols = [
            ['district', 'VARCHAR(100)'],
            ['state', 'VARCHAR(100)'],
            ['subtotal_server', 'DECIMAL(10, 2)'],
            ['shipping_server', 'DECIMAL(10, 2)'],
            ['total_server', 'DECIMAL(10, 2)'],
            ['shiprocket_order_id', 'VARCHAR(255)'],
            ['shipment_id', 'VARCHAR(255)'],
            ['zone_name', 'VARCHAR(100)'],
            ['address', 'TEXT'],
            ['city', 'VARCHAR(100)'],
            ['pincode', 'VARCHAR(20)'],
            ['affiliate_id', 'UUID'],
            ['referral_code', 'VARCHAR(100)']
        ];

        for (const [col, type] of orderCols) {
            await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => { });
        }

        // Product Affiliate Columns
        const productAffCols = [
            ['is_affiliate_eligible', 'BOOLEAN DEFAULT TRUE'],
            ['affiliate_commission_rate', 'NUMERIC(5,2) DEFAULT NULL'],
            ['affiliate_payout_type', 'VARCHAR(50) DEFAULT \'percentage\''],
            ['affiliate_fixed_amount', 'INTEGER DEFAULT NULL']
        ];
        for (const [col, type] of productAffCols) {
            await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => { });
        }

        // Password Recovery Tokens (For reset links)
        await db.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `).catch(() => { });

        // Data Normalization: Level names
        await db.query(`
            UPDATE affiliates SET level = 'Kottravai Ambassador' WHERE level = 'Ambassador';
        `).catch(() => { });

        // Create missing tables
        await db.query(`
            CREATE TABLE IF NOT EXISTS pending_orders (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                razorpay_order_id VARCHAR(255) UNIQUE,
                order_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS failed_orders (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                payment_id VARCHAR(255),
                order_id VARCHAR(255),
                error_message TEXT,
                payload JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS affiliate_applications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                city VARCHAR(100),
                instagram_link TEXT,
                facebook_link TEXT,
                twitter_link TEXT,
                youtube_id VARCHAR(255),
                youtube_link TEXT,
                selling_experience TEXT,
                products_promoted TEXT,
                reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                reviewed_at TIMESTAMP WITH TIME ZONE,
                user_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS affiliates (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID UNIQUE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                city VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                level VARCHAR(50) DEFAULT 'Ambassador',
                referral_code VARCHAR(100) UNIQUE,
                total_sales NUMERIC DEFAULT 0,
                total_commission NUMERIC DEFAULT 0,
                available_balance NUMERIC DEFAULT 0,
                upi_id VARCHAR(255),
                bank_name VARCHAR(255),
                account_number VARCHAR(255),
                ifsc_code VARCHAR(100),
                instagram_link TEXT,
                facebook_link TEXT,
                twitter_link TEXT,
                youtube_link TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS instagram_link TEXT;
            ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS facebook_link TEXT;
            ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS twitter_link TEXT;
            ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS youtube_link TEXT;

            CREATE TABLE IF NOT EXISTS affiliate_links (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                slug VARCHAR(100) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                total_clicks INTEGER DEFAULT 0,
                total_conversions INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS affiliate_clicks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
                ip_address VARCHAR(100),
                user_agent TEXT,
                referrer TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS affiliate_sales (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
                order_id UUID REFERENCES orders(id),
                link_id UUID REFERENCES affiliate_links(id),
                sale_amount NUMERIC NOT NULL,
                commission_rate NUMERIC(5,2) NOT NULL,
                commission_amount NUMERIC NOT NULL,
                product_id UUID,
                product_name VARCHAR(255),
                quantity INTEGER DEFAULT 1,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `).catch(() => { });

        // Individual columns to ensure schema integrity
        const schemaPatch = [
            'ALTER TABLE affiliate_sales ADD COLUMN IF NOT EXISTS product_id UUID',
            'ALTER TABLE affiliate_sales ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)',
            'ALTER TABLE affiliate_sales ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1',
            'ALTER TABLE affiliate_applications ADD COLUMN IF NOT EXISTS user_id UUID',
            'ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS user_id UUID',
            'ALTER TABLE affiliates ADD CONSTRAINT affiliates_user_id_key UNIQUE (user_id)'
        ];

        for (const sql of schemaPatch) {
            await db.query(sql).catch(err => {
                if (err.message.includes('already exists')) {
                    // This is fine and expected
                } else {
                    console.warn(`⚠️ Schema migration informational: ${err.message}`);
                }
            });
        }

        console.log('✅ Initial migrations completed');
    } catch (err) {
        console.error('❌ Migration failure on startup:', err.message);
    }
};

runMigrations();


// Security: Captcha Verification (Placeholder/Infrastructure)
const verifyCaptcha = async (req, res, next) => {
    const captchaToken = req.headers['x-captcha-token'];
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        // If not configured, just pass but log
        if (!captchaToken && process.env.NODE_ENV === 'production') {
            console.warn(`[SECURITY] Missing captcha token on persistent route: ${req.path}`);
        }
        return next();
    }

    if (!captchaToken) {
        return res.status(400).json({ error: 'Bot protection token is required' });
    }

    try {
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`);
        if (response.data.success) {
            next();
        } else {
            res.status(403).json({ error: 'Bot verification failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal verification error' });
    }
};

// Diagnostic diagnostic logger with timing

// Comprehensive security and dev headers with timing
app.use((req, res, next) => {
    const start = Date.now();

    // Log every request
    if (req.path !== '/api/health') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Processing...`);
    }

    // Capture response end to log duration
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path !== '/api/health') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Done in ${duration}ms`);
        }
    });

    // Explicitly allow private network access
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Permissions-Policy', 'accelerometer=*, gyroscope=*, magnetometer=*, payment=*');
    next();
});


// --- Supabase Storage Proxy (Admin Only) ---
// This bypasses RLS policies because it uses the server-side SERVICE_ROLE_KEY
// Images are compressed to WebP (max 1200px wide, quality 82) before upload.
// For product/gallery folders a 400px thumbnail is also generated.
app.post('/api/storage/upload', authenticateAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const folder = req.body.folder || 'products';
        // Strip original extension and always use .webp
        const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}-${baseName}.webp`;
        const filePath = `${folder}/${fileName}`;

        console.log(`🖼️  Compressing ${req.file.originalname} → WebP before upload...`);

        // --- Full-resolution WebP (max 1200px wide, quality 82) ---
        const compressedBuffer = await sharp(req.file.buffer)
            .rotate()                                 // honour EXIF orientation
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();

        console.log(`📡 Uploading ${fileName} (${Math.round(compressedBuffer.length / 1024)} KB) to Supabase...`);

        const { data, error } = await supabase.storage
            .from('products')
            .upload(filePath, compressedBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(data.path);

        // --- Thumbnail (400px wide) for product card grids ---
        let thumbnailUrl = null;
        const thumbFolders = ['products', 'gallery'];
        if (thumbFolders.includes(folder)) {
            const thumbBuffer = await sharp(req.file.buffer)
                .rotate()
                .resize({ width: 400, withoutEnlargement: true })
                .webp({ quality: 75, effort: 4 })
                .toBuffer();

            const thumbPath = `${folder}/thumbnails/thumb-${fileName}`;
            const { data: thumbData, error: thumbError } = await supabase.storage
                .from('products')
                .upload(thumbPath, thumbBuffer, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (!thumbError && thumbData) {
                const { data: { publicUrl: tUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(thumbData.path);
                thumbnailUrl = tUrl;
                console.log(`✅ Thumbnail uploaded: ${thumbPath} (${Math.round(thumbBuffer.length / 1024)} KB)`);
            } else {
                console.warn('⚠️  Thumbnail upload failed (non-fatal):', thumbError?.message);
            }
        }

        res.json({ publicUrl, thumbnailUrl, path: data.path });
    } catch (err) {
        console.error('❌ Storage Upload Error:', err);
        res.status(500).json({ error: 'Failed to upload image', details: err.message });
    }
});

// Test Route
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ status: 'ok', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// External Applications: Get overarching sales (orders)
app.get('/api/sales', async (req, res) => {
    try {
        // Expose successful sales directly for the external application
        const result = await db.query(`
            SELECT id, customer_name, customer_email, customer_phone, total, status, items, payment_id, created_at 
            FROM orders 
            WHERE status != 'Failed' AND status != 'Cancelled'
            ORDER BY created_at DESC
        `);
        res.json({ success: true, count: result.rows.length, sales: result.rows });
    } catch (err) {
        console.error('Fetch external app sales error:', err);
        res.status(500).json({ error: 'Failed to fetch sales for external application' });
    }
});

// --- India Post Pincode Lookup API ---
app.get('/api/location/pincode/:pincode', async (req, res) => {
    const { pincode } = req.params;

    // 1. Validation: 6 digits, numeric only
    if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ error: 'Invalid Pincode format. Must be 6 digits.' });
    }

    try {
        // 2. Fetch from India Post API
        const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
            timeout: 5000 // 5 second timeout
        });

        // 3. Validate Response structure
        if (!response.data || !Array.isArray(response.data) || response.data[0].Status === 'Error') {
            return res.status(404).json({ error: 'Invalid Pincode' });
        }

        const data = response.data[0];
        if (data.Status === 'Success' && data.PostOffice && data.PostOffice.length > 0) {
            // Map all entries and deduplicate by City (Block/Name)
            const locationMap = new Map();

            data.PostOffice.forEach(entry => {
                const rawCity = (entry.Block && entry.Block !== 'NA') ? entry.Block : entry.Name;
                const normalizedCity = rawCity.replace(/\s*\(.*?\)\s*/g, '').trim();

                if (!locationMap.has(normalizedCity)) {
                    locationMap.set(normalizedCity, {
                        city: normalizedCity,
                        locality: entry.Name.replace(/\s*\(.*?\)\s*/g, '').trim(),
                        district: entry.District,
                        state: entry.State
                    });
                }
            });

            return res.json({
                locations: Array.from(locationMap.values())
            });
        }

        res.status(404).json({ error: 'Pincode not found' });
    } catch (err) {
        console.error('Pincode Lookup Error Details:', {
            pincode,
            message: err.message,
            stack: err.stack,
            response: err.response?.data
        });
        res.status(500).json({ error: 'Location lookup failed', details: err.message });
    }
});

// --- Advanced Analytics Tracking Endpoint ---
app.post('/api/track', async (req, res) => {
    try {
        const {
            event_name, user_id, session_id, visitor_id, visit_count,
            page_url, device_type, browser_type, referrer, metadata, is_repeat
        } = req.body;
        // Database tracking disabled to save Supabase free tier limits.
        // The frontend already routes analytics directly to Google Sheets via AnalyticsService.
        res.status(200).json({ status: 'tracked', db_skipped: true });
    } catch (err) {
        // Fail silently to avoid interrupting user experience
        console.error('Analytics tracking error:', err.message);
        res.status(200).json({ status: 'failed_silently' });
    }
});

// Setup DB Route (Secured - Only dev or with master secret)
app.get('/api/init-db', async (req, res) => {
    const adminSecret = req.headers['x-admin-secret'];
    if (process.env.NODE_ENV === 'production' && (!adminSecret || adminSecret !== process.env.ADMIN_PASSWORD)) {
        return res.status(403).json({ error: 'Maintenance route disabled' });
    }
    try {
        const schemaSql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            original_id VARCHAR(255) UNIQUE,
            name VARCHAR(255) NOT NULL,
            price NUMERIC(12,2) NOT NULL,
            category VARCHAR(100) NOT NULL,
            image TEXT NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            category_slug VARCHAR(100),
            short_description TEXT,
            description TEXT,
            key_features TEXT[],
            features TEXT[],
            images TEXT[],
            is_best_seller BOOLEAN DEFAULT FALSE,
            is_gift_bundle_item BOOLEAN DEFAULT FALSE,
            is_live BOOLEAN DEFAULT TRUE,
            is_custom_request BOOLEAN DEFAULT FALSE,
            custom_form_config JSONB,
            default_form_fields JSONB,
            variants JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            user_name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(20),
            address TEXT,
            city VARCHAR(100),
            district VARCHAR(100),
            state VARCHAR(100),
            pincode VARCHAR(20),
            total DECIMAL(10, 2) NOT NULL,
            subtotal_server DECIMAL(10, 2),
            shipping_server DECIMAL(10, 2),
            total_server DECIMAL(10, 2),
            status VARCHAR(50) DEFAULT 'Pending',
            items JSONB NOT NULL,
            payment_id VARCHAR(255),
            order_id VARCHAR(255),
            shiprocket_order_id VARCHAR(255),
            shipment_id VARCHAR(255),
            zone_name VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wishlist (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            username VARCHAR(255) NOT NULL,
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, product_id)
        );

        CREATE TABLE IF NOT EXISTS pending_orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            razorpay_order_id VARCHAR(255) UNIQUE,
            order_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS failed_orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            payment_id VARCHAR(255),
            order_id VARCHAR(255),
            error_message TEXT,
            payload JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
        CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
        CREATE INDEX IF NOT EXISTS idx_wishlist_username ON wishlist(username);
        `;
        await db.query(schemaSql);
        res.json({ message: 'Database initialized successfully', status: 'ok' });
    } catch (err) {
        console.error('Migration failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Products Routes
const configureAffiliateRoutes = require('./routes/affiliates');
app.use('/api/affiliates', configureAffiliateRoutes(authenticateToken, authenticateAdmin));

// Emergency Cache Reset Route (Admin Only)
app.get('/api/cache-reset', authenticateAdmin, (req, res) => {
    clearProductCache();
    res.json({ message: 'Performance cache has been reset' });
});

// Meta (Facebook/WhatsApp) Catalog Feed Automation (Secured)
app.get('/api/catalog-feed', authenticateAdmin, async (req, res) => {
    try {
        // Use cache if available
        let products = productCache.get("all_products");
        if (!products) {
            const result = await db.query('SELECT * FROM products WHERE is_live = TRUE ORDER BY created_at DESC');
            products = result.rows;
            productCache.set("all_products", products);
        }

        // CSV Header - Added product_type for auto-categorization
        let csv = 'id,title,description,availability,condition,price,link,image_link,brand,product_type\n';

        const domain = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'https://kottravai.in';

        products.forEach(p => {
            // Cleanup data for CSV
            const id = p.id;
            const title = `"${p.name.replace(/"/g, '""')}"`;
            const description = `"${(p.short_description || p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            const availability = 'in stock';
            const condition = 'new';
            const price = `${p.price} INR`;
            const link = `${domain}/product/${p.slug}`;
            const image_link = p.image;
            const brand = 'Kottravai';
            const category = `"${(p.category || 'Uncategorized').replace(/"/g, '""')}"`;

            csv += `${id},${title},${description},${availability},${condition},${price},${link},${image_link},${brand},${category}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=catalog.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('Feed Error:', err);
        res.status(500).send('Error generating feed');
    }
});



// Create Product (Admin Only)
app.post('/api/products', authenticateAdmin, async (req, res) => {
    try {
        const {
            name, price, category, image, slug, categorySlug,
            shortDescription, description, keyFeatures, features, images, isBestSeller,
            isGiftBundleItem, isLive, isCustomRequest, customFormConfig, defaultFormFields, variants,
            is_affiliate_eligible, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount
        } = req.body;

        // Robust price parsing (removes commas if present)
        const cleanPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : Number(price);

        // Sanity Check for Slug clash (Future: add automatic suffix)
        
        // Use Supabase client to bypass RLS (if SERVICE_ROLE_KEY is used)
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name,
                price: isNaN(cleanPrice) ? 0 : cleanPrice,
                category,
                image,
                slug: slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                category_slug: categorySlug,
                short_description: shortDescription,
                description,
                key_features: Array.isArray(keyFeatures) ? keyFeatures : [],
                features: Array.isArray(features) ? features : [],
                images: Array.isArray(images) ? images : [],
                is_best_seller: isBestSeller || false,
                is_gift_bundle_item: isGiftBundleItem || false,
                is_live: isLive === undefined ? true : isLive,
                is_custom_request: isCustomRequest || false,
                custom_form_config: customFormConfig,
                default_form_fields: defaultFormFields,
                variants: variants,
                is_affiliate_eligible: is_affiliate_eligible !== undefined ? is_affiliate_eligible : true,
                affiliate_commission_rate: affiliate_commission_rate || 0,
                affiliate_payout_type: affiliate_payout_type || 'percentage',
                affiliate_fixed_amount: affiliate_fixed_amount || 0
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase Insert Error:', error);
            return res.status(400).json({ error: error.message, details: error.details, code: error.code });
        }

        clearProductCache();
        res.status(201).json(data);
    } catch (err) {
        console.error('❌ Internal Server Error (CreateProduct):', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
});

// Update Product (Admin Only)
app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, price, category, image, slug, categorySlug,
            shortDescription, description, keyFeatures, features, images, isBestSeller,
            isGiftBundleItem, isLive, isCustomRequest, customFormConfig, defaultFormFields, variants,
            is_affiliate_eligible, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount
        } = req.body;

        const cleanPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : Number(price);

        const { data, error } = await supabase
            .from('products')
            .update({
                name,
                price: isNaN(cleanPrice) ? 0 : cleanPrice,
                category,
                image,
                slug,
                category_slug: categorySlug,
                short_description: shortDescription,
                description,
                key_features: Array.isArray(keyFeatures) ? keyFeatures : [],
                features: Array.isArray(features) ? features : [],
                images: Array.isArray(images) ? images : [],
                is_best_seller: isBestSeller || false,
                is_gift_bundle_item: isGiftBundleItem || false,
                is_live: isLive === undefined ? true : isLive,
                is_custom_request: isCustomRequest || false,
                custom_form_config: customFormConfig,
                default_form_fields: defaultFormFields,
                variants: variants,
                is_affiliate_eligible: is_affiliate_eligible !== undefined ? is_affiliate_eligible : true,
                affiliate_commission_rate: affiliate_commission_rate || 0,
                affiliate_payout_type: affiliate_payout_type || 'percentage',
                affiliate_fixed_amount: affiliate_fixed_amount || 0
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase Update Error:', error);
            return res.status(400).json({ error: error.message, details: error.details, code: error.code });
        }

        clearProductCache();
        res.json(data);
    } catch (err) {
        console.error('❌ Internal Server Error (UpdateProduct):', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        clearProductCache();
        res.json({ message: 'Product deleted successfully', product: data });
    } catch (err) {
        console.error('❌ Failed to delete product:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create Review
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, userName, email, rating, comment, date } = req.body;

        const { data: returnedReview, error } = await supabase
            .from('reviews')
            .insert([{
                product_id: productId,
                user_name: userName,
                email,
                rating,
                comment,
                date: date || new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        // Map back to camelCase for frontend
        const reviewResponse = {
            id: returnedReview.id,
            productId: returnedReview.product_id,
            userName: returnedReview.user_name,
            email: returnedReview.email,
            rating: returnedReview.rating,
            comment: returnedReview.comment,
            date: returnedReview.date
        };

        res.status(201).json(reviewResponse);
        clearProductCache(); // Reviews are part of product data
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Dynamic Shipping Calculation (Secure Zone-Based) ---
app.post('/api/shipping/calculate', async (req, res) => {
    try {
        const { state, cartTotal } = req.body;

        if (!state) {
            return res.status(400).json({ error: 'State is required for shipping calculation' });
        }

        const result = await shippingService.calculateShipping(state, cartTotal);
        // 🧪 TEST MODE: Always free shipping
        result.shippingFee = 0;
        result.isFreeShipping = true;
        res.json(result);
    } catch (err) {
        console.error('Shipping API Error:', err.message);
        res.status(500).json({ error: 'Fallback shipping rules applied', charge: 125 });
    }
});

// Orders Routes

/**
 * RECALCULATION ENGINE
 * Ensures prices are valid and variants are accounted for.
 * Authoritative source of financial truth.
 */
const recalculateTotals = async (items, state) => {
    const uniqueProductIds = Array.from(new Set(items.map(item => item.id)));
    const res = await db.query('SELECT id, price, variants FROM products WHERE id = ANY($1)', [uniqueProductIds]);
    const dbProducts = res.rows;

    if (!dbProducts || dbProducts.length === 0) throw new Error('COULD_NOT_FETCH_PRODUCTS');

    let subtotalCents = 0;
    for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        if (!dbProduct) throw new Error(`PRODUCT_NOT_FOUND: ${item.id}`);

        let itemPrice = Number(dbProduct.price);
        if (item.selectedVariant && dbProduct.variants) {
            const variant = dbProduct.variants.find(v => v.weight === item.selectedVariant.weight);
            if (variant) itemPrice = Number(variant.price);
        }
        subtotalCents += Math.round(itemPrice * 100) * (item.quantity || 1);
    }

    const shipping = await shippingService.calculateShipping(state || 'Rest of India', subtotalCents / 100);
    // 🧪 TEST MODE: Always free shipping
    const shippingCents = 0; // Math.round(shipping.shippingFee * 100);

    return {
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        zoneName: shipping.zoneName
    };
};

/**
 * Trigger emails and Shiprocket without blocking the main response
 */
const triggerAsyncTasks = async (orderId, orderData, paymentId) => {
    try {
        const row = orderData; // Use orderData as the source for customer info

        // --- EMAIL NOTIFICATION ---
        const adminEmail = 'admin@kottravai.in';
        const templateData = {
            orderId: orderId,
            customerName: row.customerName,
            customerEmail: row.customerEmail,
            customerPhone: row.customerPhone,
            address: row.address,
            city: row.city,
            pincode: row.pincode,
            total: parseFloat(row.total),
            items: JSON.parse(JSON.stringify(row.items)),
            paymentId: paymentId
        };

        await Promise.all([
            sendEmail({
                to: adminEmail,
                subject: `New Order Received #${orderId} - ${row.customerName}`,
                html: getOrderAdminTemplate(templateData),
                type: 'order'
            }),
            sendEmail({
                to: row.customerEmail,
                subject: `Order Confirmation - #${orderId}`,
                html: getOrderUserTemplate(templateData),
                type: 'order'
            })
        ]).catch(e => console.error('📧 [EMAIL_FAILURE]:', e.message));

        console.log(`📧 [EMAIL_SENT] Order #${orderId}`);

        // --- SHIPROCKET ---
        try {
            console.log(`🚀 [SHIPROCKET_TRIGGERING] Order #${orderId}`);
            let sanitizedPhone = row.customerPhone || "9999999999";
            sanitizedPhone = sanitizedPhone.toString().replace(/\D/g, "").slice(-10);

            const shipmentResult = await shiprocketService.createOrder({
                orderId: orderId,
                orderDate: new Date().toISOString().split('T')[0],
                customer: {
                    firstName: row.customerName.split(' ')[0],
                    lastName: row.customerName.split(' ').slice(1).join(' '),
                    email: row.customerEmail,
                    phone: sanitizedPhone,
                    address: row.address,
                    city: row.city,
                    state: row.state || 'Tamil Nadu',
                    pincode: row.pincode,
                    country: 'India',
                },
                items: row.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku || `SKU-${item.id}`,
                    quantity: item.quantity,
                    price: item.price,
                })),
                payment: { method: 'prepaid' },
                dimensions: { length: 10, breadth: 10, height: 10, weight: 0.5 }
            });

            // Update the order in DB with Shiprocket details
            await db.query(
                "UPDATE orders SET shiprocket_order_id = $1, shipment_id = $2 WHERE order_id = $3",
                [shipmentResult.orderId, shipmentResult.shipmentId, orderId]
            );

            console.log(`📦 [SHIPROCKET_CREATED] Order #${orderId}`);
        } catch (shipErr) {
            console.error('📦 [SHIPROCKET_FAILURE]:', shipErr.message);
        }

    } catch (criticalErr) {
        console.error('🚨 ASYNC_TASK_SYSTEM_FAILURE:', criticalErr.message);
    }
};

/**
 * CORE ORDER PROCESSING ENGINE (Idempotent)
 * Handles DB saving, Email, and Shiprocket logic.
 */
const finalizeOrder = async (orderData, paymentId) => {
    const { orderId } = orderData;

    try {
        // 1. Idempotency Check
        const checkRes = await db.query('SELECT id, status, order_id FROM orders WHERE payment_id = $1', [paymentId]);
        const existingOrder = checkRes.rows[0];

        if (existingOrder) {
            console.log(`ℹ️ [ORDER_ALREADY_EXISTS] Payment ID: ${paymentId}`);
            return { success: true, order: existingOrder, alreadyProcessed: true };
        }

        // 2. Perform Backend Recalculation (Security Guard)
        const calc = await recalculateTotals(orderData.items, orderData.state);

        // 3. Save to Database
        const referralCode = orderData.referral_code || orderData.referralCode;
        const insertRes = await db.query(`
            INSERT INTO orders (
                customer_name, customer_email, customer_phone, address, city, district, state,
                pincode, total, items, payment_id, order_id, status, 
                subtotal_server, shipping_server, total_server, zone_name, referral_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *
        `, [
            orderData.customerName, orderData.customerEmail, orderData.customerPhone, orderData.address,
            orderData.city, orderData.district, orderData.state, orderData.pincode,
            calc.totalCents / 100, JSON.stringify(orderData.items), paymentId, orderId, 'Processing',
            calc.subtotalCents, calc.shippingCents, calc.totalCents, calc.zoneName, referralCode
        ]);

        const row = insertRes.rows[0];

        console.log(`✅ [ORDER_CREATED] Order ID: ${orderId} | ID in DB: ${row.id}`);

        // 4. Affiliate Tracking Logic (Process Sales & Commissions)
        if (referralCode) {
            try {
                let affiliate = null;
                let linkId = null;

                // Priority 1: Check if it's an Affiliate Link Slug
                const linkRes = await db.query(`
                    SELECT a.*, l.id as link_primary_id 
                    FROM affiliate_links l 
                    JOIN affiliates a ON l.affiliate_id = a.id 
                    WHERE l.slug = $1 AND l.is_active = true AND a.status = $2
                `, [referralCode, 'Approved']);
                
                if (linkRes.rows.length > 0) {
                    affiliate = linkRes.rows[0];
                    linkId = linkRes.rows[0].link_primary_id;
                    console.log(`🔗 [LINK_ATTRIBUTION] Matched Link Slug: ${referralCode}`);
                } else {
                    // Priority 2: Check if it's a direct Referral Code
                    const affRes = await db.query('SELECT * FROM affiliates WHERE referral_code = $1 AND status = $2', [referralCode, 'Approved']);
                    if (affRes.rows.length > 0) {
                        affiliate = affRes.rows[0];
                        console.log(`👤 [DIRECT_ATTRIBUTION] Matched Referral Code: ${referralCode}`);
                    }
                }

                if (affiliate) {
                    let totalCommissionAmount = 0;
                    let totalEligiblePrice = 0;
                    
                    // Fetch product details for precise commission calculation
                    const itemIds = orderData.items.map(i => i.id).filter(id => id);
                    if (itemIds.length > 0) {
                        const prodRes = await db.query('SELECT id, name, is_affiliate_eligible, affiliate_commission_rate, affiliate_payout_type, affiliate_fixed_amount FROM products WHERE id = ANY($1)', [itemIds]);
                        const dbProds = prodRes.rows;
                        
                        // 🟢 GAP FIX: Self-Referral Protection
                        if (orderData.customerEmail?.toLowerCase() === affiliate.email?.toLowerCase()) {
                            console.log(`🚫 [SELF_REFERRAL_BLOCKED] Affiliate ${affiliate.name} tried to refer themselves.`);
                        } else {
                            // Process each item individually for granular reporting as requested
                            for (const item of orderData.items) {
                                const product = dbProds.find(p => p.id.toString() === item.id.toString());
                                if (product && product.is_affiliate_eligible) {
                                    const rate = parseFloat(product.affiliate_commission_rate) || 0;
                                    const fixed = parseFloat(product.affiliate_fixed_amount) || 0;
                                    const type = product.affiliate_payout_type || 'percentage';
                                    const price = parseFloat(item.price) || 0;
                                    const qty = parseInt(item.quantity) || 1;
                                    
                                    let itemCommission = 0;
                                    if (type === 'percentage') {
                                        itemCommission = (price * rate / 100) * qty;
                                    } else {
                                        itemCommission = fixed * qty;
                                    }

                                    if (itemCommission > 0) {
                                        totalCommissionAmount += itemCommission;
                                        totalEligiblePrice += price * qty;
                                        
                                        // Insert individual sale record for this specific product
                                        await db.query(`
                                            INSERT INTO affiliate_sales (
                                                affiliate_id, order_id, link_id, product_id, product_name, 
                                                quantity, sale_amount, commission_rate, commission_amount, status
                                            )
                                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                                        `, [
                                            affiliate.id, row.id, linkId, product.id, product.name,
                                            qty, price * qty, (type === 'percentage' ? rate : (itemCommission / (price * qty) * 100)).toFixed(2),
                                            itemCommission, 'approved'
                                        ]);
                                    }
                                }
                            }
                        }
                    }

                    if (totalCommissionAmount > 0) {
                        // Update Affiliate Cumulative Balances once per order
                        // Note: Using totalEligiblePrice instead of calc.totalCents to exclude shipping/non-eligible items from affiliate metrics
                        await db.query(`
                            UPDATE affiliates 
                            SET total_sales = total_sales + $1,
                                total_commission = total_commission + $2,
                                available_balance = available_balance + $2
                            WHERE id = $3
                        `, [totalEligiblePrice, totalCommissionAmount, affiliate.id]);

                        // Link Order to Affiliate ID
                        await db.query('UPDATE orders SET affiliate_id = $1, referral_code = $2 WHERE id = $3', [affiliate.id, referralCode, row.id]);

                        // Update Conversion count if a specific link was used
                        if (linkId) {
                            await db.query('UPDATE affiliate_links SET total_conversions = total_conversions + 1 WHERE id = $1', [linkId]);
                        }
                        
                        console.log(`🎯 [AFFILIATE_SUCCESS] Linked items from order ${row.id} to ${affiliate.name} | Total: ₹${totalCommissionAmount}`);
                    }
                }
            } catch (affError) {
                console.error('⚠️ [AFFILIATE_TRACKING_ERROR]', affError.message);
            }
        }

        // Send emails and trigger Shiprocket
        await triggerAsyncTasks(orderId, orderData, paymentId);

        return { success: true, order: row };

    } catch (err) {
        console.error('❌ [CRITICAL_ORDER_FAILURE]:', err.message);

        // Log to failed_orders for manual retry/recovery
        await db.query(
            'INSERT INTO failed_orders (payment_id, order_id, error_message, payload) VALUES ($1, $2, $3, $4)',
            [paymentId, orderId, err.message, JSON.stringify(orderData)]
        ).catch(dbErr => console.error('🚨 Failed to log failure to DB:', dbErr.message));

        throw err;
    }
};

app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { paymentId, orderId, ...orderData } = req.body; // Extract orderData

        const result = await finalizeOrder({ ...orderData, orderId }, paymentId);
        res.status(201).json(result.order);

    } catch (err) {
        res.status(500).json({ error: 'ORDER_ERROR', message: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        // Admin Access Bypass
        const adminSecret = req.headers['x-admin-secret'];
        if (adminSecret && adminSecret === (process.env.ADMIN_PASSWORD || 'admin123')) {
            const resAdmin = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
            const rows = resAdmin.rows;

            return res.json(rows.map(row => ({
                id: row.id,
                orderId: row.order_id,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                customerPhone: row.customer_phone,
                address: row.address,
                city: row.city,
                district: row.district,
                state: row.state,
                pincode: row.pincode,
                total: parseFloat(row.total),
                status: row.status,
                date: row.created_at,
                items: row.items,
                paymentId: row.payment_id,
                shiprocketOrderId: row.shiprocket_order_id,
                shipmentId: row.shipment_id,
                zoneName: row.zone_name
            })));
        }

        // Standard User Access (Requires Token)
        authenticateToken(req, res, async () => {
            const userEmail = req.user.email;
            const userMobile = req.user.mobile;

            if (!userEmail && !userMobile) return res.json([]);

            try {
                let resUser;
                if (userEmail) {
                    resUser = await db.query('SELECT * FROM orders WHERE customer_email ILIKE $1 ORDER BY created_at DESC', [userEmail]);
                } else {
                    const sanitizedPhone = userMobile.replace(/\D/g, "").slice(-10);
                    if (!sanitizedPhone || sanitizedPhone.length < 10) return res.json([]);
                    resUser = await db.query('SELECT * FROM orders WHERE customer_phone LIKE $1 ORDER BY created_at DESC', [`%${sanitizedPhone}%`]);
                }

                const rows = resUser.rows;

                res.json(rows.map(row => ({
                    id: row.id,
                    orderId: row.order_id,
                    customerName: row.customer_name,
                    customerEmail: row.customer_email,
                    customerPhone: row.customer_phone,
                    address: row.address,
                    city: row.city,
                    district: row.district,
                    state: row.state,
                    pincode: row.pincode,
                    total: parseFloat(row.total),
                    status: row.status,
                    date: row.created_at,
                    items: row.items,
                    paymentId: row.payment_id,
                    shiprocketOrderId: row.shiprocket_order_id,
                    shipmentId: row.shipment_id,
                    zoneName: row.zone_name
                })));
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/api/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // ... existing logic ...

        const result = await db.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const row = result.rows[0];

        // 🟢 GAP FIX: Revoke Affiliate Commission for Cancelled/Refunded orders
        if (status === 'Cancelled' || status === 'Refunded') {
            try {
                // Find if there's an associated affiliate sale
                const saleRes = await db.query('SELECT * FROM affiliate_sales WHERE order_id = $1 AND status = $2', [id, 'approved']);
                if (saleRes.rows.length > 0) {
                    const sale = saleRes.rows[0];
                    
                    // 1. Mark sale as voided/refunded
                    await db.query('UPDATE affiliate_sales SET status = $1 WHERE id = $2', [status.toLowerCase(), sale.id]);
                    
                    // 2. Deduct from affiliate balance
                    await db.query(`
                        UPDATE affiliates 
                        SET total_sales = total_sales - $1,
                            total_commission = total_commission - $2,
                            available_balance = available_balance - $2
                        WHERE id = $3
                    `, [sale.sale_amount, sale.commission_amount, sale.affiliate_id]);
                    
                    console.log(`♻️ [AFFILIATE_COMMISSION_REVOKED] Order #${id} was ${status}. Deducted ${sale.commission_amount} from Affiliate #${sale.affiliate_id}`);
                }
            } catch (revError) {
                console.error('⚠️ [REVOCATION_ERROR]:', revError.message);
            }
        }

        res.json({
            id: row.id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            status: row.status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // ... existing logic ...
        const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Products API (Supabase JS Unified)
app.get('/api/products', async (req, res) => {
    try {
        // Robust Configuration Guard
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Server Config Error: Supabase URL or Key is missing from environment variables.');
            return res.status(500).json({ 
                error: 'Server Configuration Error', 
                message: 'Database connection parameters are missing in the server environment.' 
            });
        }

        const { category_slug, is_best_seller, limit = 50, offset = 0 } = req.query;
        console.log(`📡 Fetching products: Category=${category_slug || 'ALL'}, BestSeller=${is_best_seller || 'N/A'}`);

        const adminSecret = req.headers['x-admin-secret'] || req.headers['X-Admin-Secret'];
        const systemSecret = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';
        const isAdmin = adminSecret === systemSecret;

        let query = supabase
            .from('products')
            .select('*');

        // PUBLIC: Only show live products. ADMIN: Show everything (Live + Draft).
        if (!isAdmin) {
            query = query.eq('is_live', true);
        }

        if (category_slug) {
            query = query.eq('category_slug', category_slug);
        }

        if (is_best_seller === 'true') {
            query = query.eq('is_best_seller', true);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) {
            console.error('❌ Supabase Fetch Error (Products):', error);
            return res.status(500).json({ error: 'Database Fetch Error', details: error.message || error });
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No products found matching criteria');
        }

        res.json(data || []);
    } catch (err) {
        console.error('💥 Internal Fetch Error:', err);
        res.status(500).json({ error: 'Unexpected Server Error', details: err.message });
    }
});

app.get('/api/products/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        console.log(`📡 Fetching detailed product: ${slug}`);

        // Fetch product with nested reviews (optimizing into one query)
        const adminSecret = req.headers['x-admin-secret'] || req.headers['X-Admin-Secret'];
        const systemSecret = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';
        const isAdmin = adminSecret === systemSecret;

        // Fetch product with nested reviews
        let query = supabase
            .from('products')
            .select('*, reviews(*)')
            .eq('slug', slug);

        // PUBLIC: Must be live. ADMIN: Can see if draft.
        if (!isAdmin) {
            query = query.eq('is_live', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Supabase Detailed Fetch Error:', error);
            return res.status(500).json({ error: 'Database Fetch Error', details: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(data[0]);
    } catch (err) {
        console.error('💥 Detailed Product Fetch Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// Wishlist Routes

app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;

        const query = `
            SELECT 
                p.id, p.name, p.price, p.category, p.image, p.slug, 
                p.category_slug, p.short_description, p.is_best_seller, 
                p.is_custom_request, p.created_at
            FROM products p
            JOIN wishlist w ON p.id = w.product_id
            WHERE w.username = $1
            ORDER BY w.created_at DESC
        `;
        const result = await db.query(query, [username]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wishlist/toggle', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: 'Product ID is required' });

        // Check if exists
        const check = await db.query('SELECT * FROM wishlist WHERE username = $1 AND product_id = $2', [username, productId]);

        if (check.rows.length > 0) {
            // Remove
            await db.query('DELETE FROM wishlist WHERE username = $1 AND product_id = $2', [username, productId]);
            res.json({ status: 'removed' });
        } else {
            // Add
            await db.query('INSERT INTO wishlist (username, product_id) VALUES ($1, $2)', [username, productId]);
            res.json({ status: 'added' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// B2B Inquiry Email


app.post('/api/b2b-inquiry', verifyCaptcha, async (req, res) => {
    try {
        const { name, email, phone, company, location, products, quantity, notes } = req.body;

        const adminEmail = 'admin@kottravai.in';


        // Send emails with B2B reply-to routing
        await Promise.all([
            sendEmail({
                to: adminEmail,
                subject: `New B2B Inquiry from ${name} - ${company || 'Individual'}`,
                html: getB2BAdminTemplate(req.body),
                type: 'b2b'
            }),
            sendEmail({
                to: email,
                subject: 'Thank you for contacting Kottravai B2B',
                html: getB2BUserTemplate(req.body),
                type: 'b2b'
            })
        ]);

        res.json({ status: 'success', message: 'Inquiry sent successfully' });

    } catch (error) {
        console.error('B2B Email Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send email. Please try again later.' });
    }
});

// Custom Request Inquiry Email
app.post('/api/custom-request', verifyCaptcha, async (req, res) => {
    try {
        const { name, email, phone, requestedText, referenceImage, customFields, productName, allFields } = req.body;
        const adminEmail = 'admin@kottravai.in';

        // Prepare Attachments
        const attachments = [];
        let imageHtml = '';

        if (referenceImage && referenceImage.startsWith('data:')) {
            const matches = referenceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const type = matches[1]; // e.g., image/png
                const data = matches[2];
                const extension = type.split('/')[1];

                attachments.push({
                    filename: `reference-image.${extension}`,
                    content: Buffer.from(data, 'base64')
                });

                // For HTML embedding (optional, but good for preview)
                imageHtml = `
                <div style="margin-top: 20px;">
                    <strong style="color: #2D1B4E;">Reference Image (Attached):</strong>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        Image has been attached to this email.
                    </div>
                </div>`;
            }
        } else if (referenceImage) {
            // Fallback for URL links
            imageHtml = `
                <div style="margin-top: 20px;">
                    <strong style="color: #2D1B4E;">Reference Image:</strong>
                    <div style="margin-top: 10px;">
                        <img src="${referenceImage}" alt="Reference" style="max-width: 100%; border-radius: 8px;" />
                    </div>
                </div>`;
        }


        // Construct dynamic fields HTML
        let fieldsHtml = '';
        if (allFields && Array.isArray(allFields)) {
            fieldsHtml = allFields.map(f => `
                <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                    <strong style="color: #2D1B4E;">${f.label}:</strong>
                    <div style="margin-top: 5px; color: #555;">${f.value || 'N/A'}</div>
                </div>
            `).join('');
        }

        const adminHtmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #2D1B4E; border-bottom: 2px solid #8E2A8B; padding-bottom: 10px;">Customization Inquiry</h2>
                <div style="background: #f0fdf4; padding: 10px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
                    <strong>Product:</strong> ${productName}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #8E2A8B; margin-bottom: 10px;">Customer Details</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Phone:</strong> ${phone}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #8E2A8B; margin-bottom: 10px;">Request Details</h3>
                    ${fieldsHtml}
                    <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                        <strong style="color: #2D1B4E;">Additional Message:</strong>
                        <div style="margin-top: 5px; color: #555;">${requestedText || 'N/A'}</div>
                    </div>
                </div>

                ${imageHtml}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                    This inquiry was sent from the Kottravai Product Details page.
                </div>
            </div>
        `;

        const customerHtmlContent = `
             <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #2D1B4E;">We Received Your Request</h2>
                </div>
                <p>Hi ${name},</p>
                <p>Thank you for your interest in <strong>${productName}</strong>.</p>
                <p>We have received your customization details and our team will review them shortly. We will get back to you with a quote and timeline within 24-48 hours.</p>
                
                <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                    <strong>Your Request Summary:</strong>
                    <ul style="color: #555; padding-left: 20px;">
                        <li><strong>Product:</strong> ${productName}</li>
                        <li><strong>Phone:</strong> ${phone}</li>
                    </ul>
                </div>

                <p style="margin-top: 30px;">Best Regards,<br/>Team Kottravai</p>
            </div>
        `;

        // Send Email to Admin
        await sendEmail({
            to: adminEmail,
            subject: `New Customization Request: ${productName} - ${name}`,
            html: adminHtmlContent,
            type: 'custom',
            attachments: attachments
        });

        // Send Confirmation to Customer
        await sendEmail({
            to: email,
            subject: `Request Received: ${productName}`,
            html: customerHtmlContent,
            type: 'custom'
        });

        res.json({ status: 'success', message: 'Custom request sent successfully' });

    } catch (error) {
        console.error('Custom Request Email Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send request.' });
    }
});

// Contact Form Email
app.post('/api/contact', verifyCaptcha, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const adminEmail = 'admin@kottravai.in';


        // Send emails with support reply-to routing
        await Promise.all([
            sendEmail({
                to: adminEmail,
                subject: `New Contact Submission: ${subject || 'General Inquiry'}`,
                html: getContactAdminTemplate(req.body),
                type: 'contact'
            }),
            sendEmail({
                to: email,
                subject: `We Received Your Message - Kottravai`,
                html: getContactUserTemplate(req.body),
                type: 'contact'
            })
        ]);

        res.json({ status: 'success', message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Email Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send message.' });
    }
});

// --- OTP Verification Routes ---
// Use these to verify mobile before Supabase signup

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile || mobile.length !== 10) {
            return res.status(400).json({ message: 'Invalid mobile number' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.query(
            'INSERT INTO otps (mobile, otp, expires_at) VALUES ($1, $2, $3)',
            [mobile, otp, expiresAt]
        );

        console.log(`\n📱 [OTP SENT] To: ${mobile} | Code: ${otp}\n`);
        res.json({ message: 'OTP sent' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const result = await db.query(
            'SELECT * FROM otps WHERE mobile = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [mobile, otp]
        );

        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// --- Email OTP Verification Routes ---
// Email-based authentication with OTP sent to user's email

app.post('/api/auth/send-email-otp', async (req, res) => {
    try {
        const { email, type = 'signup' } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        // If type is forgot, check if user exists
        if (type === 'forgot') {
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) throw listError;

            const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase());
            if (!userExists) {
                return res.status(404).json({ message: 'No account found with this email address' });
            }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database
        await db.query(
            'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
            [email.toLowerCase(), otp, expiresAt]
        );

        // Send OTP via email
        const otpEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2D1B4E; margin: 0; font-size: 28px;">Kottravai</h1>
                        <p style="color: #666; margin-top: 10px;">${type === 'forgot' ? 'Password Reset Verification' : 'Email Verification'}</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #b5128f 0%, #8E2A8B 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="color: white; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <h2 style="color: white; margin: 0; font-size: 36px; letter-spacing: 8px; font-weight: bold;">${otp}</h2>
                    </div>
                    
                    <div style="margin: 25px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                        <p style="margin: 0; color: #065f46; font-size: 14px;">
                            <strong>⏱️ This code expires in 10 minutes</strong>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #065f46; font-size: 13px;">
                            Enter this code to ${type === 'forgot' ? 'reset your password' : 'complete your registration'}.
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                            If you didn't request this code, please ignore this email.
                        </p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                            © ${new Date().getFullYear()} Kottravai. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: `${type === 'forgot' ? 'Reset Your Password' : 'Your Verification Code'}: ${otp}`,
            html: otpEmailHtml,
            type: 'contact'
        });

        console.log(`\n📧 [EMAIL OTP SENT] To: ${email} | Type: ${type} | Code: ${otp}\n`);
        res.json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Send Email OTP Error:', err);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

app.post('/api/auth/verify-email-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const result = await db.query(
            'SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1) AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (result.rows.length > 0) {
            // We DON'T delete here anymore, only verify it exists and is valid.
            // It will be deleted by the final action (register or reset-password).
            res.json({ success: true, message: 'Email verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
    } catch (err) {
        console.error('Verify Email OTP Error:', err);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

// Reset password with OTP
app.post('/api/auth/reset-password-with-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password are required' });
        }

        // 1. Verify OTP first
        const result = await db.query(
            'SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1) AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // 2. Find user in Supabase
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 3. Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        // 4. Delete used OTP
        await db.query('DELETE FROM email_otps WHERE id = $1', [result.rows[0].id]);

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
});

// Send Password Reset Link (Link-based)
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Check if user exists in Supabase
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Clear existing tokens for this email and save new one
        await db.query('DELETE FROM password_reset_tokens WHERE LOWER(email) = LOWER($1)', [email]);
        await db.query(
            'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
            [email.toLowerCase(), token, expiresAt]
        );

        // Build reset link (pointing to another application if specified, or default)
        const appUrl = process.env.VITE_APP_URL || process.env.FRONTEND_URL || 'https://kottravai.in';
        const resetLink = `${appUrl}/reset-password?token=${token}`;

        // Send Email
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2D1B4E;">
                <div style="background: linear-gradient(to right, #2D1B4E, #8E2A8B); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
                </div>
                <div style="padding: 40px 30px; background: white; border: 1px solid #edf2f7; border-top: none; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
                    <p style="font-size: 16px; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to proceed:</p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetLink}" style="background: #8E2A8B; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset My Password</a>
                    </div>
                    <p style="font-size: 14px; color: #718096; line-height: 1.6;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #edf2f7; margin: 30px 0;">
                    <p style="font-size: 12px; color: #a0aec0;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                    <p style="font-size: 11px; color: #8E2A8B; word-break: break-all;">${resetLink}</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Reset Your Password | Kottravai',
            html: emailHtml,
            type: 'contact'
        });

        res.json({ success: true, message: 'Password reset link sent to your email' });
    } catch (err) {
        console.error('Forgot Password Link Error:', err);
        res.status(500).json({ error: 'Failed to process request. Please try again later.' });
    }
});

// Reset Password (using Token from link)
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        // 1. Verify token
        const tokenRes = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const { email } = tokenRes.rows[0];

        // 2. Find user in Supabase
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) return res.status(404).json({ error: 'User no longer exists' });

        // 3. Update password in Supabase
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        // 4. Delete token
        await db.query('DELETE FROM password_reset_tokens WHERE email = $1', [email]);

        res.json({ success: true, message: 'Your password has been reset successfully. You can now login with your new password.' });
    } catch (err) {
        console.error('Reset Password Token Error:', err);
        res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
});

// Change Password (Authenticated session)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userEmail = req.user.email;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old password and new password are required' });
        }

        // 1. Verify old password by attempting a sign-in (Supabase security best practice)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: oldPassword
        });

        if (authError || !authData.user) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        // 2. Update to new password using Admin SDK
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            req.user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change Password Error:', err);
        res.status(500).json({ error: 'Failed to update password. Please try again.' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        // Validate inputs
        if (!username || !email || !password || !otp) {
            return res.status(400).json({ error: 'Username, email, password, and OTP are required' });
        }

        // 1. Verify and consume OTP
        const otpResult = await db.query(
            'SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1) AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // 2. Validate formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Create user in Supabase with email
        const { data, error } = await supabase.auth.admin.createUser({
            email: email.toLowerCase(),
            password,
            email_confirm: true, // AUTO-CONFIRM since we verified via OTP
            user_metadata: {
                username,
                full_name: username // Can be updated later
            }
        });

        if (error) throw error;

        // 3. Delete used OTP
        await db.query('DELETE FROM email_otps WHERE id = $1', [otpResult.rows[0].id]);

        console.log(`✅ User registered successfully: ${email}`);
        res.status(201).json({
            user: data.user,
            message: 'Registration successful'
        });
    } catch (err) {
        console.error('Registration Error Details:', err);
        let errorMessage = err.message || 'Registration failed';

        // Handle specific Supabase Auth Errors
        if (err.code === 'email_exists' || err.message?.includes('already registered') || err.message?.includes('User already registered')) {
            errorMessage = "This email is already registered. Please login instead.";
        } else if (err.message?.includes('username')) {
            errorMessage = "This username is already taken.";
        }

        res.status(400).json({ error: errorMessage });
    }
});

// --- End Auth Routes ---

const affiliateRouter = require('./routes/affiliates')(authenticateToken, authenticateAdmin);
app.use('/api/affiliates', affiliateRouter);


// Razorpay Integration
const Razorpay = require('razorpay');

// Initialize Razorpay
// NOTE: Using environment variables for keys is recommended
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.post('/api/razorpay/order', async (req, res) => {
    try {
        const { amount, currency, orderData, referral_code } = req.body;
        console.log(`💳 Creating Razorpay order: Amount=${amount}, Currency=${currency || 'INR'} | Ref=${referral_code || 'NONE'}`);

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: currency || "INR",
            receipt: "order_rcptid_" + Date.now()
        };

        const activeOrder = await razorpay.orders.create(options);

        // --- PERSIST PENDING ORDER FOR WEBHOOK ---
        if (orderData) {
            // Include referral code in the persisted data
            const finalOrderData = { ...orderData, referral_code };
            await db.query(
                'INSERT INTO pending_orders (razorpay_order_id, order_data) VALUES ($1, $2) ON CONFLICT (razorpay_order_id) DO UPDATE SET order_data = $2',
                [activeOrder.id, JSON.stringify(finalOrderData)]
            ).catch(pError => console.error('⚠️ [PENDING_ORDER_SAVE_FAILED]', pError.message));

            console.log(`📋 PENDING_ORDER_SAVED: ${activeOrder.id}`);
        }

        console.log(`✅ Razorpay order created: ${activeOrder.id}`);
        res.json(activeOrder);
    } catch (error) {
        console.error("❌ Razorpay Order Creation Failed:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * WEBHOOK: The ultimate reliability fallback.
 * Processes orders even if frontend crashes.
 */
app.post('/api/razorpay/webhook', async (req, res) => {
    console.log('🔔 [WEBHOOK_RECEIVED]');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'kottravai_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('❌ [SIGNATURE_MISMATCH] Webhook authenticity failed');
            return res.status(400).send('Invalid signature');
        }

        console.log('✅ [SIGNATURE_VERIFIED] Webhook is authentic');
        const event = req.body.event;

        if (event === 'payment.captured') {
            const payment = req.body.payload.payment.entity;
            const razorpayOrderId = payment.order_id;
            const paymentId = payment.id;

            console.log(`💰 [PAYMENT_CAPTURED] Razorpay Order: ${razorpayOrderId} | Payment: ${paymentId}`);

            // 1. Fetch pending order data
            const pendingRes = await db.query('SELECT order_data FROM pending_orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
            const pending = pendingRes.rows[0];

            if (!pending) {
                console.error(`❌ [WEBHOOK_RECONSTRUCTION_FAILED] No pending data for Order ${razorpayOrderId}`);
                // Store in failed_orders for manual intervention
                await db.query(
                    'INSERT INTO failed_orders (payment_id, order_id, error_message) VALUES ($1, $2, $3)',
                    [paymentId, razorpayOrderId, 'RECONSTRUCTION_FAILED: Missing data in pending_orders']
                );
                return res.status(200).send('Logged failure'); // Still return 200 to Razorpay
            }

            // 2. Process Order
            const finalOrderData = {
                ...pending.order_data,
                orderId: razorpayOrderId // Ensure orderId is passed correctly
            };

            const result = await finalizeOrder(finalOrderData, paymentId);
            console.log('✅ Webhook: Order finalized for', paymentId, 'Result:', result);

            // Clean up pending
            await db.query('DELETE FROM pending_orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('💥 [WEBHOOK_ERROR]', err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/razorpay/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, referral_code } = req.body;
        console.log("Verifying payment for Order ID:", razorpay_order_id);

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            console.log("✅ Payment signature valid!");

            // Trigger order finalization immediately (Idempotent)
            // This handles the case where the user stays on the page
            if (orderData) {
                await finalizeOrder({
                    ...orderData,
                    orderId: razorpay_order_id, // Ensure orderId is passed correctly
                    referral_code: referral_code || (orderData && orderData.referral_code)
                }, razorpay_payment_id).catch(e => console.error('ℹ️ [VERIFY_FLOW_FINALIZATION_REDUNDANT]', e.message));
            }

            res.json({ status: "success", message: "Payment verified successfully" });
        } else {
            console.error("❌ Payment verification failed: Signature mismatch");
            res.json({ status: "failure", message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// --- RECOVERY ENDPOINT ---
app.get('/api/recover-order/:payment_id', async (req, res) => {
    try {
        const { payment_id } = req.params;
        console.log(`🔍 [RECOVERY] Attempting recovery for Payment: ${payment_id}`);

        // 1. Fetch from Razorpay
        const payment = await razorpay.payments.fetch(payment_id);
        if (!payment || payment.status !== 'captured') {
            return res.status(400).json({ error: 'PAYMENT_NOT_CAPTURED', status: payment?.status });
        }

        const razorpayOrderId = payment.order_id;

        // 2. Fetch pending data
        const pendingRes = await db.query('SELECT order_data FROM pending_orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
        const pending = pendingRes.rows[0];

        if (!pending) {
            return res.status(404).json({ error: 'PENDING_DATA_EXPIRED', message: 'Reconstruction data no longer available' });
        }

        // 3. Finalize
        const result = await finalizeOrder({
            ...pending.order_data,
            orderId: razorpayOrderId // Ensure orderId is passed correctly
        }, payment_id);

        res.json({ success: true, message: 'Order recovered successfully', order: result.order });
    } catch (err) {
        res.status(500).json({ error: 'RECOVERY_FAILED', message: err.message });
    }
});
// --- Static File Serving (For Production) ---
app.use(express.static(path.join(__dirname, '../dist')));


// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

/**
 * --- GLOBAL ERROR HANDLER ---
 * Final safety net to capture non-route-handler errors
 */
app.use((err, req, res, next) => {
    console.error('💥 [GLOBAL_ERROR_HANDLER]', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'An unexpected server error occurred',
        error_code: err.code || 'INTERNAL_ERROR',
        // Stack only visible for debugging outside of production if needed
        details: process.env.NODE_ENV === 'production' ? 'Refer to server logs' : err.stack
    });
});

// Only listen if running directly (not when imported as a module/serverless function)
if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ Port ${PORT} is already in use!`);
            console.error(`   Run this in PowerShell to fix it:`);
            console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
            console.error(`   Then run 'npm run dev' again.\n`);
            process.exit(1);
        } else {
            throw err;
        }
    });
}

module.exports = app;
