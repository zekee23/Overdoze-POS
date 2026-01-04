import React, { useState } from 'react';
import './LandingPage.css';
import { useNavigate  } from 'react-router-dom';
import loginpage from './Login.jsx'

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">☕ Overdoze POS</div>
          
          <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
              <a href="#home" className="nav-link">Home</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#how-to-use" className="nav-link" >How to Use</a>
              <button className="nav-cta mobile-nav-cta" onClick={()=> navigate ('/login')}>Get Started</button>
            </div>
          <div className="nav-cta-container desktop-only">
            <button className="nav-cta" onClick={()=> navigate ('/login')}>Get Started</button>
          </div>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Overdoze POS</span>
            <br />
            Point of Sale System
          </h1>
          <p className="hero-subtitle">
            Complete POS solution for order management and business operations
          </p>
          <div className="hero-buttons">


           <button className="cta-button primary" onClick={()=> navigate ('/login')}>🚀 Launch POS</button>
            <button className="cta-button secondary" onClick={()=> navigate ('/login')}>📊 Admin Dashboard</button>
               
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="section-header">
            <div className="badge">ℹ️ System Overview</div>
            <h2>About This POS System</h2>
            <p>A comprehensive point of sale solution designed to streamline daily operations and manage business activities efficiently.</p>
          </div>
          <div className="about-grid">
            <div className="about-card">
              <div className="card-icon">⚡</div>
              <h3>Fast Processing</h3>
              <p>Quick order processing and payment handling for efficient customer service.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">🎨</div>
              <h3>User-Friendly Interface</h3>
              <p>Simple and intuitive design for easy navigation and minimal training.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">📊</div>
              <h3>Real-time Data</h3>
              <p>Live sales tracking and inventory monitoring for better business decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="features">
        <div className="container">
          <div className="section-header">
            <div className="badge">📖 User Guide</div>
            <h2>System Functions & Usage</h2>
            <p>Complete guide for using the POS system and admin dashboard</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <div className="feature-icon">👨‍💼</div>
              <h3>Cashier Mode - Order Management</h3>
              <p>Primary interface for processing customer orders and handling payments.</p>
              <ul className="feature-list">
                <li>🎯 Add items to customer orders</li>
                <li>💳 Process Order</li>
                <li>📱 View order history and receipts</li>
                <li>🔍 Search products quickly</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-number">02</div>
              <div className="feature-icon">⚙️</div>
              <h3>Admin Dashboard - Business Management</h3>
              <p>Comprehensive tools for managing inventory, sales, and business operations.</p>
              <ul className="feature-list">
                <li>📈 Manage product inventory</li>
                <li>📱 Track Profits and Daily-Monthly Operation of Cafe </li>
                <li>🎯 Monthly most selling products</li>
                <li>📈Generate a monthly report of operation via excel</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-number">03</div>
              <div className="feature-icon">📱</div>
              <h3>Device Compatibility</h3>
              <p>Optimized for tablets, desktop computers, and mobile devices.</p>
              <ul className="feature-list">
                <li>📱 iPad and tablet support</li>
                <li>🔄 Offline mode capability</li>
                <li>🎨 Responsive design</li>
                <li>⚡ Fast synchronization</li>
                <li>🔐 Secure data handling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <div className="section-header">
            <div className="badge">🚀 Ready to Start</div>
            <h2>Begin Using Your POS System</h2>
            <p>Choose your access mode to get started with the system</p>
          </div>
          <div className="contact-buttons">
            <button className="contact-button primary" onClick={()=> navigate ('/login')}>👨‍💼 Launch Cashier Mode</button>
            <button className="contact-button secondary" onClick={()=> navigate ('/login')}>⚙️ Open Admin Dashboard</button>
          </div>
          <div className="contact-features">
            <div className="contact-feature">✅ No installation required</div>
            <div className="contact-feature">✅ Cloud-based system</div>
            <div className="contact-feature">✅ Automatic updates</div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Overdoze POS</h3>
              <p>Complete Point of Sale solution for your cafe business operations.</p>
            </div>
            <div className="footer-section">
              <h3>Contact Information</h3>
              <p>📧 support@overdozepos.com</p>
              <p>📱 +63------</p>
              <p>📍 142 Escobar Street Barangay Burgos Lopez, Quezon 4316 Lopez, Philippines</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <a href="#home" className="footer-link">Home</a>
              <a href="#about" className="footer-link">About</a>
              <a href="#how-to-use" className="footer-link">How to Use</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Overdoze POS </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
