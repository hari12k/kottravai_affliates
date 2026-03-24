const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const deployDir = path.join(rootDir, 'hostinger_deploy');

// Helper to copy directory recursively
const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.env') continue;
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

console.log('🚀 Preparing Hostinger Deployment Package...');

// 1. Build Frontend
console.log('📦 Building React Frontend...');
try {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Build failed! Please fix errors first.');
    process.exit(1);
}

// 2. Create Deploy Folder
if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

console.log('📂 Copying Server Files...');
copyDir(path.join(rootDir, 'server'), path.join(deployDir, 'server'));

console.log('📂 Copying Build Artifacts...');
copyDir(path.join(rootDir, 'dist'), path.join(deployDir, 'dist'));

console.log('📂 Copying Configuration...');
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(deployDir, 'package.json'));
// Create a sample .env.production
const envContent = `PORT=3000
# Add your Supabase & Email credentials here
DATABASE_URL=
SUPABASE_URL=
SUPABASE_KEY=
`;
fs.writeFileSync(path.join(deployDir, '.env.example'), envContent);
fs.writeFileSync(path.join(deployDir, 'server', '.env.example'), envContent);


// 3. Create Instructions
const instructions = `
HOSTINGER DEPLOYMENT INSTRUCTIONS
=================================

1. ZIP this 'hostinger_deploy' folder (or its contents).
2. Go to Hostinger File Manager -> public_html.
3. Upload and Extract the ZIP.
4. Go to Hostinger Dashboard -> VPS / Cloud / Shared Hosting -> Node.js App (if available) OR SSH.

OPTION A: Hostinger Node.js App (Shared/Cloud Hosting)
------------------------------------------------------
1. Select Node.js Version (v18+ recommended).
2. Application Root: 'public_html' (or where you extracted).
3. Application Startup File: 'server/index.js'.
4. Run 'npm install' inside the 'server' folder (via terminal or button).
   - NOTE: You may need to copy 'package.json' from 'server/' to root if Hostinger requires it at root.
   - Ideally, copy 'server/package.json' to 'public_html/package.json' temporarily to install deps.
5. Create a '.env' file in 'server/' with your production variables.
6. Start the App.

OPTION B: Manual / VPS (SSH)
----------------------------
1. SSH into your server.
2. Navigate to the folder: 'cd public_html'.
3. Install dependencies: 'npm install' (in root) AND 'cd server && npm install'.
4. Setup Process Manager (PM2):
   npm install -g pm2
   pm2 start server/index.js --name kottravai
   pm2 save
5. Configure Nginx Reverse Proxy (if not using built-in Node app).

Good Luck!
`;
fs.writeFileSync(path.join(deployDir, 'DEPLOY_INSTRUCTIONS.txt'), instructions);

console.log('✅ Deployment Package Ready at: ' + deployDir);
console.log('👉 Open "hostinger_deploy" folder and follow DEPLOY_INSTRUCTIONS.txt');
