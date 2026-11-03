
const express = require('express')
const router = express.Router()
const db = require('../config/database')

// Menampilkan semua data barbershop
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM barbershop ORDER BY id DESC'
    )

    res.json({
      status: 'success',
      data: rows
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// Menambahkan barbershop
router.post('/', async (req, res) => {
  try {
    const {
      nama,
      alamat,
      telepon,
      latitude,
      longitude
    } = req.body

    if (!nama || !alamat) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama dan alamat wajib diisi'
      })
    }

    const [result] = await db.query(
      `INSERT INTO barbershop
       (nama, alamat, telepon, latitude, longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nama,
        alamat,
        telepon || null,
        latitude || null,
        longitude || null
      ]
    )

    res.status(201).json({
      status: 'success',
      message: 'Barbershop berhasil ditambahkan',
      id: result.insertId
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

module.exports = router
