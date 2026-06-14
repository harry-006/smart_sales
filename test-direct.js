const { Client } = require('pg');

async function testDirect() {
  const connectionString = 'postgresql://postgres:Pratham%40123%23@db.usgflvsmupoowwonnhxo.supabase.co:5432/postgres';
  console.log('Testing direct connection to IPv6 address...');
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log('SUCCESS: connected directly!');
    await client.end();
  } catch (err) {
    console.log('Direct connection failed:', err.message);
  }
}

testDirect();
