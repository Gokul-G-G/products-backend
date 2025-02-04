const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors= require('cors')
const secretKey = process.env.SECRET_KEY;

require('dotenv').config()
const app = express();
const port = process.env.PORT
app.use(express.json());
app.use(cors(
  {
    origin:'https://products-frontend-7a10.onrender.com'
}
))
app.get("/", (req, res) => {
  res.send("from the server");
});

const url=process.env.MONGODB_URL
async function main() {
  console.log(url)
  await mongoose.connect(url);
}

main()
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

//Token Authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token not provided" });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(40).json({ error: "Token Invalid", err: err });

    req.user = user;
    next();
  });
};

const Product = require("./model/product");

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json(error);
  }
});

//Create a product

app.post("/products", async (req, res) => {
  try {
    const { name, price, description, url ,rating } = req.body;

    console.log("Received data:", req.body); // Log received request body for debugging

    const newProduct = new Product({
      name,
      price,
      description,
      url,
      rating
    });

    await newProduct.save();
    res.status(201).json({message:"Product created successfully",Product:newProduct});
  } catch (error) {
    res.status(400).json({
      message: "Error while creating the product",
      error: error.message || error,
    });
  }
});

//Update a Product

app.patch("/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(productId, req.body, {
      new: true,
    });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json(error);
  }
});

//Delete Product

//Get product count for price greater than input price
app.get("/products/count/:price", async (req, res) => {
  try {
    const price = Number(req.params.price);
    console.log(price);
    const productCount = await Product.aggregate([
      {
        $match: { price: { $gt: price } },
      },
      {
        $count: "productCount",
      },
    ]);
    res.status(200).send(productCount);
  } catch (error) {
    res.status(400).json(error);
  }
});

//Require User

const User = require("./model/user");

//Registration or SignUp
app.post("/user", async (req, res) => {
  try {
    const saltRounds = 10;
    bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
      if (err) {
        console.error("Error while Hashing", err);
        res.status(500).json({ error: "Internal server error" });
      }
      var userItem = {
        name: req.body.name,
        email: req.body.email,
        password: hash,
        createdAt: new Date(),
      };
      var user = new User(userItem);
      await user.save();
      res.status(201).json({message:"Signup Successfull",user:user});
    });
   
  } catch (error) {
    res.status(400).json(error);
  }
});

//Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(500).json({ error: "User not Found" });
    }
    console.log(password)
    console.log(user.password)
    const isValid =await bcrypt.compare(password,user.password);
    if (!isValid) {
      return res.status(500).json({ error: "Invalid Credentials" });
    }
    //Token
    let payload = { user: email };
    let token = jwt.sign(payload, secretKey);
    res.status(200).json({ message: "Login Successfully", token: token });
  } catch (error) {
    res.status(400).json(error);
  }
});

app.listen(port, () => {
  console.log("Server Started");
});
