const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { //returns boolean
                                // Filter the users array for any user with the same username
    let usersWithSameName = users.filter((user) => {
        return user.username === username;
    });
    // Return true if any user with the same username is found, otherwise false
    return usersWithSameName.length === 0
}


const authenticatedUser = (username, password) => { //returns boolean
    const validUsers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    // Return true if any valid user is found, otherwise false
    return validUsers.length > 0;
}

//only registered users can log in
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({message: "Invalid username or password"});
    }


    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({username: username, password: password}, "access", {expiresIn: 60 * 60});
        req.session.authorization = {accessToken, username};


        return res.status(200).json({message: "Login successful"});
    } else {
        return res.status(401).json({message: "Invalid username or password"});
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {

    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.user.username;

    const book = books[isbn];
    if (review !== undefined && book) {
        let whatHappened = " added "
        if (book.reviews[username]) {
            whatHappened = " updated "
        }
        book.reviews[username] = review;
        const msg = username + "'s review for ISBN " + isbn + " ("+book.title+" by "+book.author+")" + whatHappened + "successfully";
        return res.status(200).json({message: msg, review_text: review});
    } else {
        if (!book) {
            return res.status(404).json({message: "ISBN " + isbn + " not found"});
        } else {
            return res.status(400).json({message: "Invalid review"});
        }

    }

});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.user.username;
    const book = books[isbn];
    if (book) {

        if (!book.reviews[username]) {
            return res.status(404).json({message: username + " has not yet posted a review for ISBN " + isbn + " (" + book.title + " by " + book.author + ")"});
        } else {
            delete book.reviews[username];
            return res.status(200).json({message: username + "'s review for ISBN " + isbn + " (" + book.title + " by " + book.author + ")" + " deleted successfully"});
        }
    } else {
        return res.status(404).json({message: "ISBN " + isbn + " not found"});
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
