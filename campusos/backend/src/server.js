import { createServer } from 'node:http'
import { config } from './config.js'
import { openDb } from './db.js'
import { createApp } from './app.js'

const db = openDb(config.dbPath)
const { handler } = createApp({ db, config })
const server = createServer(handler)
server.listen(config.port, () => console.log(`CampusOS API berjalan di http://localhost:${config.port}`))

const shutdown = () => server.close(() => { db.close(); process.exit(0) })
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
