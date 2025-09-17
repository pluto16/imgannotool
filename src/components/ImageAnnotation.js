import React, { useState, useRef, useEffect } from 'react';
import { useImages } from '../context/ImageContext';
import { useCategories } from '../context/CategoryContext';

const ImageAnnotation = ({ selectedImage }) => {
  const { addAnnotation, updateAnnotation, deleteAnnotation } = useImages();
  const { categories } = useCategories();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [pendingAnnotation, setPendingAnnotation] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [forceRedraw, setForceRedraw] = useState(0);

  useEffect(() => {
    if (selectedImage && imageLoaded) {
      drawAnnotations();
    }
  }, [selectedImage, imageLoaded, selectedImage?.annotations?.length, categories, forceRedraw, pendingAnnotation]);

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制所有已确认的标注
    if (selectedImage.annotations && selectedImage.annotations.length > 0) {
      selectedImage.annotations.forEach((annotation, index) => {
        const category = categories.find(cat => cat.id === annotation.categoryId);
        const color = category?.color || '#007bff';
        
        ctx.save(); // 保存当前绘图状态
        
        // 绘制矩形框（选择类别后：对应类别颜色，实线，线宽2像素）
        ctx.strokeStyle = color; // 使用类别对应的颜色
        ctx.lineWidth = 2; // 线宽2像素
        ctx.setLineDash([]); // 实线样式
        ctx.strokeRect(
          annotation.x,
          annotation.y,
          annotation.width,
          annotation.height
        );

        // 绘制标签背景
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        const label = category?.name || `标注 ${index + 1}`;
        const textWidth = ctx.measureText(label).width;
        const labelHeight = 18;
        ctx.fillRect(annotation.x, Math.max(0, annotation.y - labelHeight), textWidth + 8, labelHeight);
        
        // 绘制标签文字
        ctx.fillStyle = 'white';
        ctx.fillText(label, annotation.x + 4, Math.max(12, annotation.y - 4));
        
        ctx.restore(); // 恢复绘图状态
      });
    }

    // 绘制当前正在绘制的矩形（未选择类别前：红色虚线，线宽2像素）
    if (currentRect) {
      ctx.save(); // 保存当前绘图状态
      ctx.strokeStyle = '#ff0000'; // 红色
      ctx.lineWidth = 2; // 线宽2像素
      ctx.setLineDash([5, 5]); // 虚线样式
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.restore(); // 恢复绘图状态
    }

    // 绘制待确认的标注（选择类别后但未确认前）
    if (pendingAnnotation) {
      ctx.save(); // 保存当前绘图状态
      ctx.strokeStyle = '#ff0000'; // 红色
      ctx.lineWidth = 2; // 线宽2像素
      ctx.setLineDash([5, 5]); // 虚线样式
      ctx.strokeRect(pendingAnnotation.x, pendingAnnotation.y, pendingAnnotation.width, pendingAnnotation.height);
      ctx.restore(); // 恢复绘图状态
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
    if (!selectedImage) return;
    
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
    setTimeout(() => drawAnnotations(), 0);
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

      // 保存待标注的矩形框，弹出类别选择
      setPendingAnnotation(normalizedRect);
      setShowCategoryModal(true);
      // 立即重绘以显示待确认的标注
      setTimeout(() => drawAnnotations(), 0);
    }

    setIsDrawing(false);
    setCurrentRect(null);
  };

  const handleAnnotationClick = (annotation) => {
    if (window.confirm('是否删除此标注？')) {
      deleteAnnotation(selectedImage.path, annotation.id);
      // 强制重新绘制
      setForceRedraw(prev => prev + 1);
      setTimeout(() => drawAnnotations(), 0);
    }
  };

  const handleCategorySelect = (categoryId) => {
    if (pendingAnnotation) {
      const category = categories.find(cat => cat.id === categoryId);
      addAnnotation(selectedImage.path, {
        ...pendingAnnotation,
        categoryId: categoryId,
        categoryName: category?.name || '未分类'
      });
      
      // 强制重新绘制
      setForceRedraw(prev => prev + 1);
      setTimeout(() => drawAnnotations(), 0);
    }
    setShowCategoryModal(false);
    setPendingAnnotation(null);
    // 立即重绘以清除待确认的标注
    setTimeout(() => drawAnnotations(), 0);
  };

  const handleCancelAnnotation = () => {
    setShowCategoryModal(false);
    setPendingAnnotation(null);
    // 立即重绘以清除待确认的标注
    setTimeout(() => drawAnnotations(), 0);
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
              cursor: 'crosshair',
              pointerEvents: 'auto'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
      </div>

      {/* 类别选择模态框 */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>选择标注类别</h3>
            <div style={{ marginBottom: '20px' }}>
              {categories.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>
                  请先在类别设置页面添加类别
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      style={{
                        padding: '15px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = category.color;
                        e.target.style.backgroundColor = category.color + '10';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#ddd';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: category.color,
                          borderRadius: '3px'
                        }}
                      />
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleCancelAnnotation}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnnotation;
