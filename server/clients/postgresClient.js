const pool = require('../modules/pool.js');

const getPostgresConnection = async () => {
    return new Promise((resolve, reject) => {
        pool.connect((err, pgClient, done) => {
            if (err) {
                console.error('error connecting to db', err)
                reject(err)
            }
            resolve({ pgClient, done })
        })
    })
}

const queryClient = async (pgClient, queryText, queryParams) => {
    return new Promise((resolve, reject) => {
        pgClient.query(queryText, queryParams, (err, data) => {
            if (err) {
                console.error('error querying db', err)
                reject(err)
            }
            resolve(data)
        })
    })
}

module.exports = {
    getPostgresConnection,
    queryClient
}