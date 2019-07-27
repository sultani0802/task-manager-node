const mongoose = require('mongoose')

// This is the same URL we used for the mongodb connection URL
//'task-manager-api' endpoint is the name of the database in the mongodb database
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser : true,
    useCreateIndex : true,
    useFindAndModify : false        // Removes deprecation warning for Model.findByIdAndUpdate()
})      