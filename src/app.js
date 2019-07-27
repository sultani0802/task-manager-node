/**
 * 
 * This file sets up the express application
 * 
 */

// Shortcut for printing to console
const log = console.log   

const express = require('express')                  // Load express module
    
const userRouter = require('./routers/userRouter')  // Load user routers
const taskRouter = require('./routers/taskRouter')  // Load task routers

require('./db/mongoose')                            // Runs the file that connects to the mongoose database

 
/**
 * Express settings
 */
const app = express()                               // Initialize express app
app.use(express.json())                             // Automatically parse incoming JSON into javascript objects


/**
 * Endpoints from routers
 */
app.use(userRouter)                                 // User router
app.use(taskRouter)                                 // Task router


module.exports = app