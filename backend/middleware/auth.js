import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'a85a97af3d3ed4d5919992a12fc44c74', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    });
};

export const requireAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const requireCashier = (req, res, next) => {
    if (req.userRole !== 'cashier' && req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Cashier access required' });
    }
    next();
};