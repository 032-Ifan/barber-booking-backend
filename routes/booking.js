
const express = require('express')
const router = express.Router()
const db = require('../config/database')
const { verifyToken, verifyRole } = require('../middleware/auth')

// ==========================================
// GET: Menampilkan semua booking
// ==========================================

// GET: Menampilkan semua booking khusus admin
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        booking.*,
        barber.nama AS nama_barber,
        layanan.nama_layanan,
        layanan.harga,
        layanan.durasi
      FROM booking
      JOIN barber ON booking.barber_id = barber.id
      JOIN layanan ON booking.layanan_id = layanan.id
      ORDER BY booking.tanggal DESC, booking.jam DESC
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


// ==========================================
// GET: Riwayat booking pelanggan
// ==========================================
router.get('/saya', verifyToken, verifyRole('pelanggan'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        booking.*,
        barber.nama AS nama_barber,
        layanan.nama_layanan,
        layanan.harga,
        layanan.durasi
      FROM booking
      JOIN barber ON booking.barber_id = barber.id
      JOIN layanan ON booking.layanan_id = layanan.id
      WHERE booking.user_id = ?
      ORDER BY booking.created_at DESC
    `, [req.user.id])

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

// ==========================================
// POST: Membuat booking baru
// ==========================================
router.post('/', verifyToken, async (req, res) => {
  const {
    barber_id,
    layanan_id,
    nama_pelanggan,
    tanggal,
    jam
  } = req.body

  if (!barber_id || !layanan_id || !nama_pelanggan || !tanggal || !jam) {
    return res.status(400).json({
      status: 'error',
      message: 'Semua data booking wajib diisi'
    })
  }

  let connection

  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    // Pastikan barber dan layanan berasal dari barbershop yang sama
    const [pilihan] = await connection.query(`
      SELECT
        barber.id,
        layanan.durasi
      FROM barber
      JOIN layanan
        ON barber.barbershop_id = layanan.barbershop_id
      WHERE barber.id = ?
        AND layanan.id = ?
        AND barber.status = 'aktif'
    `, [barber_id, layanan_id])

    if (pilihan.length === 0) {
      await connection.rollback()

      return res.status(400).json({
        status: 'error',
        message: 'Barber atau layanan tidak valid'
      })
    }

    // Cek jadwal yang bertabrakan
    const [bentrok] = await connection.query(`
      SELECT booking.id
      FROM booking
      JOIN layanan ON booking.layanan_id = layanan.id
      WHERE booking.barber_id = ?
        AND booking.tanggal = ?
        AND booking.status IN ('menunggu', 'dikonfirmasi')
        AND booking.jam < ADDTIME(?, SEC_TO_TIME(? * 60))
        AND ADDTIME(booking.jam, SEC_TO_TIME(layanan.durasi * 60)) > ?
      FOR UPDATE
    `, [
      barber_id,
      tanggal,
      jam,
      pilihan[0].durasi,
      jam
    ])

    if (bentrok.length > 0) {
      await connection.rollback()

      return res.status(409).json({
        status: 'error',
        message: 'Jadwal barber sudah terisi pada waktu tersebut'
      })
    }

    // Simpan booking beserta ID akun pelanggan
    const [result] = await connection.query(`
      INSERT INTO booking
        (user_id, barber_id, layanan_id, nama_pelanggan, tanggal, jam)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      barber_id,
      layanan_id,
      nama_pelanggan,
      tanggal,
      jam
    ])

    await connection.commit()

    res.status(201).json({
      status: 'success',
      message: 'Booking berhasil dibuat',
      id: result.insertId
    })

  } catch (error) {
    if (connection) await connection.rollback()

    res.status(500).json({
      status: 'error',
      message: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})


// ==========================================
// PUT: Admin menerima atau menolak booking
// ==========================================
router.put('/:id/status', verifyToken, verifyRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'ID booking tidak valid'
      })
    }

    if (!['dikonfirmasi', 'dibatalkan'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status hanya boleh dikonfirmasi atau dibatalkan'
      })
    }

    const [booking] = await db.query(
      'SELECT id FROM booking WHERE id = ?',
      [id]
    )

    if (booking.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking tidak ditemukan'
      })
    }

    await db.query(
      'UPDATE booking SET status = ? WHERE id = ?',
      [status, id]
    )

    return res.json({
      status: 'success',
      message: status === 'dikonfirmasi'
        ? 'Booking berhasil diterima'
        : 'Booking berhasil ditolak',
      data: {
        id,
        status
      }
    })
  } catch (error) {
    console.error('Update booking error:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status booking'
    })
  }
})

module.exports = router
