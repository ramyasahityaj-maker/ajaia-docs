import { initDatabase } from './src/lib/supabase-db';

// Initialize Supabase database tables
async function setupDatabase() {
  console.log('Setting up Supabase database...');
  try {
    await initDatabase();
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();