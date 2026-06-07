const jwt = require('jsonwebtoken');

exports.handler = async (event) => {

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    };

    //  Handle preflight request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ""
        };
    }

    try {

        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

        const now = Math.floor(Date.now() / 1000);

        const payload = {
            iss: clientEmail,
            scope: 'https://www.googleapis.com/auth/drive',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        const assertion = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            header: {
                alg: 'RS256',
                typ: 'JWT'
            }
        });

        const response = await fetch(
            'https://oauth2.googleapis.com/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                access_token: data.access_token,
                expires_in: data.expires_in
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: err.message
            })
        };
    }
};
