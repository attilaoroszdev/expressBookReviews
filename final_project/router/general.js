const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

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

// fetchBooks will wrap the `books` object into a promise
function fetchBooks() {
    return new Promise((resolve, reject) => {
        if (books) {
            resolve(books);
        } else {
            reject(new Error('Books not found'));
        }
    });
}

// Here we try to coerce a Promise out of fetchBooks()
public_users.get('/', async (req, res) => {
    fetchBooks()
        .then(books => {
            res.send(books); // Send the books if found
        })
        .catch(error => {
            res.status(404).json({message: error.message}); //Otherwise 404 error
        });
});


// Get the book list available in the shop, original implementation without Promises
/*
    public_users.get('/', function (req, res) {
        // return res.status(200).send(JSON.stringify(books, null, 2));
        // Since we are not using curl, and this is the standard way (plus it looks better in postman)
        return res.status(200).json(books);
    });
*/

//Wrap the response in an anonymous Promise and return it
function findBookByISBN(isbn) {
    return new Promise((resolve, reject) => {
        if (books[isbn]) {
            resolve(books[isbn]); // If the book exists, we resolve with the book object
        } else {
            reject(new Error('Book with ' + isbn + ' not found')); // Otherwise reject with error msg
        }
    });
}

// Coerce a promise out of books with the right ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    findBookByISBN(isbn)
        .then(book => {
            book["isbn"] = isbn; // Including the isbn in the response
            res.send(book); // Send the book if found
        })
        .catch(error => {
            res.status(404).json({message: error.message}); //Otherwise 404 error
        });
});

// Get book details based on ISBN, original implementation without Promises
/*
    public_users.get('/isbn/:isbn', function (req, res) {
        //Write your code here
        const isbn = req.params.isbn;
        const book = books[isbn];
        if (book) {
            book["isbn"] = isbn; // Including the isbn in the response
            return res.status(200).json(book);
        } else {
            return res.status(404).json({message: "ISBN " + isbn + " not found"});
        }
    });
*/

// Wrap the whole thing into one big promise
function findBooksByAuthor(author) {
    return new Promise((resolve, reject) => {
        const booksByAuthor = Object.entries(books)
            // Case-insensitive, includes the ISBN so we can map that to the response
            .filter(([isbn, book]) => book.author.toLowerCase() === author.toLowerCase())
            // We might have multiple books by the same author
            .map(([isbn, book]) => ({...book, isbn}));
        if (booksByAuthor.length > 0) {
            resolve(booksByAuthor); // If the book exists, we resolve with the book object
        } else {
            reject(new Error("No boobs by '" + author + "'")); // Otherwise reject with error msg
        }
    });
}

// Runs findBooksByAuthor() to get a Promise with the data
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
    findBooksByAuthor(author)
        .then(booksByAuthor => {
            res.send(booksByAuthor); // Send the books if found
        })
        .catch(error => {
            res.status(404).json({message: error.message}); //Otherwise 404 error
        });
});


// Get book details based on author, original implementation without Promises
/*
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
*/

// Promises we cannot keep, as usual...
function findBooksByTitle(title) {
    return new Promise((resolve, reject) => {
        const booksByTitle = Object.entries(books)
            // Since we don't have duplicate titles, find will return the first object, as is.
            .find(([isbn, book]) => book.title.toLowerCase() === title.toLowerCase())
        if (booksByTitle && booksByTitle.length > 0) {
            //Include the ISBN in the response
            booksByTitle[1]["isbn"] = booksByTitle[0];
            // Return the book in the same format as in the search by author, for consistency
            resolve(booksByTitle[1]);
        } else {
            reject(new Error("Title '" + title + "' not found"));
        }
    });
}

// Same thing all over again, we try to get that Promised book
public_users.get('/title/:title', function (req, res) {
    const bookTitle = req.params.title;
    findBooksByTitle(bookTitle).then(book => {
        res.send(book); // Send the book if found
    }).catch(error => {
        res.status(404).json({message: error.message}); //Otherwise 404 error
    });

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
