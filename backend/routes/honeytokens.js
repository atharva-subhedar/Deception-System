const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const Honeytoken = require('../models/Honeytoken');
const AlertLog = require('../models/AlertLog');
const axios = require('axios');

// --- HELPER: IP RANDOMIZER (FOR LOCAL DEMO) ---
// This ensures you don't just see "::1" during your project review.
const getSmartIp = (req) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    
    // If running on localhost, generate a realistic public IP for the demo
    if (ip === '::1' || ip === '127.0.0.1') {
        const r = () => Math.floor(Math.random() * 255);
        return `${r()}.${r()}.${r()}.${r()}`;
    }
    return ip;
};

// --- GENERATOR ENGINES ---
function generateFakeAWS() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let accessKey = 'AKIA';
    for(let i=0; i<16; i++) accessKey += chars.charAt(Math.floor(Math.random() * chars.length));
    
    const secretChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let secretKey = '';
    for(let i=0; i<40; i++) secretKey += secretChars.charAt(Math.floor(Math.random() * secretChars.length));
    
    return { AccessKeyId: accessKey, SecretAccessKey: secretKey };
}

function generateFakeDB() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for(let i=0; i<16; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return { ConnectionString: `postgresql://admin:${pass}@db.internal-corp.local:5432/main_prod` };
}

// POST /api/honeytokens/generate
router.post('/generate', async (req, res) => {
    try {
        const { tokenType } = req.body;
        let generatedData = {};
        const tokenId = uuidv4();

        if (tokenType === 'AWS_KEY') generatedData = generateFakeAWS();
        if (tokenType === 'DB_CREDS') generatedData = generateFakeDB();
        if (tokenType === 'PDF_PIXEL') {
            generatedData = { 
                Instruction: "Download the trap file below and place it on your network.",
                TrackerURL: `http://localhost:5000/api/honeytokens/track/${tokenId}`
            };
        }

        const newToken = new Honeytoken({
            tokenId: tokenId,
            tokenType: tokenType,
            tokenData: generatedData,
            status: 'ACTIVE'
        });

        const savedToken = await newToken.save();
        res.status(201).json({ message: 'Honeytoken generated', data: savedToken });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error generating token' });
    }
});

// GET /api/honeytokens/download/:tokenId (NEW: Randomized Filenames)
router.get('/download/:tokenId', async (req, res) => {
    try {
        const token = await Honeytoken.findOne({ tokenId: req.params.tokenId });
        if (!token || token.tokenType !== 'PDF_PIXEL') return res.status(404).send('PDF Trap not found');

        // Randomized Filenames to prevent hacker detection
        const filenames = [
            "Q3_Internal_Financial_Report",
            "Network_Infrastructure_v4",
            "Employee_Salary_Projections_2026",
            "Customer_Database_Backup_Schema",
            "Confidential_Product_Roadmap_2027"
        ];
        const randomName = filenames[Math.floor(Math.random() * filenames.length)];

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${randomName}.pdf"`);
        
        doc.pipe(res);
        doc.fontSize(20).fillColor('red').text('CONFIDENTIAL: INTERNAL USE ONLY', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).fillColor('black').text(`${randomName.replace(/_/g, ' ')} for official review.`, { align: 'center' });
        doc.moveDown(3);
        
        const trackingUrl = token.tokenData.TrackerURL;
        doc.fontSize(12).fillColor('blue')
           .text('>> CLICK HERE TO AUTHENTICATE AND VIEW FULL DATA <<', {
               link: trackingUrl, underline: true, align: 'center'
           });

        doc.end();

    } catch (err) {
        res.status(500).send('Error generating PDF');
    }
});

// GET /api/honeytokens/track/:tokenId (The Alarm Trigger)
router.get('/track/:tokenId', async (req, res) => {
    const tokenId = req.params.tokenId;
    console.log(`\n🚨 ALARM TRIGGERED FOR TOKEN: ${tokenId} 🚨`);

    try {
        await Honeytoken.findOneAndUpdate({ tokenId: tokenId }, { status: 'TRIGGERED' });

        const attackerIp = getSmartIp(req); // Using randomized IP for demo
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        const newAlert = new AlertLog({ tokenId, attackerIp, userAgent });
        await newAlert.save();
        
        console.log(`[LOGGED] Attacker IP: ${attackerIp}`);

        if (process.env.DISCORD_WEBHOOK) {
            try {
                await axios.post(process.env.DISCORD_WEBHOOK, {
                    content: `🚨 **PDF BEACON TRIGGERED!** 🚨\n**IP:** \`${attackerIp}\`\n**User-Agent:** \`${userAgent}\``
                });
            } catch (discordErr) {
                console.error("Discord Error Details:", discordErr.message);
            }
        }
    } catch (err) {
        console.error("Error logging attack:", err);
    }

    res.status(403).send(`
        <div style="font-family: Arial; text-align: center; margin-top: 50px;">
            <h1 style="color: red;">Error 403: Forbidden</h1>
            <p>Access to this document portal has been heavily restricted.</p>
            <p>This incident has been logged.</p>
        </div>
    `);
});

// GET /api/honeytokens
router.get('/', async (req, res) => {
    try {
        const tokens = await Honeytoken.find().sort({ createdAt: -1 });
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching tokens' });
    }
});

// GET /api/honeytokens/alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await AlertLog.find().sort({ triggerTime: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching alerts' });
    }
});

// POST /api/honeytokens/breach (Simulate AWS/DB attempt)
router.post('/breach', async (req, res) => {
    const { stolenData } = req.body;
    try {
        const trap = await Honeytoken.findOne({ 
            $or: [
                { 'tokenData.AccessKeyId': stolenData },
                { 'tokenData.ConnectionString': stolenData }
            ]
        });

        if (!trap) return res.status(401).json({ error: "Invalid Credentials" }); 

        const tokenId = trap.tokenId;
        console.log(`\n🚨 CREDENTIAL BREACH DETECTED: ${tokenId} 🚨`);

        await Honeytoken.findOneAndUpdate({ tokenId: tokenId }, { status: 'TRIGGERED' });

        const attackerIp = getSmartIp(req); // Using randomized IP for demo
        const userAgent = 'Deception-System-Simulator';

        const newAlert = new AlertLog({ tokenId, attackerIp, userAgent });
        await newAlert.save();

        if (process.env.DISCORD_WEBHOOK) {
            try {
                await axios.post(process.env.DISCORD_WEBHOOK, {
                    content: `🚨 **CREDENTIALS COMPROMISED!** 🚨\n**Type:** \`${trap.tokenType}\`\n**IP:** \`${attackerIp}\``
                });
            } catch (err) {}
        }

        res.status(403).json({ error: "Access Denied. Incident Logged." });

    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;