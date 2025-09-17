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
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        图像标注
      </Link>
      <Link 
        to="/categories" 
        className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}
      >
        类别设置
      </Link>
    </nav>
  );
}

function MainPage() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="container">
      <div className="header">
        <h1>PNG图像标注工具</h1>
        <FileUpload />
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <ImageList onImageSelect={setSelectedImage} />
        </div>
        
        <div className="content-area">
          <ImageAnnotation selectedImage={selectedImage} />
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
            <Navigation />
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/categories" element={<CategorySettings />} />
            </Routes>
          </div>
        </ImageProvider>
      </CategoryProvider>
    </Router>
  );
}

export default App;
