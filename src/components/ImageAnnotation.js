import React, { useState, useRef, useEffect } from 'react';
import { useImages } from '../context/ImageContext';
import { useCategories } from '../context/CategoryContext';

const ImageAnnotation = ({ selectedImage }) => {
  const { addAnnotation, updateAnnotation, deleteAnnotation } = useImages();
  const { categories } = useCategories();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (selectedImage && imageLoaded) {
      drawAnnotations();
    }
  }, [selectedImage, imageLoaded]);

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制所有标注
    selectedImage.annotations?.forEach((annotation, index) => {
      const category = categories.find(cat => cat.id === annotation.categoryId);
      const color = category?.color || '#007bff';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );

      // 绘制标签
      ctx.fillStyle = color;
      ctx.font = '12px Arial';
      const label = category?.name || `标注 ${index + 1}`;
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(annotation.x, annotation.y - 20, textWidth + 8, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(label, annotation.x + 4, annotation.y - 6);
    });

    // 绘制当前正在绘制的矩形
    if (currentRect) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.setLineDash([]);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image) {
      canvas.width = image.offsetWidth;
      canvas.height = image.offsetHeight;
      drawAnnotations();
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (!selectedImage || !selectedCategory) return;
    
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentRect) return;

    const pos = getMousePos(e);
    const newRect = {
      ...currentRect,
      width: pos.x - currentRect.x,
      height: pos.y - currentRect.y
    };
    setCurrentRect(newRect);
    drawAnnotations();
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !currentRect) return;

    const pos = getMousePos(e);
    const finalRect = {
      ...currentRect,
      width: pos.x - currentRect.x,
      height: pos.y - currentRect.y
    };

    // 确保宽度和高度为正数
    if (Math.abs(finalRect.width) > 5 && Math.abs(finalRect.height) > 5) {
      const normalizedRect = {
        x: Math.min(finalRect.x, finalRect.x + finalRect.width),
        y: Math.min(finalRect.y, finalRect.y + finalRect.height),
        width: Math.abs(finalRect.width),
        height: Math.abs(finalRect.height)
      };

      const category = categories.find(cat => cat.id === selectedCategory);
      addAnnotation(selectedImage.path, {
        ...normalizedRect,
        categoryId: selectedCategory,
        categoryName: category?.name || '未分类'
      });
    }

    setIsDrawing(false);
    setCurrentRect(null);
  };

  const handleAnnotationClick = (annotation) => {
    if (window.confirm('是否删除此标注？')) {
      deleteAnnotation(selectedImage.path, annotation.id);
    }
  };

  const exportAnnotations = () => {
    if (!selectedImage || !selectedImage.annotations) return;

    const dataStr = JSON.stringify(selectedImage.annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedImage.name}_annotations.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedImage) {
    return (
      <div className="annotation-area">
        <div className="no-image">
          请从左侧列表选择一张图像
        </div>
      </div>
    );
  }

  return (
    <div className="annotation-area">
      <div className="annotation-header">
        <h3>{selectedImage.name}</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input"
            style={{ width: '200px' }}
          >
            <option value="">选择标注类别</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-success"
            onClick={exportAnnotations}
            disabled={!selectedImage.annotations || selectedImage.annotations.length === 0}
          >
            导出标注
          </button>
        </div>
      </div>

      <div className="annotation-content">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            ref={imageRef}
            src={selectedImage.path}
            alt={selectedImage.name}
            className="current-image"
            onLoad={handleImageLoad}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div 
            style={{ 
              display: 'none', 
              width: '100%', 
              height: '400px', 
              backgroundColor: '#f0f0f0', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#999'
            }}
          >
            无法加载图像
          </div>
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: selectedCategory ? 'crosshair' : 'default',
              pointerEvents: selectedCategory ? 'auto' : 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>


        {!selectedCategory && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px',
            color: '#856404'
          }}>
            请先选择标注类别，然后点击并拖拽图像来创建标注框
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnnotation;
