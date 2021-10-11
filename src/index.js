// index.js
// This is the main entry point of our application

// Env
require('dotenv').config();
const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

// Mongoose
const db = require('./db');
const models = require('./models');

// Express
const express = require('express');
const app = express();


// Apollo & GraphQL
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers')
const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({req}) =>  { 
        // get token from the headers
        const token = req.headers.authorization;
        // retrieve a user with the token
        const user = getUser(token);
        // for now, let's log the user to the console
        console.log(user);
        // add the db models and the user to the context
        return { models, user };
    }
});

// JWT
const jwt = require('jsonwebtoken');

const getUser = token => {
    if (token) {
        try {
            // return user info from token
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            throw new Error('Session invalid');
        }
    }
}

// DB connection
db.connect(DB_HOST);

// Apply the Apollo GraphQL middleware and set the path to /api
server.applyMiddleware({ 
    app, 
    path: '/api' 
});

app.listen({ port }, () => {
    console.log(`GraphQL Server running at http://localhost:${port}${server.graphqlPath}`)
});

// const resolvers = {
//     Query: {
//         hello: () => 'Hello World!',
//         notes: () => notes,
//         note: (parent, args) => notes.find(note => note.id == args.id)
//     },
//     Mutation: {
//         newNote: (parent, args) => {
//             let noteValue = {
//                 id: String(notes.length + 1),
//                 content: args.content,
//                 author: 'Adam Scott'
//             };
//             notes.push(noteValue);
//             return noteValue;
//         }
//     }
// };

// Apollo Server setup

// array of data for Apollo
// let notes = [
//     {
//         id: '1',
//         content: 'This is a note',
//         author: 'Adam Scott'
//     },
//     {
//         id: '2',
//         content: 'This is another note',
//         author: 'Frank Ellis'
//     },
//     {
//         id: '3',
//         content: 'This is a third note',
//         author: 'Martin Malhouser'
//     }
// ];

// Schemas
// const typeDefs = gql`
//     type Query {
//         hello: String!
//         notes: [Note!]!
//         note(id: ID!): Note!
//     }
//     type Mutation {
//         newNote(content: String!): Note!
//     }
//     type Note {
//         id: ID!
//         content: String!
//         author: String!
//     }
// `;

// Resolvers
// const resolvers = {
//     Query: {
//         hello: () => 'Hello World!',
//         notes: async () => await models.Note.find(),
//         note: async (parent, args) => await models.Note.findById(args.id)
//     },
//     Mutation: {
//         newNote: async (parent, args) => {
//             return await models.Note.create({
//                 content: args.content,
//                 author: 'Adam Scott'
//             })
//         }
//     }
// };