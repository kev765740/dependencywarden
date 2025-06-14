import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';

neonConfig.webSocketConstructor = ws;

async function exportSignups() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        email,
        github_username,
        created_at,
        source
      FROM signups 
      ORDER BY created_at DESC
    `);
    
    // Export as CSV
    const csvHeader = 'ID,Email,GitHub Username,Created At,Source\n';
    const csvRows = result.rows.map(row => 
      `${row.id},"${row.email}","${row.github_username || ''}","${row.created_at}","${row.source}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    fs.writeFileSync('signups-export.csv', csvContent);
    
    // Export as JSON
    const jsonContent = JSON.stringify(result.rows, null, 2);
    fs.writeFileSync('signups-export.json', jsonContent);
    
    console.log(`Exported ${result.rows.length} signups to signups-export.csv and signups-export.json`);
    console.log('\nSignup Summary:');
    result.rows.forEach(row => {
      console.log(`- ${row.email} (${row.created_at.toLocaleDateString()})`);
    });
    
  } catch (error) {
    console.error('Error exporting signups:', error);
  } finally {
    await pool.end();
  }
}

exportSignups();