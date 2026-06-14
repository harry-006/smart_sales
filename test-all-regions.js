const { Client } = require('pg');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-central-2', 'eu-north-1', 'eu-south-1', 'eu-south-2',
  'ap-east-1', 'ap-south-1', 'ap-south-2', 'ap-southeast-1', 'ap-southeast-2',
  'ap-southeast-3', 'ap-southeast-4', 'ap-northeast-1', 'ap-northeast-2',
  'ap-northeast-3', 'me-south-1', 'me-central-1', 'sa-east-1', 'af-south-1'
];

async function testAll() {
  const promises = regions.map(async (region) => {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.usgflvsmupoowwonnhxo:Pratham%40123%23@${host}:6543/postgres?pgbouncer=true`;
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`SUCCESS connected to ${region}!`);
      await client.end();
      return region;
    } catch (err) {
      if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND')) {
        console.log(`Region ${region} responded with different error:`, err.message);
      }
    }
  });

  await Promise.all(promises);
  console.log('Finished testing all regions.');
}

testAll();
