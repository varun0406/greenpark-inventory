# Inventory Management System

A modern, full-featured inventory management solution built with React and TypeScript. This application provides comprehensive tools for tracking stock levels, managing suppliers, processing orders, and generating detailed analytics reports.

## 🚀 Live Demo

Experience the application's responsive design and full functionality across desktop and mobile devices.

## ✨ Key Features

### Core Inventory Management
- **Real-time Stock Tracking** - Monitor inventory levels with instant updates and movement history
- **Smart Reorder System** - Automated purchase order generation based on minimum stock thresholds
- **Barcode Integration** - Streamlined product identification and stock operations
- **Multi-location Support** - Track products across different warehouse locations

### Advanced Analytics
- **Interactive Dashboards** - Visual insights with charts and key performance indicators
- **Category Analysis** - Detailed breakdown of inventory by product categories
- **Stock Movement Reports** - Complete audit trail of all inventory transactions
- **Export Capabilities** - CSV export functionality for external reporting

### Supplier & Order Management
- **Comprehensive Supplier Database** - Complete vendor information with contact details and payment terms
- **Purchase Order Workflow** - End-to-end order management from creation to receipt
- **Automated Alerts** - Proactive notifications for low stock and out-of-stock items

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **State Management**: React Context API with useReducer pattern
- **Routing**: React Router v6
- **Data Visualization**: Recharts library
- **UI Components**: Lucide React icons
- **Styling**: Tailwind CSS with dark mode support
- **Date Management**: date-fns library

## 📱 Responsive Design

The application features a mobile-first responsive design that adapts seamlessly across all device sizes:
- **Mobile**: Collapsible navigation with touch-friendly interface
- **Tablet**: Optimized layouts for medium screen sizes
- **Desktop**: Full sidebar navigation with expanded feature set

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages and views
├── context/            # Global state management
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Helper functions and utilities
└── App.tsx             # Main application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Steven-Ngoma/inventory-management-system.git
   cd inventory-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Sample Data

The application initializes with realistic sample data including:
- Product catalog with various categories (Electronics, Furniture, etc.)
- Supplier database with complete contact information
- Stock movements and transaction history
- Alert notifications for demonstration

## 🔧 Available Scripts

- `npm start` - Launch development server
- `npm build` - Create production build
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App

## 🎯 Business Logic

### Automated Inventory Control
The system continuously monitors stock levels and automatically generates reorder suggestions when products fall below their minimum thresholds. This proactive approach prevents stockouts and maintains optimal inventory levels.

### Comprehensive Audit Trail
Every inventory transaction is logged with detailed information including movement type, quantities, timestamps, and user references, ensuring complete traceability and accountability.

### Smart Alert System
Real-time monitoring generates intelligent alerts for various scenarios including out-of-stock conditions, low inventory warnings, and potential overstock situations.

## 🔮 Future Enhancements

- Integration with barcode scanning hardware
- Multi-warehouse inventory management
- Advanced reporting with custom date ranges
- User authentication and role-based permissions
- ERP system integrations
- Mobile application development

## 👨‍💻 Developer

**Kotwani Varun**
- Email: kotwaniv03@gmail.com
- Phone: 9913617254

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request