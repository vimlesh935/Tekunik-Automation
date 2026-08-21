const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:8787'; // Assuming this is the backend URL

async function runTests() {
  console.log("=== WISHLIST E2E TEST ===");
  try {
    // 1. Database Connection Check
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'Technique'
    });
    console.log("✅ Connected to MySQL Database");

    // 2. Login to get token
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com', // User must exist, or we register one
      password: 'password123'
    }).catch(async (e) => {
        if(e.response && e.response.status === 401) {
            // Need to register
            await axios.post(`${BASE_URL}/api/auth/register`, {
                first_name: 'Test',
                last_name: 'User',
                email: 'testwishlist@example.com',
                password: 'password123'
            });
            return axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'testwishlist@example.com',
                password: 'password123'
            });
        }
        throw e;
    });
    
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log(`✅ Logged in as User ID: ${userId}`);

    // Get a product
    const [products] = await db.query('SELECT id FROM products LIMIT 1');
    if(products.length === 0) {
        console.log("❌ No products in DB");
        process.exit(1);
    }
    const productId = products[0].id;
    console.log(`✅ Selected Product ID: ${productId} for testing`);

    // Clean up before test
    await db.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);

    // 3. Test POST wishlist
    console.log(`\n-> Testing POST /api/wishlist/${productId}`);
    await axios.post(`${BASE_URL}/api/wishlist/${productId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("✅ API: Added to wishlist successfully");

    // Verify DB
    const [rowsAfterAdd] = await db.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    if (rowsAfterAdd.length === 1) {
        console.log("✅ DB: Row correctly inserted into wishlist table");
    } else {
        console.log("❌ DB: Failed to insert row");
        process.exit(1);
    }

    // 4. Test GET wishlist
    console.log(`\n-> Testing GET /api/wishlist`);
    const getRes = await axios.get(`${BASE_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const items = getRes.data.wishlist;
    const found = items.find(i => i.product_id === productId);
    if (found) {
        console.log("✅ API: Wishlist item retrieved successfully");
    } else {
        console.log("❌ API: Item not found in GET response");
        process.exit(1);
    }

    // 5. Test DELETE wishlist
    console.log(`\n-> Testing DELETE /api/wishlist/${productId}`);
    await axios.delete(`${BASE_URL}/api/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("✅ API: Removed from wishlist successfully");

    // Verify DB
    const [rowsAfterDelete] = await db.query('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    if (rowsAfterDelete.length === 0) {
        console.log("✅ DB: Row correctly deleted from wishlist table");
    } else {
        console.log("❌ DB: Failed to delete row");
        process.exit(1);
    }
    
    console.log("\n🎉 ALL WISHLIST TESTS PASSED!");
    process.exit(0);
  } catch (error) {
    console.error("❌ TEST FAILED:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
