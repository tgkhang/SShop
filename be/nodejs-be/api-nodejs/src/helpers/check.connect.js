import mongoose from 'mongoose'
import os from 'os'

const _SECONDS = 300000

export const countConnection = () => {
  const num = mongoose.connections.length
  console.log(`Number of mongoose connections: ${num}`)
}

export const checkOverload = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length
    const numCores = os.cpus().length
    const memoryUsage = process.memoryUsage().rss / (1024 * 1024) // in MB

    // example 5 connections per core
    const maxConnections = numCores * 5

    console.log(
      `Mongoose Connections: ${numConnection}, CPU Cores: ${numCores}, Memory Usage: ${memoryUsage.toFixed(2)} MB`
    )
    if (numConnection > maxConnections) {
      console.warn(`Warning: High number of connections detected! (${numConnection} connections)`)
    }
  }, _SECONDS) //moniotor every _SECONDS milliseconds
}
