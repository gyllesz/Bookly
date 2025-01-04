import pkg from 'pg';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { Pool } = pkg;

const itemsPool = new Pool({
    connectionString: process.env.DBConfigLink || process.env.DBConfigLink,
    ssl: {
        rejectUnauthorized: false,
    },
});

export default itemsPool;
