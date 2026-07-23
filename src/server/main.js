import http from 'node:http';
import { URL } from 'node:url';
import { URLSearchParams } from 'node:url';
import crypto from 'node:crypto';
import { udb } from '../helpers/data.js';
import { fetchJSON } from "../helpers/req.js";
import { fetchGH } from "../helpers/gh.js";

let CLIENT_ID = process.env.GH_CLIENT_ID;
let CLIENT_SECRET = process.env.GH_CLIENT_SECRET;
const CALLBACK_URL = 'https://tmp.shorty.systems/callback';
const PORT = 3000;

const stateStore = new Map(); 

function generateState() {
    return crypto.randomBytes(16).toString('hex');
}

function getLogin(id, name) {
    const state = generateState();

    stateStore.set(state, { id, name, timestamp: Date.now() });

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        state: state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/callback') {
        const code = parsedUrl.searchParams.get('code');
        const state = parsedUrl.searchParams.get('state');

        const storedData = stateStore.get(state);
        if (!storedData || !code || !storedData.id || !storedData.name || !storedData.timestamp) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid or missing state parameter / code');
            return;
        }

        if (Date.now() - storedData.timestamp > 10 * 60 * 60 * 1000) { // Expires after 10 minutes
            stateStore.delete(state);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Session Expired. Please run /link again via the bot.');
            return;
        }

        if (udb.has(storedData.id)) {
            stateStore.delete(state);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Your account has already been linked!');
            return;
        }

        try {
            const query =  new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                redirect_uri: CALLBACK_URL
            }).toString();
            const tokenData = await fetchJSON("https://github.com/login/oauth/access_token?" + query, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });

            const accessToken = tokenData.access_token;

            const userData = await fetchGH("/user", {
                headers: {
                    'Authorization': `token ${accessToken}`,
                }
            });

            udb.set(storedData.id, {
                lastUsername: userData.login,
                ghID: userData.id,
                accessToken: accessToken,
            });
            stateStore.delete(state);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <h1>Authentication Successful</h1>
                <p>Thank you ${storedData.name}. You may now close this tab.</p>
                `);

        } catch (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Authentication failed: ' + error.message);
        }
        return;
    }

    // Default Route
    res.writeHead(302, { 'Location': "https://shorty.systems" });
    res.end();
});

function listen() {
    // These are now guranteed to be loaded
    CLIENT_ID = process.env.GH_CLIENT_ID;
    CLIENT_SECRET = process.env.GH_CLIENT_SECRET;
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
    });
}

export { 
    getLogin,
    listen,
}
