const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://gzgspzujrmbspadnvzpr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z3NwenVqcm1ic3BhZG52enByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDgxMTksImV4cCI6MjA4NjQ4NDExOX0.pB6I0F4GTKHaRBH-1CBg93nSLxf8v_iq7oJMEdV4jpc'
);

async function test() {
  console.log('Testing database connection after reset...\n');
  
  const tables = ['user_roles', 'properties', 'units', 'tenants', 'payments', 'messages', 'leases'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: OK (${data?.length || 0} rows)`);
    }
  }
}

test().then(() => process.exit(0));
