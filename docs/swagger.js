const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Batik E-Commerce API",
    version: "1.0.0",
    description:
      "API documentation untuk Batik E-Commerce Backend - Auto Generated",
  },
  host: "localhost:3000",
  basePath: "",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "Masukkan JWT token dengan format: Bearer {token}",
    },
  },
  definitions: {
    Product: {
      id: 1,
      name: "Batik Tulis Jogja",
      description: "Batik tulis premium dari Jogja",
      category: "Batik Tulis",
      price: 350000,
      stock: 10,
      discount: 10,
      image_url: "/api/media/batik1.jpg",
      is_active: true,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
    Order: {
      id: 1,
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "081234567890",
      shipping_address: "Jl. Malioboro No. 123",
      shipping_city: "Yogyakarta",
      shipping_postal: "55511",
      subtotal: 350000,
      shipping_cost: 25000,
      total: 375000,
      status: "pending",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
    Category: {
      id: 1,
      name: "Batik Tulis",
      slug: "batik-tulis",
      description: "Batik tulis tradisional",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    },
    LoginRequest: {
      username: "admin",
      password: "admin123",
    },
    LoginResponse: {
      message: "Login berhasil",
      user: {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        name: "Administrator",
      },
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 900,
    },
    CreateProductRequest: {
      name: "Batik Tulis Jogja",
      description: "Batik tulis premium dari Jogja",
      category: "Batik Tulis",
      price: 350000,
      stock: 10,
      discount: 10,
      image_url: "/api/media/batik1.jpg",
      is_active: true,
    },
    CreateOrderRequest: {
      order_data: {
        customer_name: "John Doe",
        customer_email: "john@example.com",
        customer_phone: "081234567890",
        shipping_address: "Jl. Malioboro No. 123",
        shipping_city: "Yogyakarta",
        shipping_postal: "55511",
        subtotal: 350000,
        shipping_cost: 25000,
        total: 375000,
      },
      items: [
        {
          product_id: 1,
          price: 350000,
          quantity: 1,
        },
      ],
    },
    UpdateOrderStatusRequest: {
      status: "processing",
    },
    Error: {
      error: "Pesan error",
    },
  },
};

const outputFile = "./docs/swagger-output.json";
const endpointsFiles = ["./server.js"];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("✅ Swagger documentation generated successfully!");
  console.log("📚 File: docs/swagger-output.json");
  console.log("🚀 Run your server and visit: http://localhost:3000/api-docs");
});
