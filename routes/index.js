var express = require("express");
const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../models");

//imports model and db
const book = require("../models/book")(sequelize, DataTypes);
var router = express.Router();
const app = express();

// Redirects home route to /books
router.get("/", (req, res, next) => {
  res.redirect("/books");
});

//search button route
router.post("/search", async (req, res, next) => {
  const searchString = req.body.search;
  // redirects to home page in case of empty search
  if (searchString === "") {
    res.redirect("/books");
  }
  // searches the book db for any partial match accross all columns
  const query = {
    [Op.or]: {
      title: {
        [Op.like]: `%${searchString}%`,
      },
      author: {
        [Op.like]: `%${searchString}%`,
      },
      genre: {
        [Op.like]: `%${searchString}%`,
      },
      year: {
        [Op.like]: `%${searchString}%`,
      },
    },
  };
  const books = await book.findAll({ where: query, limit: 10 });
  // provides the pagination links for the search results
  let pagElements = await paginationArray({ where: query });
  res.render("search-results", {
    books,
    title: "Books",
    pagElements,
    searchString,
  });
});

// pagination links route for search results
router.get("/search/books/page/:page/:searchString", async (req, res, next) => {
  const searchString = req.params.searchString;
  const query = {
    [Op.or]: {
      title: {
        [Op.like]: `%${searchString}%`,
      },
      author: {
        [Op.like]: `%${searchString}%`,
      },
      genre: {
        [Op.like]: `%${searchString}%`,
      },
      year: {
        [Op.like]: `%${searchString}%`,
      },
    },
  };
  let pagElements = await paginationArray({ where: query });
  // gymnastics to set offset based on link clicked
  let startAt = (req.params.page - 1) * 10;
  // finds the books starting at the offset, limited to 10 results
  const books = await book.findAll({
    where: query,
    offset: startAt,
    limit: 10,
  });
  // retrieves the amount of pagination links to be displayed on page
  res.render("search-results", {
    books,
    title: "Books",
    pagElements,
    searchString,
  });
});

// function that returns the pagination element attributes
const paginationArray = async (query) => {
  // finds all rows
  const { count, rows } = await book.findAndCountAll(query);
  //preforms gymnastics to get correct amount of pagination links
  let pagination = Math.ceil(count / 10);
  // creates an array of attributes to give to pug template
  let array = [];
  for (var i = 1; i <= pagination; i++) {
    array.push({
      href: `/books/page/${i}`,
      label: i,
    });
  }
  return array;
};

// pagination links route
router.get("/books/page/:page", async (req, res, next) => {
  // gymnastics to set offset based on link clicked
  let startAt = (req.params.page - 1) * 10;
  // finds the books starting at the offset, limited to 10 results
  const books = await book.findAll({
    offset: startAt,
    limit: 10,
  });
  // retrieves the amount of pagination links to be displayed on page
  let pagElements = await paginationArray();
  res.render("index", { books, title: "Books", pagElements });
});

// get all books route
router.get("/books", async (req, res, next) => {
  let pagElements = await paginationArray();
  const books = await book.findAll({ limit: 10 });
  res.render("index", { books, title: "Books", pagElements });
});

// create new book route
router.get("/books/new", (req, res, next) => {
  res.render("new-book", { title: "New Book" });
});

// post new book route
router.post("/books/new", async (req, res, next) => {
  try {
    const newBook = await book.create({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      year: parseInt(req.body.year),
    });
    res.redirect("/books");
  } catch (err) {
    // collects validation errors and redirects the user back to the form along with errors.
    const messagesArray = err.errors;
    res.render("form-error", { validationErrors: messagesArray });
  }
});

// show books detail form
router.get("/books/:id", async (req, res, next) => {
  const bookDetails = await book.findByPk(req.params.id);
  res.render("update-book", { bookDetails, title: bookDetails.title });
});

// updates book details and returns user to index
router.post("/books/:id", async (req, res, next) => {
  const updatedBook = await book.findByPk(req.params.id);
  await updatedBook.update({
    title: req.body.title,
    author: req.body.author,
    genre: req.body.genre,
    year: parseInt(req.body.year),
  });
  res.redirect("/books");
});

// deletes a book and returns user to index
router.post("/books/:id/delete", async (req, res, next) => {
  deleteBook = await book.findByPk(req.params.id);
  await deleteBook.destroy();
  console.log("book deleted...");

  res.redirect("/books");
});

module.exports = router;
