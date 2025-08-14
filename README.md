# 🛍️ AURES E-Commerce Platform

A modern, full-stack e-commerce solution built with Next.js, Node.js, and PostgreSQL. Features multi-payment gateway integration, real-time tax calculations, and a responsive admin dashboard.

![E-Commerce Platform](https://img.shields.io/badge/Next.js-13-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-18-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

## ✨ Features

### 🎯 **Core E-Commerce**
- **Product Management**: CRUD operations with categories, images, and stock tracking
- **Shopping Cart**: Persistent cart with real-time tax calculations
- **User Authentication**: JWT-based auth with role-based access control
- **Order Management**: Complete order lifecycle from cart to delivery
- **Review System**: Product ratings and customer feedback

### 💳 **Payment Integration**
- **Adyen**: Enterprise-grade payment processing
- **Paymee**: Local payment gateway integration
- **Konnect**: Regional payment solution
- **Multi-Currency**: Support for EUR, TND, and more
- **Secure Checkout**: PCI-compliant payment flows

### 🏗️ **Technical Features**
- **Real-time Tax Calculation**: Database-driven tax rates per product
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Image Management**: Cloud-ready file upload system
- **API-First Architecture**: RESTful endpoints with TypeScript
- **Database Optimization**: Efficient queries with proper indexing

### 🔧 **Admin Dashboard**
- **Analytics**: Sales metrics and performance insights
- **Inventory Management**: Stock tracking and product updates
- **User Management**: Customer and admin account control
- **Payment Configuration**: Gateway setup and monitoring
- **Tax Management**: Dynamic tax rate configuration

## 🏗️ Architecture

```
├── frontend/                 # Next.js 13 Frontend
│   ├── app/                 # App Router (Next.js 13)
│   ├── components/          # Reusable UI Components
│   ├── lib/                 # Utilities & Contexts
│   └── public/              # Static Assets
├── backend/                 # Node.js Backend
│   ├── src/                 # Source Code
│   │   ├── controllers/     # API Controllers
│   │   ├── models/          # Data Models
│   │   ├── routes/          # API Routes
│   │   ├── services/        # Business Logic
│   │   └── middleware/      # Custom Middleware
│   ├── config/              # Configuration Files
│   └── uploads/             # File Storage
└── docs/                    # Documentation
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 15+
- Redis (optional, for caching)
- Git

### **1. Clone Repository**
```bash
git clone https://github.com/fekher12wx/aures-ecommerce.git
cd aures-ecommerce
```

### **2. Backend Setup**
```bash
cd backend/e-commerce-backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your database credentials

# Database setup
npm run setup:db
npm run setup:taxes
npm run setup:payment-methods

# Start development server
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your API endpoints

# Start development server
npm run dev
```

### **4. Database Setup**
```sql
-- Create database
CREATE DATABASE aures_ecommerce;

-- Run migrations
\i setup-payment-methods.sql
\i setup-taxes.sql
```

## ⚙️ Configuration

### **Environment Variables**

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=aures_ecommerce
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Payment Gateways
ADYEN_API_KEY=your_adyen_key
ADYEN_MERCHANT_ID=your_merchant_id
PAYMEE_API_KEY=your_paymee_key
KONNECT_API_KEY=your_konnect_key

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=AURES E-Commerce
```

## 🗄️ Database Schema

### **Core Tables**
- `users` - User accounts and authentication
- `products` - Product catalog with tax relationships
- `orders` - Order management and tracking
- `taxes` - Tax rate configuration
- `payment_methods` - Gateway configuration
- `reviews` - Product ratings and feedback

### **Key Relationships**
```sql
-- Products with tax rates
products.tax_id → taxes.id

-- Orders with users
orders.user_id → users.id

-- Order items with products
order_items.product_id → products.id
```

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### **Products**
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)

### **Orders**
- `POST /api/orders` - Create order
- `GET /api/orders/user/:id` - User orders
- `PUT /api/orders/:id/status` - Update order status

### **Payments**
- `POST /api/payments/session` - Create payment session
- `GET /api/payments/status/:id` - Check payment status

## 🧪 Testing

### **Backend Tests**
```bash
cd backend/e-commerce-backend
npm test
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

### **API Testing**
```bash
# Test payment methods
curl http://localhost:3001/api/payment-methods/test

# Test tax calculation
curl http://localhost:3001/api/settings/taxes/active
```

## 📦 Deployment

### **Docker Deployment**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

### **Manual Deployment**
```bash
# Backend
cd backend/e-commerce-backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (User/Admin)
- **Input Validation** and sanitization
- **SQL Injection Protection** with parameterized queries
- **CORS Configuration** for cross-origin requests
- **Rate Limiting** on API endpoints

## 📊 Performance

- **Database Indexing** for optimal query performance
- **Image Optimization** with Next.js Image component
- **Lazy Loading** for components and routes
- **Caching Strategy** with Redis (optional)
- **CDN Ready** for static assets

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

### **Issues**
- [GitHub Issues](https://github.com/fekher12wx/aures-ecommerce/issues)
- [Feature Requests](https://github.com/fekher12wx/aures-ecommerce/issues/new?template=feature_request.md)
- [Bug Reports](https://github.com/fekher12wx/aures-ecommerce/issues/new?template=bug_report.md)

### **Community**
- [Discussions](https://github.com/fekher12wx/aures-ecommerce/discussions)
- [Wiki](https://github.com/fekher12wx/aures-ecommerce/wiki)

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **PostgreSQL** for the robust database system
- **Payment Gateway Providers** for their APIs

## 📈 Roadmap

- [ ] **Multi-language Support** (i18n)
- [ ] **Advanced Analytics Dashboard**
- [ ] **Mobile App** (React Native)
- [ ] **AI-powered Recommendations**
- [ ] **Advanced Inventory Management**
- [ ] **Multi-store Support**
- [ ] **Advanced Tax Rules Engine**

---

<div align="center">
  <p>Built with ❤️ by the AURES Team</p>
  <p>
    <a href="https://github.com/fekher12wx/aures-ecommerce/stargazers">
      <img alt="GitHub stars" src="https://img.shields.io/github/stars/fekher12wx/aures-ecommerce?style=social">
    </a>
    <a href="https://github.com/fekher12wx/aures-ecommerce/network">
      <img alt="GitHub forks" src="https://img.shields.io/gadge/github/forks/fekher12wx/aures-ecommerce?style=social">
    </a>
    <a href="https://github.com/yourusernfekher12wxame/aures-ecommerce/issues">
      <img alt="GitHub issues" src="https://img.shields.io/github/issues/fekher12wx/aures-ecommerce">
    </a>
  </p>
</div>
