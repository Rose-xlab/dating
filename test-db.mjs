import postgres from 'postgres';

// The connection string with the NEW simple password and Port 6543
const connectionString = "postgres://postgres.hqwbtsevwmbsmrrthbkl:SecurePass20252025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";
const sql = postgres(connectionString, {
    ssl: 'require',
    prepare: false, // <--- The most critical setting for Supabase Transaction Pooler
});

async function testConnection() {
    console.log("Testing connection to Supabase...");
    console.log("User: postgres.hqwbtsevwmbsmrrthbkl");
    console.log("Port: 6543 (Transaction Pooler)");
    
    try {
        // Simple query to get the Postgres version
        const result = await sql`SELECT version()`;
        
        console.log("\n---------------------------------------------------");
        console.log("✅ SUCCESS! The password and connection are correct.");
        console.log("---------------------------------------------------");
        console.log("Database Version: " + result[0].version);
        console.log("\nYou can now restart 'npm run dev' and it will work.");
    } catch (error) {
        console.log("\n---------------------------------------------------");
        console.log("❌ FAILURE: Could not connect.");
        console.log("---------------------------------------------------");
        console.log("Error details:");
        console.log(error.message);
        
        if (error.code === '28P01' || error.message.includes('password')) {
            console.log("\n⚠️  DIAGNOSIS: PASSWORD MISMATCH");
            console.log("The code is sending 'SecurePass20252025', but the database expects the old password.");
            console.log("👉 GO TO SUPABASE DASHBOARD -> SETTINGS -> DATABASE -> RESET PASSWORD");
        }
    } finally {
        await sql.end();
    }
}

testConnection();