const mongoose = require('mongoose')


const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {                                    // RELATIONSHIP TO USER
        type: mongoose.Schema.Types.ObjectId,       // ObjectId of the User
        required: true,
        ref: 'User'                                 // Setting up reference to User model
                                                        // This creates a relationship between the two models
    }
}, {
    timestamps: true                            // Enable timestamps on Task objects
})


// the model is still 'Task' but mongoose converts it into lowercase and pluralizes it
const Task = mongoose.model('Task', taskSchema)


module.exports = Task