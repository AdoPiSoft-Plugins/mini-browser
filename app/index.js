const router = require('./router.js')
const {app} = require('@adopisoft/exports')

module.exports = {
	async ini(){
		app.use(router)
	}
}