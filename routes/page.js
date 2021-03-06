const createError = require('http-errors');
const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
 
const router = express.Router();
 
// router.get('/profile', isLoggedIn, (req, res) => {
//     res.render('profile', { title: '내 정보 - NodeBird', user: req.user });
// });
 
// router.get('/join', isNotLoggedIn, (req, res) => {
//     res.render('join', {
//         title: '회원가입 - NodeBird',
//         user: req.user,
//         joinError: req.flash('joinError'),
//     });
// });
 
// router.get('/', (req, res, next) => {
//     console.log('session:',req.session.sUser);
//     res.render('main', {
//         title: 'NodeBird',
//         twits: [],
//         user: req.user,
//         loginError: req.flash('loginError'),
//     });
// });

router.get('/Forbidden', (req, res, next) => {
    // return res.status(404).send('Forbidden');
    next(createError(404));
});

router.get('/', (req, res, next) => {
    // return res.status(404).send('Not Found');
    next(createError(404));
});

module.exports = router;
