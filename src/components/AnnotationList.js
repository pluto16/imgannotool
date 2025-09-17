import React from 'react';
import { useImages } from '../context/ImageContext';
import { useCategories } from '../context/CategoryContext';

const AnnotationList = ({ selectedImage }) => {
  const { images, deleteAnnotation } = useImages();
  const { categories } = useCategories();

  // 使用 Context 中的最新图像对象，确保标注变化后列表及时刷新
  const activeImage = selectedImage
    ? (images.find(img => img.path === selectedImage.path) || selectedImage)
    : null;

  const handleAnnotationClick = (annotation) => {
    if (window.confirm('是否删除此标注？')) {
      if (activeImage) {
        deleteAnnotation(activeImage.path, annotation.id);
      }
    }
  };

  if (!activeImage) {
    return (
      <div className="annotation-sidebar">
        <div className="annotation-list">
          <div className="annotation-list-header">
            <h3>标注列表</h3>
          </div>
          <div className="annotation-list-content">
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '20px',
              fontSize: '14px'
            }}>
              请先选择图像
            </div>
          </div>
        </div>
      </div>
    );
  }

  const annotations = activeImage.annotations || [];

  return (
    <div className="annotation-sidebar">
      <div className="annotation-list">
        <div className="annotation-list-header">
          <h3>标注列表 ({annotations.length})</h3>
        </div>
        <div className="annotation-list-content">
          {annotations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '20px',
              fontSize: '14px'
            }}>
              暂无标注
            </div>
          ) : (
            annotations.map((annotation, index) => {
              const category = categories.find(cat => cat.id === annotation.categoryId);
              return (
                <div
                  key={annotation.id}
                  className="annotation-item"
                  onClick={() => handleAnnotationClick(annotation)}
                >
                  <div className="annotation-item-header">
                    <div className="annotation-category">
                      <div 
                        className="annotation-color" 
                        style={{ backgroundColor: category?.color || '#007bff' }}
                      />
                      {category?.name || '未分类'}
                    </div>
                    <span className="annotation-delete">删除</span>
                  </div>
                  <div className="annotation-coords">
                    位置: ({Math.round(annotation.x)}, {Math.round(annotation.y)})<br/>
                    大小: {Math.round(annotation.width)} × {Math.round(annotation.height)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotationList;
