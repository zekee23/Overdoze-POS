# Overdoze POS - Complete Point of Sale System

![Overdoze POS](https://img.shields.io/badge/Overdoze-POS-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=for-the-badge&logo=postgresql)

A modern, full-featured Point of Sale (POS) system designed for cafes, restaurants, and retail businesses. Built with React, Node.js, and PostgreSQL.

## ✨ Features

### 🎯 Core POS Features
- **Order Management** - Create, edit, and track orders in real-time
- **Product Management** - Manage products, variants, and pricing
- **User Authentication** - Secure login system with role-based access
- **Cash Drawer Management** - Track cash flow and daily transactions
- **Dashboard Analytics** - Real-time sales data and business insights

### 📊 Advanced Features
- **Daily Tracking** - Comprehensive daily sales and inventory tracking
- **Monthly Reports** - Detailed monthly business analytics
- **Stock Management** - Real-time inventory tracking with alerts
- **Cashier Sessions** - Individual cashier performance tracking
- **Multi-device Support** - Access from any device on your network

### 🛠️ Technical Features
- **Network Access** - Multi-device connectivity out of the box
- **Real-time Updates** - Live order status and inventory updates
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Built with Ant Design and Material-UI components
- **Secure API** - JWT authentication and rate limiting

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ - [Download Node.js](https://nodejs.org/)
- **PostgreSQL** 14+ - [Download PostgreSQL](https://www.postgresql.org/download/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/overdoze-pos.git
   cd overdoze-pos
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb -U postgres overdoze_pos
   
   # Run migrations
   cd ../backend
   node run-migration.js
   ```

5. **Configure Environment**
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   
   # Edit .env with your database credentials
   ```

### 🎮 Easy Start (Windows)

**Double-click `Start-Servers.bat`** to start both frontend and backend servers automatically!

This will:
- Configure firewall automatically
- Start both servers
- Open application in browser
- Show network access URLs

**Stop servers:** Double-click `Stop-Servers.bat`

## 🌐 Access URLs

**Local Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

**Network Access:**
- Frontend: http://[YOUR_IP]:5173
- Backend API: http://[YOUR_IP]:3000

**Default Login:**
- Username: `admin`
- Password: `admin`

## 📁 Project Structure

```
overdoze-pos/
├── 📄 Start-Servers.bat          # Start all servers (Windows)
├── 📄 Stop-Servers.bat           # Stop all servers (Windows)
├── 📄 Copy-Database-To-Client.bat # Database export tool
├── 📄 CLIENT_SETUP_GUIDE.md      # Client deployment guide
├── 📄 DATABASE_MIGRATION_GUIDE.md # Database migration guide
├── 📁 backend/                   # Node.js backend
│   ├── 📁 config/                # Database configuration
│   ├── 📁 controllers/           # API controllers
│   ├── 📁 database/              # SQL migration scripts
│   ├── 📁 routes/                # API routes
│   ├── 📁 scripts/               # Utility scripts
│   ├── 📄 server.js              # Main server file
│   └── 📄 package.json           # Backend dependencies
├── 📁 frontend/                  # React frontend
│   ├── 📁 src/
│   │   ├── 📁 api/               # API utilities
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 utils/             # Utility functions
│   │   └── 📄 App.jsx            # Main app component
│   ├── 📄 vite.config.js         # Vite configuration
│   └── 📄 package.json           # Frontend dependencies
└── 📁 documentation/             # Additional docs
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Ant Design** - UI component library
- **Material-UI** - Additional UI components
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Chart.js** - Data visualization

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Arcjet** - Security
- **nodemailer** - Email services

### Development Tools
- **nodemon** - Auto-restart development server
- **ESLint** - Code linting
- **Terser** - Code minification

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `orders` - Order management
- `products` - Product catalog
- `variants` - Product variants
- `cashier_sessions` - Daily cashier tracking
- `daily_variant_stock` - Inventory tracking
- `cash_drawer` - Cash management

## 🚀 Deployment

### Client Deployment

1. **Install Dependencies** on client machine
2. **Import Database** using provided backup
3. **Configure Environment** with client database credentials
4. **Run Start-Servers.bat**

See [CLIENT_SETUP_GUIDE.md](CLIENT_SETUP_GUIDE.md) for detailed instructions.

### Database Migration

For migrating databases between servers:

```bash
# Export database
pg_dump -h localhost -U postgres -d overdoze_pos > backup.sql

# Import to new server
psql -h target_host -U postgres -d overdoze_pos < backup.sql
```

See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) for complete guide.

## 🔧 Configuration

### Environment Variables (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=overdoze_pos
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### Frontend Configuration

The frontend automatically detects network configuration and connects to the appropriate backend URL.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@overdoze-pos.com
- 📖 Documentation: Check the `/documentation` folder
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/overdoze-pos/issues)

## 🎯 Roadmap

- [ ] Mobile app version
- [ ] Cloud hosting option
- [ ] Advanced reporting features
- [ ] Multi-location support
- [ ] Payment gateway integration
- [ ] Inventory management system
- [ ] Employee scheduling
- [ ] Loyalty program integration

---

**Built with ❤️ for small businesses**
