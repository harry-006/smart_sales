const { Client } = require('pg');

async function testDirectIPv6() {
  console.log('Testing separate host/port IPv6 connection...');
  const client = new Client({
    host: '2406:da14:1d62:b401:8d63:2b03:dab7:7bef',
    port: 5432,
    user: 'postgres',
    password: 'Pratham@123#',
    database: 'postgres',
    connectionTimeoutMillis: 5000
  });
  try {
    await client.connect();
    console.log('SUCCESS: connected directly to raw IPv6!');
    await client.end();
  } catch (err) {
    console.log('Raw IPv6 connection failed:', err.message);
  }
}

testDirectIPv6();
