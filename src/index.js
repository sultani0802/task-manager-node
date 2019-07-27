const log = console.log

const app = require('./app')                    // Get our express server app

const PORT = process.env.PORT                   // Get the port

app.listen(PORT, () => {                        // Run the server
    log('Server is running on port ', PORT)
})