if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const Product = require("./models/products.js");
const Cart = require("./models/cart.js");
const User = require("./models/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { saveRedirectUrl, tempCart } = require("./middleware.js");
// const dbUrl = "mongodb://127.0.0.1:27017/swiftcart";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
      secret: "mysupersecret",
      touchAfter: 24 * 3600,
  }
})

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
})

const sessionOptions = {
  store:store,
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


async function transferTempCartToUser(user, tempCart) {
  for (item of tempCart) {
      let addedProduct = new Cart({
          user: user._id,
          product: item.product,
      });
      await addedProduct.save();
  }
}


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
    if (req.isAuthenticated()) {
        let addedProduct = Cart({
            user: req.user._id,
            product: product._id,
        });
        let newAddedCart = await addedProduct.save();
        req.flash("success", "Succesfully Added to Cart !");
        res.redirect(`/products/${id}`);
    }
    else {
        let tempCart = req.session.tempCart || [];
        tempCart.push({
            product:product._id,
        })
      req.session.tempCart = tempCart;
        req.flash("success", "Successfully Added to Temporary Cart!");
        res.redirect(`/products/${id}`);
    }
});

app.get("/cart", async (req, res) => {
  if (req.user) {
    let cartItems = await Cart.find({user:req.user._id}).populate("product");
    res.render("products/cart.ejs", { cartItems });
  }
  else {
    let tempCart = req.session.tempCart || [];
    let productIds = tempCart.map(item => item.product);
    let cartItems = await Product.find({ _id: { $in: productIds } });
    res.render("products/tempCart.ejs", { cartItems });
  }
});

app.delete('/cart/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Cart.findByIdAndDelete(id);
    req.flash("success", "Item removed from cart.");
    res.redirect('/cart');
} catch (err) {
    console.error("Error deleting item from cart:", err);
    req.flash("error", "Error removing item from cart.");
    res.redirect('/cart');
}
});










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

const handleTempCartBeforeLogin = (req, res, next) => {
  console.log(tempCart);
  if (tempCart) {
    res.locals.tempCart = req.session.tempCart;
  }
  next();
};

app.post(
  "/login",
  handleTempCartBeforeLogin,
  saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
  (req, res) => {
    if (req.session.tempCart && req.session.tempCart.length > 0 && req.user) {
      transferTempCartToUser(req.user, req.session.tempCart);
      req.session.tempCart = []; // Clear the tempCart in the session
    }

    req.flash("success", "Welcome to Wanderlust! You are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/products";
    res.redirect(redirectUrl);
  }
);

app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out!");
    res.redirect("/products");
  });
});

app.listen(8080, (req, res) => {
  console.log("server is listening to port 8080");
});
