const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 4000;
require("dotenv").config();
let corsOptions = {
  origin: "https://sfcrod.org",
};
app.use(cors(corsOptions));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hi, From Server!" });
});
app.get("/products", async (req, res) => {
  try {
    const response = await fetchProductsAdmin();
    console.log("Response", response);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});
let server = app.listen(PORT, (req, res) => {
  console.log(`Server is running ${PORT}`);
});
// server.setTimeout(50000000);

function fetchProductsGraphql() {
  const url2 = `https://test9112323.myshopify.com/api/2024-04/graphql.json`;
  fetch(url2, {
    method: "POST",
    headers: {
      "X-Shopify-Storefront-Access-Token": shopifyAccessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(graphQLQuery),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((response) => {
      // displayProducts(response.products);
      console.log(response.data.products.edges);
    })
    .catch((error) => {
      console.error("There was a problem with your fetch operation:", error);
    });
}

function fetchProductsAdmin() {
  const adminApiToken = process.env.adminApiToken;
  console.log(adminApiToken);
  const url = `https://test9112323.myshopify.com/admin/api/2024-04/products.json`;
  return fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": adminApiToken,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((response) => {
      return response.products;
    })
    .catch((error) => {
      console.error("There was a problem with your fetch operation:", error);
      return error;
    });
}

app.post("/addToCart", async (req, res) => {
  try {
    const data = req.body.data;
    console.log("Data", data);
    const response = await addToCart(data.productId, data.quantity);

    res.status(200).send(response);
  } catch (error) {
    console.error("Error Adding products to cart:", error);
    res.status(500).send("Internal Server Error");
  }
});

function addToCart(productId, quantity) {
  console.log("productId", productId);

  const data = {
    items: [
      {
        id: productId,
        quantity: quantity,
      },
    ],
  };

  return fetch("https://test9112323.myshopify.com/cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      //'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })

    .catch((error) => {
      console.error("Error adding product to cart:", error);
      return error;
      // Handle errors here, like showing an error message to the user
    });
}
