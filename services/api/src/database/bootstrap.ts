import { initializePersistence, pool } from './persistence';
void initializePersistence().then(() => pool?.end()).catch(error => { console.error(error.message); process.exit(1); });
