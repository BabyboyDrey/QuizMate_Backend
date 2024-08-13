const express = require('express')
const cors = require('cors')
const connectDb = require('./db/database')
const UserRoutes = require('./controllers/users')
const app = express()

if (process.env.NODE_ENV !== 'Production') {
  require('dotenv').config({
    path: '.env'
  })
}

app.use(
  cors({
    origin: ['http://localhost:3000', 'https://www.ideasmis.com'],
    credentials: true
  })
)
app.use(express.urlencoded({ extended: true }))

app.use(express.json())
app.use('/api/user', UserRoutes)

connectDb()

process.on('uncaughtException', err => {
  console.log(`Uncaught Exception Err: ${err}`)
  console.log('Shutting down server for uncaught exception')
})

process.on('unhandledRejection', err => {
  console.log(`Unhandled Rejection Err: ${err}`)
  console.log('Shutting down server for unhandled rejection')
  server.close(() => {
    process.exit(1)
  })
})

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'))
//  })

app.get('/dice', (req, res) => {
  res.send('Url of ngrok functional')
})

const PORT = process.env.SERVER_PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server listening on Port ${PORT}`)
  console.log(`worker pid: ${process.pid}`)
})
