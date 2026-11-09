
const jwt = require('jsonwebtoken')

// Memeriksa token login pengguna
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Akses ditolak. Silakan login terlebih dahulu.'
            })
        }

        const token = authHeader.split(' ')[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token tidak valid atau sudah kedaluwarsa.'
        })
    }
}

// Memeriksa role pengguna
const verifyRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Anda tidak memiliki izin untuk mengakses halaman ini.'
            })
        }

        next()
    }
}

module.exports = {
    verifyToken,
    verifyRole
}
