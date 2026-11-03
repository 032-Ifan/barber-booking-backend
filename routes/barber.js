
const express = require('express')
const router = express.Router()
const db = require('../config/database')

// Menampilkan semua barber
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT barber.*, barbershop.nama AS nama_barbershop
      FROM barber
      JOIN barbershop ON barber.barbershop_id = barbershop.id
      ORDER BY barber.id DESC
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

// Menambahkan barber
router.post('/', async (req, res) => {
  try {
    const { barbershop_id, nama, foto } = req.body

    if (!barbershop_id || !nama) {
      return res.status(400).json({
        status: 'error',
        message: 'Barbershop dan nama barber wajib diisi'
      })
    }

    const [result] = await db.query(
      `INSERT INTO barber (barbershop_id, nama, foto)
       VALUES (?, ?, ?)`,
      [barbershop_id, nama, foto || null]
    )

    res.status(201).json({
      status: 'success',
      message: 'Barber berhasil ditambahkan',
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
