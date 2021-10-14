module.exports = {
    hello: () => 'Hello World!',
    notes: async (parent, args, { models }) => await models.Note.find().limit(100),
    note: async (parent, { id }, { models }) => await models.Note.findById(id),
    user: async (parent, { username }, { models }) => await models.User.findOne({ username }),
    users: async (parent, args, { models, user }) => await models.User.find({}).limit(100),
    me: async (parent, args, { models, user }) => await models.User.findById(user.id),
    noteFeed: async (parent, { cursor }, { models }) => {
        // hardcode the 10 item limit
        const limit = 10;
        // set the default hasNextPage value to false
        let hasNextPage = false;
        // if no cursor is passed, the default query will be empty. 
        // This will pull the newest notes from the db
        let cursorQuery = {};
        // if there is a cursor, our query will look for notes with an ObjectId less than that of the cursor
        if ( cursor ) {
            cursorQuery = { _id: { $lt: cursor }};
        }

        // find the limit, plus 1, of notes in our db, sorted newest to oldest
        let notes = await models.Note.find(cursorQuery)
            .sort({ _id: -1 })
            .limit(limit + 1);

        // if the number of notes we find exceeds our limit, set hasNextPage to true, and trim notes to the limit
        if (notes.length > limit) {
            hasNextPage = true;
            notes = notes.slice(0, -1);
        }

        // the new cursor will be the Mongo object ID of the last item in the feed array
        const newCursor = notes[notes.length - 1]._id;
        
        return {
            notes,
            cursor: newCursor,
            hasNextPage
        }
    }
};