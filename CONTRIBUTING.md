# 🤝 Contributing to AURES E-Commerce Platform

Thank you for your interest in contributing to our e-commerce platform! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Support](#support)

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- PostgreSQL 15+
- Git
- Basic knowledge of TypeScript, React, and Node.js

### **Fork and Clone**
1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/fekher12wx/aures-ecommerce.git
   cd aures-ecommerce
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/original-owner/aures-ecommerce.git
   ```

## 🛠️ Development Setup

### **1. Install Dependencies**
```bash
# Backend
cd backend/e-commerce-backend
npm install

# Frontend
cd frontend
npm install
```

### **2. Environment Configuration**
```bash
# Backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend
cp .env.example .env.local
# Edit .env.local with your API endpoints
```

### **3. Database Setup**
```bash
# Create database
createdb aures_ecommerce

# Run setup scripts
cd backend/e-commerce-backend
npm run setup:db
npm run setup:taxes
npm run setup:payment-methods
```

### **4. Start Development Servers**
```bash
# Backend (Terminal 1)
cd backend/e-commerce-backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

## 📝 Coding Standards

### **TypeScript**
- Use **strict mode** and **ES6+** features
- Prefer **interfaces** over types for object shapes
- Use **enums** for constants
- **Always** specify return types for functions

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): Promise<User | null> {
  // implementation
}

// ❌ Avoid
const user = {
  id: '123',
  name: 'John'
}
```

### **React/Next.js**
- Use **functional components** with hooks
- Prefer **named exports** over default exports
- Use **TypeScript interfaces** for props
- Follow **Next.js 13 App Router** conventions

```typescript
// ✅ Good
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart 
}) => {
  // component logic
};

// ❌ Avoid
export default function ProductCard(props) {
  // implementation
}
```

### **Node.js/Express**
- Use **async/await** over callbacks
- Implement **proper error handling**
- Use **middleware** for common functionality
- Follow **RESTful API** conventions

```typescript
// ✅ Good
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// ❌ Avoid
export const createProduct = (req, res) => {
  productService.create(req.body)
    .then(product => res.json(product))
    .catch(err => res.status(500).json(err));
};
```

### **Database**
- Use **parameterized queries** to prevent SQL injection
- Implement **proper indexing** for performance
- Use **transactions** for data consistency
- Follow **naming conventions**

```sql
-- ✅ Good
SELECT p.*, t.rate as tax_rate
FROM products p
LEFT JOIN taxes t ON p.tax_id = t.id
WHERE p.category = $1;

-- ❌ Avoid
SELECT * FROM products WHERE category = 'electronics';
```

## 📝 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### **Commit Message Format**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### **Types**
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### **Examples**
```bash
# ✅ Good
feat(cart): add real-time tax calculation
fix(auth): resolve JWT token validation issue
docs(readme): update installation instructions
refactor(payment): simplify gateway integration
test(api): add payment endpoint tests

# ❌ Avoid
updated cart
fixed bug
added stuff
```

## 🔄 Pull Request Process

### **1. Create Feature Branch**
```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

### **2. Make Changes**
- Write clean, documented code
- Add tests for new functionality
- Update documentation as needed
- Follow the coding standards

### **3. Commit Changes**
```bash
git add .
git commit -m "feat(cart): add real-time tax calculation"
```

### **4. Push and Create PR**
```bash
git push origin feature/amazing-feature
```

### **5. Pull Request Checklist**
- [ ] **Title** follows conventional commits format
- [ ] **Description** clearly explains the changes
- [ ] **Tests** pass locally
- [ ] **Code** follows project standards
- [ ] **Documentation** updated if needed
- [ ] **Screenshots** added for UI changes

### **6. PR Template**
```markdown
## 📝 Description
Brief description of changes

## 🔧 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📸 Screenshots (if applicable)
Add screenshots for UI changes

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🧪 Testing Guidelines

### **Backend Testing**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "user authentication"
```

### **Frontend Testing**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### **Test Standards**
- **Unit tests** for all business logic
- **Integration tests** for API endpoints
- **Component tests** for React components
- **Minimum 80%** code coverage
- **Meaningful test names** that describe behavior

```typescript
// ✅ Good
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // test implementation
    });

    it('should throw error for invalid email', async () => {
      // test implementation
    });
  });
});

// ❌ Avoid
describe('UserService', () => {
  it('should work', () => {
    // test implementation
  });
});
```

## 📚 Documentation

### **Code Documentation**
- **JSDoc** comments for functions and classes
- **Inline comments** for complex logic
- **README updates** for new features
- **API documentation** for endpoints

```typescript
/**
 * Creates a new user account
 * @param userData - User registration data
 * @param userData.email - User's email address
 * @param userData.password - User's password
 * @param userData.name - User's full name
 * @returns Promise<User> - Created user object
 * @throws {ValidationError} When user data is invalid
 * @throws {DuplicateError} When email already exists
 */
export const createUser = async (userData: CreateUserData): Promise<User> => {
  // implementation
};
```

### **Documentation Files**
- **README.md** - Project overview and setup
- **API.md** - API endpoint documentation
- **DEPLOYMENT.md** - Deployment instructions
- **CHANGELOG.md** - Version history

## 🆘 Support

### **Getting Help**
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general help
- **Wiki** - Detailed documentation and guides

### **Communication Channels**
- **GitHub Issues**: https://github.com/fekher12wx/aures-ecommerce/issues
- **GitHub Discussions**: https://github.com/fekher12wx/aures-ecommerce/discussions
- **Wiki**: https://github.com/fekher12wx/aures-ecommerce/wiki

### **Before Asking for Help**
1. **Check existing issues** and discussions
2. **Read the documentation** thoroughly
3. **Try to reproduce** the issue locally
4. **Provide detailed information** about your problem

## 🎯 Contribution Areas

### **High Priority**
- **Bug fixes** and critical issues
- **Security vulnerabilities**
- **Performance improvements**
- **Documentation updates**

### **Medium Priority**
- **New features** and enhancements
- **UI/UX improvements**
- **Test coverage** improvements
- **Code refactoring**

### **Low Priority**
- **Cosmetic changes**
- **Minor optimizations**
- **Additional examples**
- **Translation updates**

## 🏆 Recognition

### **Contributor Levels**
- **Bronze**: 1-5 contributions
- **Silver**: 6-15 contributions
- **Gold**: 16+ contributions
- **Platinum**: Major contributions or maintainer role

### **Contributor Benefits**
- **Profile recognition** in README
- **Special badges** and acknowledgments
- **Early access** to new features
- **Community recognition**

---

Thank you for contributing to AURES E-Commerce Platform! 🎉

Your contributions help make this project better for everyone. If you have any questions or need help, don't hesitate to reach out through our support channels.
