const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 4000;
require("dotenv").config();
let corsOptions = {
  origin: "https://sfcrod.org",
};
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hi, From Server!" });
});
app.get("/products", async (req, res) => {
  try {
    // const response = await fetchProductsAdmin();
    const response = await fetchProductsGraphql();
    console.log("Response", response);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/filterproduct", async (req, res) => {
  try {
    const name = req?.query?.name;
    if (!name) {
      res.status(400).send({ error: "A word from title is required." });
      return;
    }

    const response = await fetchProductsGraphql();
    const filterData = filterArrayBasedOnSubString(response.products, name);
    // console.log("Response", response);
    res.status(200).send(filterData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});
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
let server = app.listen(PORT, (req, res) => {
  console.log(`Server is running ${PORT}`);
});
const filterArrayBasedOnSubString = (products, input) => {
  const subString = input.toLowerCase();
  const newArray = products.filter((item) => {
    if (item.title.toLowerCase().includes(subString)) {
      return item;
    }
  });
  return newArray;
};
// server.setTimeout(50000000);

// function fetchProductsGraphql() {
//   const shopifyAccessToken = process.env.shopifyAccessToken;
//   const graphQLQuery = {
//     query: `
//       query {
//         products(first: 10) {
//           edges {
//             node {
//               id
//               title
//               description
//               images(first: 1) {
//                 edges {
//                   node {
//                     src
//                     altText
//                   }
//                 }
//               }
//             }
//           }
//           pageInfo {
//             hasNextPage
//             endCursor
//           }
//         }
//       }
//     `,
//   };
//   const url2 = `${process.env.storeName}/api/2024-04/graphql.json`;
//   return fetch(url2, {
//     method: "POST",
//     headers: {
//       "X-Shopify-Storefront-Access-Token": shopifyAccessToken,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(graphQLQuery),
//   })
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error("Network response was not ok");
//       }
//       return response.json();
//     })
//     .then((response) => {
//       // console.log(response.data.products.edges);
//       const products = response.data.products.edges.map((edge) => ({
//         id: edge.node.id,
//         title: edge.node.title,
//         description: edge.node.description,
//         image:
//           edge.node.images.edges.length > 0
//             ? edge.node.images.edges[0].node.src
//             : null,
//         altText:
//           edge.node.images.edges.length > 0
//             ? edge.node.images.edges[0].node.altText
//             : null,
//       }));
//       return products;
//     })
//     .catch((error) => {
//       console.error("There was a problem with your fetch operation:", error);
//     });
// }
async function fetchProductsGraphql() {
  const shopifyAccessToken = process.env.shopifyAccessToken;
  const graphQLQuery = {
    query: `
      query {
        products(first: 200) {
          edges {
            node {
              id
              title
              description
              images(first: 1) {
                edges {
                  node {
                    src
                    altText
                  }
                }
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
                      amount
                      currencyCode
                    }
                    image {
                      src
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  };

  const url2 = `${process.env.storeName}/api/2024-04/graphql.json`;
  try {
    const response = await fetch(url2, {
      method: "POST",
      headers: {
        "X-Shopify-Storefront-Access-Token": shopifyAccessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphQLQuery),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const jsonResponse = await response.json();

    const products = jsonResponse.data.products.edges.map((edge) => {
      const productNode = edge.node;
      const product = {
        id: productNode.id,
        title: productNode.title,
        description: productNode.description,
        image:
          productNode.images.edges.length > 0
            ? productNode.images.edges[0].node.src
            : null,
        altText:
          productNode.images.edges.length > 0
            ? productNode.images.edges[0].node.altText
            : null,
        variants: productNode.variants.edges.map((variantEdge) => ({
          id: variantEdge.node.id,
          title: variantEdge.node.title,
          price: variantEdge.node.priceV2
            ? `${variantEdge.node.priceV2.amount} ${variantEdge.node.priceV2.currencyCode}`
            : null,
          image: variantEdge.node.image ? variantEdge.node.image.src : null,
          altText: variantEdge.node.image
            ? variantEdge.node.image.altText
            : null,
        })),
      };
      return product;
    });

    return { products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { error: error.message };
  }
}

function fetchProductsAdmin() {
  const adminApiToken = process.env.adminApiToken;
  console.log(adminApiToken);
  const url = `${process.env.storeUrl}/products.json`;
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

async function addToCart(productId, quantity) {
  console.log("productId", productId);

  const data = {
    items: [
      {
        id: productId,
        quantity: quantity,
      },
    ],
  };

  const adminApiToken = process.env.adminApiToken;
  const storePassword1 = "1234";
  const storePassword2 = "sowbro";
  try {
    const response = await fetch(`${process.env.storeName}/cart/add.js`, {
      method: "POST",
      headers: {
        // Authorization: "Basic " + btoa(`${adminApiToken}:${storePassword2}`),
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log("response", response);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else if (contentType && contentType.includes("text/html")) {
      return await response.text();
    } else {
      throw response;
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);

    return error;
    // Handle errors here, like showing an error message to the user
  }
}

app.post("/add-to-cart", async (req, res) => {
  const { items } = req.body; // Assuming items is an array of { id, quantity } objects

  const shopifyAccessToken = process.env.shopifyAccessToken;
  const shopifyStoreName = process.env.storeName;

  const lineItems = items.map((item) => ({
    merchandiseId: item.id, // Ensure item.id is the correct Variant ID
    quantity: item.quantity,
  }));

  const graphqlQuery = {
    query: `
      mutation addToCart($lineItems: [CartLineInput!]!) {
        cartCreate(input: {
          lines: $lineItems
        }) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      lineItems,
    },
  };

  try {
    const response = await fetch(
      `${shopifyStoreName}/api/2024-04/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": shopifyAccessToken,
        },
        body: JSON.stringify(graphqlQuery),
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Network response was not ok: ${response.statusText}` });
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      return res.status(400).json({ errors: jsonResponse.errors });
    }

    const cartUrl = jsonResponse.data.cartCreate.cart.checkoutUrl;
    res.json({ cartUrl });
  } catch (error) {
    console.error("Error adding products to cart:", error);
    res.status(500).json({ error: error.message });
  }
});
