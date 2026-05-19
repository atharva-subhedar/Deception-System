// ==========================================
// SENTINEL-X: Active Defense Backend
// ==========================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🚨 PASTE YOUR GEMINI API KEY HERE 🚨
const GEMINI_API_KEY = "AIzaSyBsPKQMiFYfXUog4u_Mut-O68a6O3G7jvg"; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// MONGODB SCHEMAS & MODELS
// ==========================================

const alertLogSchema = new mongoose.Schema({
    trapId: String,
    ipAddress: String,
    userAgent: String,
    attackerType: { type: String, default: "Unknown" },
    timestamp: { type: Date, default: Date.now },
    location: {
        city: { type: String, default: "Unknown" },
        country: { type: String, default: "Unknown" },
        isp: { type: String, default: "Unknown" },
        lat: { type: Number },
        lon: { type: Number }
    }
});
const AlertLog = mongoose.model('AlertLog', alertLogSchema);

const honeytokenSchema = new mongoose.Schema({
    tokenId: { type: String, required: true, unique: true },
    tokenType: String, 
    tokenData: mongoose.Schema.Types.Mixed, 
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "ACTIVE" }
});
const Honeytoken = mongoose.model('Honeytoken', honeytokenSchema);

// NEW AI REPORT SCHEMA
const threatReportSchema = new mongoose.Schema({
    generatedAt: { type: Date, default: Date.now },
    reportText: String,
    analyzedLogCount: Number
});
const ThreatReport = mongoose.model('ThreatReport', threatReportSchema);
// 🧹 TEMPORARY: Wipe database for presentation
app.get('/api/reset-everything', async (req, res) => {
    try {
        await Honeytoken.deleteMany({});
        await AlertLog.deleteMany({});
        await ThreatReport.deleteMany({});
        res.send("<h1>✅ DATABASE FLUSHED.</h1><p>Your Guardian-X system is now pristine for the presentation.</p>");
    } catch (e) {
        res.status(500).send("Failed to reset");
    }
});
// ==========================================
// API ROUTES 
// ==========================================

// 1. Generate New Honeytoken 
app.post('/api/honeytokens/generate', async (req, res) => {
    try {
        const { tokenType } = req.body;
        const newTokenId = uuidv4();
        let generatedData = {};

        if (tokenType === 'AWS_KEY') {
            generatedData = {
                AccessKeyId: `AKIA${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
                SecretAccessKey: Math.random().toString(36).substring(2, 32)
            };
        } else if (tokenType === 'DB_CREDS') {
            // Generates a random 6-character suffix so every DB string is unique
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            generatedData = { ConnectionString: `postgres://admin:supersecret@db-prod.globalcorp.internal:5432/finance_db_${randomSuffix}?sslmode=require` };
        } else if (tokenType === 'PDF_PIXEL') {
            generatedData = { TrackingUrl: `http://localhost:5000/api/trap/${newTokenId}`, FileName: "Q3_Financial_Report.pdf" };
        }

        const newTrap = new Honeytoken({ tokenId: newTokenId, tokenType: tokenType, tokenData: generatedData, status: "ACTIVE" });
        await newTrap.save();
        res.status(201).json({ message: "Trap generated", trap: newTrap });
    } catch (error) {
        res.status(500).json({ message: "Error generating trap" });
    }
});

// 2. Fetch Active Traps
app.get('/api/honeytokens', async (req, res) => {
    try {
        const tokens = await Honeytoken.find().sort({ createdAt: -1 });
        res.json(tokens);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tokens" });
    }
});

// 3. Fetch Alerts for Sidebar
app.get('/api/honeytokens/alerts', async (req, res) => {
    try {
        const alerts = await AlertLog.find().sort({ timestamp: -1 }).limit(10);
        const formattedAlerts = alerts.map(a => ({ _id: a._id, attackerIp: a.ipAddress, triggerTime: a.timestamp }));
        res.json(formattedAlerts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching alerts" });
    }
});

// 4. Fetch Full Alerts for Map Dashboard
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await AlertLog.find().sort({ timestamp: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching alerts" });
    }
});

// 5. Dynamic PDF Generator
app.get('/api/honeytokens/download/:id', async (req, res) => {
    try {
        const token = await Honeytoken.findOne({ tokenId: req.params.id });
        if (!token || token.tokenType !== 'PDF_PIXEL') return res.status(404).send("PDF not found.");

        const doc = new PDFDocument();
        let fileName = token.tokenData.FileName || 'Confidential_Document.pdf';
        
        res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);
        doc.fillColor('red').fontSize(20).text('STRICTLY CONFIDENTIAL: INTERNAL USE ONLY', { align: 'center' }).moveDown();
        doc.fillColor('black').fontSize(14).text('This document contains heavily encrypted Q3 Financial Data and Executive Salaries.').moveDown();
        doc.fillColor('blue').fontSize(12).text('>> CLICK HERE TO DECRYPT AND VIEW CONTENTS <<', { link: token.tokenData.TrackingUrl, underline: true, align: 'center' });
        doc.end();
    } catch (error) {
        res.status(500).send("Error generating PDF.");
    }
});

