'use strict'

var core = require('../core')
var { router } = core
var main_ctrl = require('./controllers/main_ctrl.js')

router.get('/mini-browser/', main_ctrl.get)
// router.get('/mini-browser', main_ctrl.browse)

module.exports = router
