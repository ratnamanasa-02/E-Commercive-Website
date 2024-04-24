module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    if (req.session.tempCart) {
        res.locals.tempCart = req.session.tempCart;
    }
    next();
}