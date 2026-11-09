
const express = require('express')
const router = express.Router()
const db = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ===============================
// REGISTRASI PELANGGAN
// ===============================
router.post('/register', async (req, res) => {
  try {
    const { nama, email, password } = req.body

    if (!nama || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama, email, dan password wajib diisi'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password minimal 6 karakter'
      })
    }

    const emailBersih = email.trim().toLowerCase()

    // Periksa apakah email sudah digunakan
    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [emailBersih]
    )

    if (users.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Email sudah terdaftar'
      })
    }

    // Enkripsi password
    const passwordHash = await bcrypt.hash(password, 10)

    // Registrasi selalu menjadi pelanggan
    const [result] = await db.query(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, 'pelanggan')`,
      [nama.trim(), emailBersih, passwordHash]
    )

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      data: {
        id: result.insertId,
        nama: nama.trim(),
        email: emailBersih,
        role: 'pelanggan'
      }
    })

  } catch (error) {
    console.error('Register error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    })
  }
})

// ===============================
// LOGIN
// ===============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi'
      })
    }

    const emailBersih = email.trim().toLowerCase()

    // Cari akun berdasarkan email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [emailBersih]
    )

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      })
    }

    const user = users[0]

    // Periksa password
    const passwordCocok = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordCocok) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      })
    }

    // Pastikan JWT_SECRET sudah tersedia
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET belum dikonfigurasi')

      return res.status(500).json({
        status: 'error',
        message: 'Konfigurasi keamanan server belum tersedia'
      })
    }

    // Buat token login
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({
      status: 'success',
      message: 'Login berhasil',
      token,
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    })
  }
})

module.exports = router
