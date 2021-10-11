// Require the mongoose library
const mongoose = require('mongoose');

module.exports = {
    connect: DB_HOST => {
        // use the Mongo driver's updated URL string parser
        mongoose.set('useNewUrlParser', true);
        // use findOneAndUpdate() in place of findAndModify()
        mongoose.set('useFindAndModify', false);
        // use createIndex() in place of ensureIndex()
        mongoose.set('useCreateIndex', true);
        // use the new server discovery and monitoring engine
        mongoose.set('useUnifiedTopology', true);
        // connect to the DB
        mongoose.connect(DB_HOST);
        // log an error if we fail to connect
        mongoose.connection.on('error', err => {
            console.error(err);
            console.log('MongoDB connection error. Please make sure MongoDB is running');
            process.exit();
        });
    },
    close: () => mongoose.connection.close()
};