// 6. Handle Simulated Breach (AWS & DB Keys)
app.post('/api/honeytokens/breach', async (req, res) => {
    try {
        const { stolenData } = req.body;
        let trapIdToLog = "Simulated_Portal_Breach"; 
        // BRUTAL FIX: Strip invisible spaces and line breaks from the copied text
        const cleanStolenData = stolenData ? stolenData.trim() : "";

        // 🚨 ADD THESE 3 LINES RIGHT HERE 🚨
        console.log("=== INTRUSION DEBUG ===");
        console.log("1. Raw Data from React: >" + stolenData + "<");
        console.log("2. Cleaned Data for DB: >" + cleanStolenData + "<");

        // ✅ NEW CODE
const compromisedToken = await Honeytoken.findOneAndUpdate(
    { $or: [{ "tokenData.AccessKeyId": cleanStolenData }, { "tokenData.ConnectionString": cleanStolenData }] },
    { status: 'TRIGGERED' }, { new: true }
);

        console.log("3. Database Match: ", compromisedToken ? "✅ FOUND" : "❌ NOT FOUND");

        if (compromisedToken) trapIdToLog = compromisedToken.tokenId;

        let rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (rawIp === '::1' || rawIp === '127.0.0.1' || rawIp === '::ffff:127.0.0.1') rawIp = '122.166.14.23'; 

        let geoData = { city: "Unknown", country: "Unknown", isp: "Unknown" };
        try {
            const geoResponse = await axios.get(`http://ip-api.com/json/${rawIp}`);
            if (geoResponse.data.status === 'success') geoData = { city: geoResponse.data.city, country: geoResponse.data.country, isp: geoResponse.data.isp };
        } catch (e) {}

        const userAgentString = req.headers['user-agent'] || "Unknown Tool";
        const attackerClass = classifyAttacker(userAgentString);

        const newAlert = new AlertLog({ 
            trapId: trapIdToLog, 
            ipAddress: rawIp, 
            userAgent: userAgentString, 
            attackerType: attackerClass,
            location: geoData 
        });
        await newAlert.save();

        const discordWebhookUrl = 'https://discord.com/api/webhooks/1494516382979588218/DNSCiKAADwgs1FKxAxXhVnu1UDyR-Nl9vfRxP4man5JTIRnBM7MBY_0_64dllETJn-d6'; 
        if (discordWebhookUrl) {
            axios.post(discordWebhookUrl, {
                embeds: [{
                    title: "🚨 STOLEN CREDENTIAL USED 🚨", 
                    description: `Unauthorized login attempt using compromised key: **${stolenData || "Unknown"}**`,
                    color: 16711680, 
                    timestamp: new Date().toISOString(),
                    fields: [
                        { name: "Attacker IP", value: rawIp, inline: true },
                        { name: "Location", value: `${geoData.city}, ${geoData.country}`, inline: true },
                        { name: "ISP / Network", value: geoData.isp || "Unknown", inline: true },
                        { name: "Classification", value: attackerClass, inline: true },
                        { name: "Device / User-Agent", value: `\`\`\`text\n${userAgentString}\n\`\`\``, inline: false }
                    ]
                }]
            }).catch(e => console.log("Webhook failed"));
        }
        res.status(200).json({ message: "Simulation Complete: Intrusion caught and logged!" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error");
    }
});

// 7. The actual Trap endpoint (PDF Links)
app.get('/api/trap/:id', async (req, res) => {
    try {
        const trapId = req.params.id;
        await Honeytoken.findOneAndUpdate({ tokenId: trapId }, { status: 'TRIGGERED' });

        let rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (rawIp === '::1' || rawIp === '127.0.0.1' || rawIp === '::ffff:127.0.0.1') rawIp = '122.166.14.23'; 

        let geoData = { city: "Unknown", country: "Unknown", isp: "Unknown" };
        try {
            const geoResponse = await axios.get(`http://ip-api.com/json/${rawIp}`);
            if (geoResponse.data.status === 'success') geoData = { city: geoResponse.data.city, country: geoResponse.data.country, isp: geoResponse.data.isp };
        } catch (e) {}

        const userAgentString = req.headers['user-agent'] || "Unknown Tool";
        const attackerClass = classifyAttacker(userAgentString);

        const newAlert = new AlertLog({ 
            trapId: trapId, 
            ipAddress: rawIp, 
            userAgent: userAgentString, 
            attackerType: attackerClass,
            location: geoData 
        });
        await newAlert.save();

        const discordWebhookUrl = 'https://discord.com/api/webhooks/1494516382979588218/DNSCiKAADwgs1FKxAxXhVnu1UDyR-Nl9vfRxP4man5JTIRnBM7MBY_0_64dllETJn-d6'; 
        if (discordWebhookUrl) {
            axios.post(discordWebhookUrl, {
                embeds: [{
                    title: "🚨 INTRUSION DETECTED 🚨", 
                    description: `Unauthorized access attempt on Honeytoken: **${trapId}**`,
                    color: 16711680, 
                    timestamp: new Date().toISOString(),
                    fields: [
                        { name: "Attacker IP", value: rawIp, inline: true },
                        { name: "Location", value: `${geoData.city}, ${geoData.country}`, inline: true },
                        { name: "ISP / Network", value: geoData.isp || "Unknown", inline: true },
                        { name: "Classification", value: attackerClass, inline: true },
                        { name: "Device / User-Agent", value: `\`\`\`text\n${userAgentString}\n\`\`\``, inline: false }
                    ]
                }]
            }).catch(e => console.log("Webhook failed"));
        }
        res.status(200).send("Document corrupted or unavailable.");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// 🧠 Heuristic Engine to classify Bot vs Human
function classifyAttacker(userAgent) {
    if (!userAgent) return "🤖 AUTOMATED BOT"; 
    
    const botSignatures = ['curl', 'python', 'wget', 'nmap', 'postman', 'masscan', 'go-http-client', 'java', 'libwww'];
    const uaLower = userAgent.toLowerCase();
    
    // If it matches a known bot tool, flag it
    for (let sig of botSignatures) {
        if (uaLower.includes(sig)) return "🤖 AUTOMATED BOT";
    }
    
    // If it's a standard web browser, assume human
    if (uaLower.includes('mozilla') || uaLower.includes('chrome') || uaLower.includes('safari')) {
        return "👤 HUMAN ATTACKER";
    }

    return "🤖 AUTOMATED BOT"; // Default to bot if unknown
}

// ==========================================
// AI THREAT INTELLIGENCE ROUTES
// ==========================================

// A. Trigger AI to analyze logs
app.post('/api/analytics/generate', async (req, res) => {
    try {
        const alerts = await AlertLog.find().sort({ timestamp: -1 });
        if (alerts.length === 0) return res.status(400).json({ message: "No logs available to analyze." });

        const logSummary = alerts.map(a => ({
            trap: a.trapId || "Unknown",
            ip: a.ipAddress || "Unknown",
            location: a.location ? `${a.location.city || 'Unknown'}, ${a.location.country || 'Unknown'}` : "Location not logged",
            device: a.userAgent || "Unknown Device"
        }));

        const prompt = `
        You are an expert Chief Information Security Officer (CISO). 
        Analyze the following JSON log of recent honeypot intrusions. 
        Provide a concise, professional Threat Intelligence Report formatted in clean Markdown.
        Include these three sections:
        1. **Executive Summary:** A 2-sentence overview of the attack volume.
        2. **Threat Patterns:** What locations or devices are targeting us most?
        3. **Actionable Recommendations:** 2 short bullet points on what defensive actions the network team should take next.
        
        Here is the JSON data to analyze:
        ${JSON.stringify(logSummary)}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();

        const newReport = new ThreatReport({ reportText: aiResponseText, analyzedLogCount: alerts.length });
        await newReport.save();

        res.status(200).json({ message: "Report Generated", report: newReport });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: "Failed to generate AI report" });
    }
});
// B. Fetch past reports
app.get('/api/analytics/reports', async (req, res) => {
    try {
        const reports = await ThreatReport.find().sort({ generatedAt: -1 }).limit(5);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// C. Download AI Report as PDF (PASTE IT RIGHT HERE!)
app.get('/api/analytics/download/:id', async (req, res) => {
    try {
        const report = await ThreatReport.findById(req.params.id);
        if (!report) return res.status(404).send("Report not found");

        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Threat_Intelligence_Report_${new Date(report.generatedAt).getTime()}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // --- DRAW THE CISO REPORT HEADER ---
        doc.fillColor('#a855f7')
           .fontSize(22)
           .text('Guardian-X: AI Threat Intelligence', { align: 'center' });
        doc.moveDown();
        
        doc.fillColor('gray')
           .fontSize(10)
           .text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, { align: 'center' });
        doc.text(`Total Intrusion Logs Analyzed: ${report.analyzedLogCount}`, { align: 'center' });
        doc.moveDown(2);

        // --- CLEAN UP MARKDOWN & PRINT ---
        const cleanText = report.reportText
            .replace(/\*\*/g, '') 
            .replace(/## /g, '')
            .replace(/# /g, '');

        doc.fillColor('black')
           .fontSize(12)
           .text(cleanText, { align: 'left', lineGap: 4 });

        doc.end();
    } catch (error) {
        console.error("PDF Download Error:", error);
        res.status(500).send("Failed to generate PDF");
    }
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = 5000;

mongoose.connect('mongodb://127.0.0.1:27017/honeytoken-db')
    .then(() => {
        console.log("✅ MongoDB Connected!");
        app.listen(PORT, () => console.log(`✅ AI-ENABLED SERVER RUNNING ON PORT ${PORT}`));
    })
    .catch((error) => console.error("❌ MongoDB Error:", error));