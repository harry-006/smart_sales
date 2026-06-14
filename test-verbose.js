const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-northeast-1', 'ap-southeast-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2'
];

async function testVerbose() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.usgflvsmupoowwonnhxo:Pratham%40123%23@${host}:6543/postgres?pgbouncer=true`;
    const client = new Client({ connectionString, connectionTimeoutMillis: 3000 });
    try {
      await client.connect();
      console.log(`Region ${region}: SUCCESS`);
      await client.end();
    } catch (err) {
      console.log(`Region ${region} failed with: [${err.code}] ${err.message}`);
    }
  }
}

testVerbose();
