const axios = require("axios");
const dotenv = require("dotenv");
const { getPool } = require('./pool');
dotenv.config();

let inMemoryToken = null;

function setAccessToken(token) {
    inMemoryToken = token;
}

function getInMemoryAccessToken() {
    return inMemoryToken;
}
// get access token from OneMap API
async function getAccessToken() {
    try {
        console.log("BASE_URL:", process.env.ONEMAP_BASE_URL);
        console.log("EMAIL:", process.env.ONEMAP_API_EMAIL);
        console.log("PASSWORD:", process.env.ONEMAP_API_PASSWORD);

        const response = await axios.post(
            `${process.env.ONEMAP_BASE_URL}/api/auth/post/getToken`,
            {
                email: process.env.ONEMAP_API_EMAIL,
                password: process.env.ONEMAP_API_PASSWORD,
            }
        );

        const accessToken = response.data.access_token;
        setAccessToken(accessToken);
        return accessToken;
    } catch (error) {
        console.error("Error refreshing token:", error);
        throw new Error("Unable to refresh token");
    }
}

async function geocode(address) {
    try {
        let accessToken = getInMemoryAccessToken();
        if (!accessToken) {
            accessToken = await getAccessToken();
        }

        const response = await axios.get(
            "https://www.onemap.gov.sg/api/common/elastic/search",
            {
                params: {
                    searchVal: address,
                    returnGeom: "Y",
                    getAddrDetails: "Y",
                    pageNum: 1,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = response.data;

        if (data.found > 0 && data.results && data.results.length > 0) {
            return {
                lat: data.results[0].LATITUDE,
                lng: data.results[0].LONGITUDE,
                address: data.results[0].ADDRESS,
                postalcode: data.results[0].POSTAL,
                data: data.results[0],
            };
        } else {
            throw new Error("Address not found");
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        throw new Error("Geocoding failed");
    }
}

//get user address
async function getUserAddress(accountId) {
    try {
        const pool = await getPool();
        const result = await pool.query(`
            SELECT address FROM AccountProfile
            WHERE id = $1
        `, [accountId]);

        if (result.rows.length > 0) {
            return result.rows[0].address;
        } else {
            throw new Error("Address not found for this account");
        }
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}
// Update user address
async function updateUserAddress(accountId, address) {
    try {
        const pool = await getPool();
        const result = await pool.query(`
            UPDATE AccountProfile
            SET address = $1
            WHERE id = $2
        `, [address, accountId]);

        if (result.rowCount > 0) {
            return address;
        };
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}
// Delete user address
async function deleteAddress(accountId) {
    try {
        const pool = await getPool();
        const result = await pool.query(`
            UPDATE AccountProfile
            SET address = NULL
            WHERE id = $1
        `, [accountId]);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getRoute(startLat, startLng, endLat, endLng, routeType) {
    let accessToken = getInMemoryAccessToken();
    if (!accessToken) {
        accessToken = await getAccessToken();
    }

    const res = await axios.get(`${process.env.ONE_MAP_BASE_URL}/api/routingsvc/route`, {
        params: {
            start: `${startLat},${startLng}`,
            end: `${endLat},${endLng}`,
            routeType,
        },
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return res.data;
}


module.exports = {
    geocode,
    getRoute,
    getAccessToken,
    setAccessToken,
    getUserAddress,
    deleteAddress,
    updateUserAddress,
    getInMemoryAccessToken,
};