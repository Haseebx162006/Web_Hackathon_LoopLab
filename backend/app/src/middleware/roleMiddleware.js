const isSeller = (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Seller resources only.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Admin resources only.' });
    }
};

const isBuyer = (req, res, next) => {
    if (req.user && req.user.role === 'buyer') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Buyer resources only.' });
    }
};

module.exports = {
    isSeller,
    isAdmin,
    isBuyer,
};
