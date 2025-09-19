import React, { useState } from 'react';
import { useImages } from '../context/ImageContext';

const ImageList = ({ onImageSelect }) => {
  const { images, loading, error } = useImages();
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleImageClick = (image, index) => {
    setSelectedIndex(index);
    onImageSelect(image, index);
  };

  if (loading) {
    return (
      <div className="image-list">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-list">
        <div style={{ padding: '20px', color: 'red' }}>
          错误: {error}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="image-list">
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          请先上传JSON文件
        </div>
      </div>
    );
  }

  return (
    <div className="image-list">
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa', flexShrink: 0 }}>
        <h3>图像列表 ({images.length})</h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`image-item ${selectedIndex === index ? 'active' : ''}`}
            onClick={() => handleImageClick(image, index)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="image-name" style={{ flex: 1, marginRight: '10px' }}>
                {image.path}
              </div>
              {image.annotations && image.annotations.length > 0 && (
                <div style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {image.annotations.length}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageList;
