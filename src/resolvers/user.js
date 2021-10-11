module.exports = {
    // resolve list of notes for a user when requested
    notes: async (user, args, { models }) => await models.Note.find({ author: user._id }).sort({ _id: -1 }),
    // resolve list of favorites for a user when requested
    favorites: async (user, args, { models }) => await models.Note.find({ favoritedBy: user._id}).sort({ _id: -1})
}