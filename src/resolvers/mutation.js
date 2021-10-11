const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const {
    AuthenticationError,
    ForbiddenError
} = require('apollo-server-express');

require('dotenv').config;

const gravatar = require('../util/gravatar');
const models = require('../models');
module.exports = {
    newNote: async (parent, { content }, { models, user }) => {
        // if there's no user in the context, throw an authentication error
        if (!user) {
            throw new AuthenticationError('You must be signed in to create a note');
        }
        return await models.Note.create({
            content: content,
            author: mongoose.Types.ObjectId(user.id)
        })
    },
    updateNote: async (parent, { id, content }, { models, user }) => {
        if (!user) {
            throw new AuthenticationError('You must be signed in to update a note');
        }
        // find the note
        const note = await models.Note.findById(id);
        // if the note owner and current user don't match, throw forbidden error
        // (convert ObjectID to string)
        if (note && String(note.author) !== user.id) {
            throw new ForbiddenError('You don\'t have permission to update the note');
        }
        return await models.Note.findOneAndUpdate(
            { 
                _id: id 
            }, 
            { 
                $set: {
                    content
                }
            },
            {
                new: true
            }
        );
    },
    deleteNote: async (parent, { id }, { model, user }) => {
        if (!user) {
            throw new AuthenticationError('You must be signed in to delete a note')
        }
        const note = await models.Note.findById(id);
        if (note && String(note.author) !== user.id) {
            throw new ForbiddenError('You don\'t have permission to delete the note');
        }
        try{
            // if all checks out, remove the note
            await note.remove();
            return true;
        } catch (err) {
            return false;
        }
    },
    toggleFavorite: async (parent, { id }, { models, user}) => {
        // if no user context is passed, throw auth error
        if (!user) {
            throw new AuthenticationError();
        }
        // check if user already favorited the note
        let noteCheck = await models.Note.findById(id);
        const hasUser = noteCheck.favoritedBy.indexOf(user.id);
        // if user exists in the list, pull them from the list, reduce favorite count by 1
        if (hasUser >= 0) {
            return await models.Note.findByIdAndUpdate(
                id, 
                {
                    $pull: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: -1
                    }
                },
                {
                    // set new to true to return the updated doc
                    new: true
                }
            )
        } else {
            // if user is not in the list, add them and increment favoriteCount by 1
            return await models.Note.findByIdAndUpdate(
                id,
                {
                    $push: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    $inc: {
                        favoriteCount: 1
                    }
                }, 
                {
                    new: true
                }
            );
        }
    },
    signUp: async (parent, { username, email, password }, { models }) => {
        // normalize the email address
        email = email.trim().toLowerCase();
        // hash the pw
        const hashed = await bcrypt.hash(password, 10);
        // create the gravatar url
        const avatar = gravatar(email);
        try {
            const user = await models.User.create({
                username,
                email, 
                avatar, 
                password: hashed
            });
            return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        } catch (err) {
            console.log(err);
            // if there's a prob creating an account, throw an error
            throw new Error('Error creating account');
        }
    },
    signIn: async (parent, { username, email, password }, { models }) => {     
        email = email || typeof email == undefined ? email.trim().toLowerCase() : '';
        username = username || typeof username == undefined ? username.trim() : '';
        console.log(email)
        console.log(username)
        try {
            const user = await models.User.findOne({
                $or: [{ username }, { email }]
            }); 
            if (!user) {
                throw new AuthenticationError('Error signing in');
            }
            const validPW = await bcrypt.compare(password, user.password);
            if (!validPW) {
                throw new AuthenticationError('Error signing in');
            } 
            return jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        } catch (err) {
            console.log(err);
            throw new Error('Error signing in');
        }
    }
}