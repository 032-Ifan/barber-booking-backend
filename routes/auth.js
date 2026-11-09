
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
    const { nama, username, email, password } = req.body

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
    const usernameBersih = (username || emailBersih.split('@')[0])
      .trim()
      .toLowerCase()

    if (!/^[a-zA-Z0-9_]{3,50}$/.test(usernameBersih)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username harus 3-50 karakter dan hanya boleh berisi huruf, angka, atau underscore'
      })
    }

    // Periksa email dan username
    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [emailBersih, usernameBersih]
    )

    if (users.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Email atau username sudah digunakan'
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Registrasi publik selalu menjadi pelanggan
    const [result] = await db.query(
      `INSERT INTO users (nama, username, email, password, role)
       VALUES (?, ?, ?, ?, 'pelanggan')`,
      [nama.trim(), usernameBersih, emailBersih, passwordHash]
    )

    return res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      data: {
        id: result.insertId,
        nama: nama.trim(),
        username: usernameBersih,
        email: emailBersih,
        role: 'pelanggan'
      }
    })

  } catch (error) {
    console.error('Register error:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    })
  }
})

// ===============================
// LOGIN USER (USERNAME)
// ===============================
router.post('/login', async (req, res) => {
  try {
    // identifier menerima username; email hanya untuk kompatibilitas frontend lama
    const identifier = req.body.username || req.body.identifier || req.body.email
    const { password } = req.body

    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username dan password wajib diisi'
      })
    }

    const usernameBersih = identifier.trim().toLowerCase()

    const [users] = await db.query(
      'SELECT id, nama, username, email, password, role FROM users WHERE username = ? OR email = ?',
      [usernameBersih, usernameBersih]
    )

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Username atau password salah'
      })
    }

    const user = users[0]

    const passwordCocok = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordCocok) {
      return res.status(401).json({
        status: 'error',
        message: 'Username atau password salah'
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET belum dikonfigurasi')

      return res.status(500).json({
        status: 'error',
        message: 'Konfigurasi keamanan server belum tersedia'
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    return res.json({
      status: 'success',
      message: 'Login berhasil',
      token,
      data: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    })
  }
})

module.exports = router
