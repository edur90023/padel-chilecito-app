const jwt = require('jsonwebtoken');

// Este es un generador de middleware. Se usa así: auth(['admin']) o auth(['admin', 'operator'])
const auth = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).send({ error: 'Autenticación requerida.' });
            }

            const secret = process.env.JWT_SECRET || 'padel-chilecito-secret-key-2024';
            const decoded = jwt.verify(token, secret);

            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).send({ error: 'Permisos insuficientes para esta acción.' });
            }

            // Adjuntamos la información decodificada del token al request
            req.user = decoded;

            next();
        } catch (error) {
            res.status(401).send({ error: 'Token inválido o expirado.' });
        }
    };
};

module.exports = auth;