const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const Product = require("./models/products.js");
const Cart = require("./models/cart.js");
const User = require("./models/user.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { saveRedirectUrl } = require("./middleware.js");

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/swiftcart");
}

const sessionOptions = {
  secret: "mysupersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, //cross scripting attacks (saving from them)
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); //serialize users into the session
passport.deserializeUser(User.deserializeUser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.engine("ejs", ejsMate);

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/products", async (req, res) => {
  let products = await Product.find({});
  res.render("products/index.ejs", { products });
});

app.get("/products/:id", async (req, res) => {
  let { id } = req.params;
  let product = await Product.findById(id);
  res.render("products/show.ejs", { product });
});

app.get("/products/:id/cart", async (req, res) => {
  let { id } = req.params;
  let product = await Product.findById(id);
  let addedProduct = Cart({
    product: product._id,
  });
  let newAddedCart = await addedProduct.save();
  req.flash("success", "Succesfully Added to Cart !");
  res.redirect(`/products/${id}`);
});

app.get("/cart", async (req, res) => {
  let cartItems = await Cart.find({}).populate("product");
  console.log(cartItems);
  res.render("products/cart.ejs", { cartItems });
});

app.delete("/cart/:id", (req, res) => {});

app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

app.post("/signup", (req, res) => {
  let { username, password, mobile, email } = req.body;
  const newUser = User({ email, mobile, username });
  const registeredUser = User.register(newUser, password);
  req.login(registeredUser, (err) => {
    req.flash("success", "Welcome to Wanderlust!");
    res.redirect("/products");
  });
});

app.post(
    "/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
  (req, res) => {
    req.flash("success", "Welcome to Wanderlust! You are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/products";
    res.redirect(redirectUrl);
  }
);

app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.listen(8080, (req, res) => {
  console.log("server is listening to port 8080");
});
