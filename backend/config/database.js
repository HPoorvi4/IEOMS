const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'IEOMS',
    password: 'postgres',
    port: 5432,
});

module.exports = pool;
