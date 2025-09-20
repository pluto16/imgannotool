import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ImageList from './components/ImageList';
import ImageAnnotation from './components/ImageAnnotation';
import AnnotationList from './components/AnnotationList';
import CategorySettings from './components/CategorySettings';
import { ImageProvider } from './context/ImageContext';
import { CategoryProvider } from './context/CategoryContext';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="navigation">
      <div className="nav-item">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          图像标注
        </Link>
      </div>
      <div className="nav-item">
        <Link 
          to="/categories" 
          className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}
        >
          类别设置
        </Link>
      </div>
    </nav>
  );
}

function MainPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleImageSelect = (image, index) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <FileUpload />
            <button 
              className="collapse-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "展开图像列表" : "折叠图像列表"}
            >
              {sidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>
          {!sidebarCollapsed && <ImageList onImageSelect={handleImageSelect} />}
        </div>
        
        <div className="content-area">
          <ImageAnnotation 
            selectedImage={selectedImage} 
            selectedImageIndex={selectedImageIndex}
            onImageSelect={handleImageSelect}
          />
        </div>
        
        <AnnotationList selectedImage={selectedImage} />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <CategoryProvider>
        <ImageProvider>
          <div className="App">
            <div className="app-container">
              <Navigation />
              <div className="app-content">
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/categories" element={<CategorySettings />} />
                </Routes>
              </div>
            </div>
          </div>
        </ImageProvider>
      </CategoryProvider>
    </Router>
  );
}

export default App;
