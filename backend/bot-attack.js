// bot-attack.js - Simulated Threat Actor Script
const axios = require('axios');

// 🚨 Paste the active AWS Key or DB Cred here before the demo
const STOLEN_CREDENTIAL = "AKIAVDW84BDKKS"; 

console.log("😈 INIT: Automated Credential Stuffing Bot Started...");
console.log(`🎯 TARGET: Guardian-X Portal`);
console.log(`🔑 PAYLOAD: ${STOLEN_CREDENTIAL}\n`);

axios.post('http://localhost:5000/api/honeytokens/breach', 
    { stolenData: STOLEN_CREDENTIAL },
    { 
        headers: { 
            // We intentionally spoof a Python automated tool here!
            'User-Agent': 'python-requests/2.28.1' 
        } 
    }
)
.then(response => console.log("❌ CRITICAL: Wait, the server let us in?!"))
.catch(error => {
    console.log("🛡️ BLOCKED: Connection severed by remote host.");
    console.log("🛑 STATUS: 403 Forbidden - Guardian-X active defense triggered!");
});