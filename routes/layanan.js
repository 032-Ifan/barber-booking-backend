
const express = require('express')
const router = express.Router()
const db = require('../config/database')

// Menampilkan semua layanan
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT layanan.*, barbershop.nama AS nama_barbershop
      FROM layanan
      JOIN barbershop ON layanan.barbershop_id = barbershop.id
      ORDER BY layanan.id DESC
    `)

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

// Menambahkan layanan
router.post('/', async (req, res) => {
  try {
    const { barbershop_id, nama_layanan, harga, durasi } = req.body

    if (!barbershop_id || !nama_layanan || harga == null || durasi == null) {
      return res.status(400).json({
        status: 'error',
        message: 'Semua data layanan wajib diisi'
      })
    }

    if (Number(harga) < 0 || Number(durasi) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Harga tidak boleh negatif dan durasi harus lebih dari 0'
      })
    }

    const [result] = await db.query(
      `INSERT INTO layanan (barbershop_id, nama_layanan, harga, durasi)
       VALUES (?, ?, ?, ?)`,
      [barbershop_id, nama_layanan, harga, durasi]
    )

    res.status(201).json({
      status: 'success',
      message: 'Layanan berhasil ditambahkan',
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
