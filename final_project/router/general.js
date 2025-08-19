const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        if (isValid(username)) {
            users.push({username: username, password: password});
            return res.status(201).json({message: "User '" + username + "' registered successfully"});
        } else {
            return res.status(409).json({message: "User '" + username + "' already registered"});
        }
    } else {
        return res.status(400).json({message: "Invalid username or password"});
    }
});


// Get the book list available in the shop
public_users.get('/', function (req, res) {
    // return res.status(200).send(JSON.stringify(books, null, 2));
    // Since we are not using curl, and this is the standard way (plus it looks better in postman
    return res.status(200).json(books);
});


// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    //Write your code here
    const isbn = req.params.isbn;
    const book = books[isbn];
    if (book) {
        book["isbn"] = isbn; //Including the isbn in the response
        return res.status(200).json(book);
    } else {
        return res.status(404).json({message: "ISBN " + isbn + " not found"});
    }
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
    // There might be more than one book by the same author, this seemed the most direct approach
    const booksByAuthor = Object.entries(books)
        .filter(([isbn, book]) => book.author.toLowerCase() === author.toLowerCase())  //Case insensiteive, including the isbn so we can map that to the response
        .map(([isbn, book]) => ({...book, isbn}));
    if (booksByAuthor.length > 0) {
        return res.status(200).json(booksByAuthor);
    } else {
        return res.status(404).json({message: "Author " + author + " not found"});
    }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    const booksByTitle = Object.entries(books)
        // Since we don't have duplicate titles, find will return the object. As the object contains the ISBN,
        .find(([isbn, book]) => book.title.toLowerCase() === title.toLowerCase())

    if (booksByTitle.length > 0) {
        //Include the ISBN in the response
        booksByTitle[1]["isbn"] = booksByTitle[0];
        // Return the book in the same format as in the search by author
        return res.status(200).json(booksByTitle[1]);
    } else {
        return res.status(404).json({message: "Title " + title + " not found"});
    }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const reviews = books[isbn]["reviews"];
    if (reviews) {
        if (Object.keys(reviews).length === 0) {
            return res.status(200).json({message: "No reviews yet for ISBN " + isbn + " (" + books[isbn].title + " by " + books[isbn].author + ")"});
        } else {
            return res.status(200).json(reviews);
        }
    } else {
        return res.status(404).json({message: "ISBN " + isbn + " not found"});
    }
});

module.exports.general = public_users;
