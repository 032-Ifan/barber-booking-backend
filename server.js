
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Halaman utama API
app.get('/', (req, res) => {
  res.json({
    message: 'BARBERBOOK API berhasil dijalankan!',
    status: 'success'
  })
})

// Tes koneksi API
app.get('/api/status', (req, res) => {
  res.json({
    aplikasi: 'BARBERBOOK',
    status: 'Aktif',
    teknologi: 'Express.js'
  })
})

const db = require('./config/database')

// Tes koneksi MySQL
app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DATABASE() AS database_name')

    res.json({
      status: 'success',
      message: 'Database berhasil terhubung!',
      database: rows[0].database_name
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

const barbershopRoutes = require('./routes/barbershop')

app.use('/api/barbershop', barbershopRoutes)

const barberRoutes = require('./routes/barber')

app.use('/api/barber', barberRoutes)

const layananRoutes = require('./routes/layanan')

app.use('/api/layanan', layananRoutes)

const bookingRoutes = require('./routes/booking')

app.use('/api/booking', bookingRoutes)

// Route autentikasi (Register dan Login)
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

app.listen(PORT, () => {
  console.log(`Server BARBERBOOK berjalan di http://localhost:${PORT}`)
})


