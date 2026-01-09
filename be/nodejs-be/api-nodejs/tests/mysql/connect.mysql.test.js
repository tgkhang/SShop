/*
docker exec -it mysql-master mysql -uroot -p123 -e "CREATE DATABASE IF NOT EXISTS test; USE test; CREATE TABLE IF NOT EXISTS test_table (id INT PRIMARY KEY, name VARCHAR(50), age INT, address VARCHAR(100));"
*/


import mysql from 'mysql2'
const pool = mysql.createPool({
  host: 'localhost',
  port: 8811, // mysql-master port
  user: 'root',
  password: '123',
  database: 'test',
})

const batchSize = 100000 // can adjusted
const totalSize = 1000000

let currentId = 1

console.time('Batch Insertion Time')
const insertBatch = async () => {
  const values = []
  for (let i = 0; i < batchSize && currentId <= totalSize; ++i) {
    const name = `Name_${currentId}`
    const age = currentId
    const address = `Address_${currentId}`
    values.push([currentId, name, age, address])
    currentId++
  }

  if (values.length === 0) {
    console.timeEnd('Batch Insertion Time')
    pool.end((err) => {
      if (err) {
        console.error('error while running batch')
      } else {
        console.log('Database connection pool closed.')
      }
    })
    return
  }

  const sql = 'INSERT INTO test_table (id, name, age, address) VALUES ?'

  pool.query(sql, [values], async (err, results) => {
    if (err) throw err
    console.log(`Inserted batch results: ${results.affectedRows} rows`)
    await insertBatch() // insert next batch
  })
}

insertBatch().catch((err) => {
  console.error('Error during batch insertion:', err)
})
