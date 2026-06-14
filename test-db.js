const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'ap-northeast-1',
  'ap-southeast-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'sa-east-1',
  'ap-southeast-2'
];

async function testConnection() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.usgflvsmupoowwonnhxo:Pratham%40123%23@${host}:5432/postgres`;
    console.log(`Testing region: ${region} (${host})...`);
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`SUCCESS connected to ${region}!`);
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed for ${region}:`, err.message);
    }
  }
}

testConnection();
