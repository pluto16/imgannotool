import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useImages } from '../context/ImageContext';
import { useCategories } from '../context/CategoryContext';

const ImageAnnotation = ({ selectedImage }) => {
  const { images, addAnnotation, updateAnnotation, deleteAnnotation } = useImages();
  const { categories } = useCategories();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [pendingAnnotation, setPendingAnnotation] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [optimisticAnnotation, setOptimisticAnnotation] = useState(null);
  const [targetAnnotationCount, setTargetAnnotationCount] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [forceRedraw, setForceRedraw] = useState(0);
  
  // 新增状态：选中和拖拽相关
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'move'
  const [dragStartPos, setDragStartPos] = useState(null);
  const [dragStartAnnotation, setDragStartAnnotation] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  // 始终通过 Context 中的最新图像对象进行渲染，确保注释变化会触发重绘
  const activeImage = selectedImage
    ? (images.find(img => img.path === selectedImage.path) || selectedImage)
    : null;

  useEffect(() => {
    if (activeImage && imageLoaded) {
      drawAnnotations();
    }
  }, [activeImage, imageLoaded, activeImage?.annotations, categories, forceRedraw, pendingAnnotation, optimisticAnnotation, selectedAnnotation, isDragging]);

  // 当 Context 中的注释数量达到期望值时，清除乐观渲染
  useEffect(() => {
    if (
      targetAnnotationCount != null &&
      activeImage &&
      Array.isArray(activeImage.annotations) &&
      activeImage.annotations.length >= targetAnnotationCount
    ) {
      setOptimisticAnnotation(null);
      setTargetAnnotationCount(null);
      setTimeout(() => drawAnnotations(), 0);
    }
  }, [activeImage?.annotations?.length, targetAnnotationCount]);

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImage) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制所有已确认的标注
    if (activeImage.annotations && activeImage.annotations.length > 0) {
      activeImage.annotations.forEach((annotation, index) => {
        const category = categories.find(cat => cat.id === annotation.categoryId);
        const color = category?.color || '#007bff';
        const isSelected = selectedAnnotation && selectedAnnotation.id === annotation.id;
        if (isSelected) {
          console.log('绘制选中状态:', annotation.id, selectedAnnotation.id);
        }
        
        ctx.save(); // 保存当前绘图状态
        
        // 绘制矩形框（选择类别后：对应类别颜色，实线，线宽3像素）
        ctx.strokeStyle = color; // 使用类别对应的颜色
        ctx.lineWidth = isSelected ? 3 : 2; // 选中状态线宽3像素
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
        
        // 绘制选中状态的角点
        if (isSelected) {
          ctx.fillStyle = color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          
          // 四个角点
          const corners = [
            { x: annotation.x, y: annotation.y }, // 左上
            { x: annotation.x + annotation.width, y: annotation.y }, // 右上
            { x: annotation.x, y: annotation.y + annotation.height }, // 左下
            { x: annotation.x + annotation.width, y: annotation.y + annotation.height } // 右下
          ];
          
          corners.forEach(corner => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          });
        }
        
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

    // 绘制乐观标注：选择类别后立即以实线和对应颜色显示
    if (optimisticAnnotation) {
      const category = categories.find(cat => cat.id === optimisticAnnotation.categoryId);
      const color = category?.color || '#007bff';

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(
        optimisticAnnotation.x,
        optimisticAnnotation.y,
        optimisticAnnotation.width,
        optimisticAnnotation.height
      );

      // 标签
      ctx.fillStyle = color;
      ctx.font = '12px Arial';
      const label = category?.name || '未分类';
      const textWidth = ctx.measureText(label).width;
      const labelHeight = 18;
      ctx.fillRect(optimisticAnnotation.x, Math.max(0, optimisticAnnotation.y - labelHeight), textWidth + 8, labelHeight);
      ctx.fillStyle = 'white';
      ctx.fillText(label, optimisticAnnotation.x + 4, Math.max(12, optimisticAnnotation.y - 4));
      ctx.restore();
    }
  }, [activeImage, categories, selectedAnnotation, currentRect, pendingAnnotation, optimisticAnnotation]);

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

  // 检测点是否在矩形框内
  const isPointInRect = (point, rect) => {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width && 
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  };

  // 检测点是否在角点附近
  const getCornerHandle = (point, annotation) => {
    const handleSize = 8; // 角点检测范围
    const corners = [
      { x: annotation.x, y: annotation.y, handle: 'nw' }, // 左上
      { x: annotation.x + annotation.width, y: annotation.y, handle: 'ne' }, // 右上
      { x: annotation.x, y: annotation.y + annotation.height, handle: 'sw' }, // 左下
      { x: annotation.x + annotation.width, y: annotation.y + annotation.height, handle: 'se' } // 右下
    ];

    for (const corner of corners) {
      if (Math.abs(point.x - corner.x) <= handleSize && Math.abs(point.y - corner.y) <= handleSize) {
        return corner.handle;
      }
    }
    return null;
  };

  // 找到双击位置的最小面积标注框
  const findSmallestAnnotationAtPoint = (point) => {
    if (!activeImage?.annotations) return null;
    
    const overlappingAnnotations = activeImage.annotations.filter(annotation => 
      isPointInRect(point, annotation)
    );
    
    if (overlappingAnnotations.length === 0) return null;
    
    // 返回面积最小的标注框
    return overlappingAnnotations.reduce((smallest, current) => {
      const smallestArea = smallest.width * smallest.height;
      const currentArea = current.width * current.height;
      return currentArea < smallestArea ? current : smallest;
    });
  };

  const handleMouseDown = (e) => {
    if (!activeImage) return;
    
    const pos = getMousePos(e);
    const currentTime = Date.now();
    
    // 简单的双击检测：如果两次点击间隔小于300ms，认为是双击
    if (currentTime - lastClickTime < 300) {
      // 双击事件
      const annotation = findSmallestAnnotationAtPoint(pos);
      if (annotation) {
        console.log('双击选中标注框:', annotation);
        setSelectedAnnotation(annotation);
        // 立即重绘
        setTimeout(() => {
          setForceRedraw(prev => prev + 1);
          drawAnnotations();
        }, 0);
      } else {
        // 双击空白区域，取消选中
        console.log('双击空白区域，取消选中');
        setSelectedAnnotation(null);
        // 立即重绘
        setTimeout(() => {
          setForceRedraw(prev => prev + 1);
          drawAnnotations();
        }, 0);
      }
      setLastClickTime(0); // 重置，避免连续双击
      return;
    }
    
    setLastClickTime(currentTime);
    
    // 检查是否点击在已选中的标注框上
    if (selectedAnnotation) {
      const cornerHandle = getCornerHandle(pos, selectedAnnotation);
      if (cornerHandle) {
        // 开始拖拽角点
        setIsDragging(true);
        setDragHandle(cornerHandle);
        setDragStartPos(pos);
        setDragStartAnnotation({ ...selectedAnnotation });
        return;
      } else if (isPointInRect(pos, selectedAnnotation)) {
        // 开始拖拽整个框
        setIsDragging(true);
        setDragHandle('move');
        setDragStartPos(pos);
        setDragStartAnnotation({ ...selectedAnnotation });
        return;
      }
    }
    
    // 开始绘制新标注框
    setIsDrawing(true);
    setCurrentRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    
    // 处理拖拽
    if (isDragging && dragHandle && dragStartPos && dragStartAnnotation) {
      const deltaX = pos.x - dragStartPos.x;
      const deltaY = pos.y - dragStartPos.y;
      
      let newAnnotation = { ...dragStartAnnotation };
      
      if (dragHandle === 'move') {
        // 移动整个框
        newAnnotation.x = dragStartAnnotation.x + deltaX;
        newAnnotation.y = dragStartAnnotation.y + deltaY;
      } else {
        // 调整角点
        switch (dragHandle) {
          case 'nw': // 左上角
            newAnnotation.x = dragStartAnnotation.x + deltaX;
            newAnnotation.y = dragStartAnnotation.y + deltaY;
            newAnnotation.width = dragStartAnnotation.width - deltaX;
            newAnnotation.height = dragStartAnnotation.height - deltaY;
            break;
          case 'ne': // 右上角
            newAnnotation.y = dragStartAnnotation.y + deltaY;
            newAnnotation.width = dragStartAnnotation.width + deltaX;
            newAnnotation.height = dragStartAnnotation.height - deltaY;
            break;
          case 'sw': // 左下角
            newAnnotation.x = dragStartAnnotation.x + deltaX;
            newAnnotation.width = dragStartAnnotation.width - deltaX;
            newAnnotation.height = dragStartAnnotation.height + deltaY;
            break;
          case 'se': // 右下角
            newAnnotation.width = dragStartAnnotation.width + deltaX;
            newAnnotation.height = dragStartAnnotation.height + deltaY;
            break;
          default:
            // 不应该到达这里
            break;
        }
        
        // 确保宽度和高度为正数
        if (newAnnotation.width < 0) {
          newAnnotation.x += newAnnotation.width;
          newAnnotation.width = Math.abs(newAnnotation.width);
        }
        if (newAnnotation.height < 0) {
          newAnnotation.y += newAnnotation.height;
          newAnnotation.height = Math.abs(newAnnotation.height);
        }
      }
      
      // 更新选中的标注框
      setSelectedAnnotation(newAnnotation);
      setTimeout(() => drawAnnotations(), 0);
      return;
    }
    
    // 处理绘制新标注框
    if (isDrawing && currentRect) {
      const newRect = {
        ...currentRect,
        width: pos.x - currentRect.x,
        height: pos.y - currentRect.y
      };
      setCurrentRect(newRect);
      setTimeout(() => drawAnnotations(), 0);
    }
  };

  const handleMouseUp = (e) => {
    // 处理拖拽结束
    if (isDragging && selectedAnnotation) {
      // 更新Context中的标注数据
      updateAnnotation(activeImage.path, selectedAnnotation.id, {
        x: selectedAnnotation.x,
        y: selectedAnnotation.y,
        width: selectedAnnotation.width,
        height: selectedAnnotation.height
      });
      
      setIsDragging(false);
      setDragHandle(null);
      setDragStartPos(null);
      setDragStartAnnotation(null);
      return;
    }
    
    // 处理绘制新标注框结束
    if (isDrawing && currentRect) {
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
    }
  };


  const handleCategorySelect = (categoryId) => {
    if (pendingAnnotation) {
      const category = categories.find(cat => cat.id === categoryId);
      const newAnnotation = {
        ...pendingAnnotation,
        categoryId: categoryId,
        categoryName: category?.name || '未分类'
      };

      // 先乐观渲染，立即显示
      setOptimisticAnnotation(newAnnotation);
      setTargetAnnotationCount((activeImage?.annotations?.length || 0) + 1);

      // 关闭弹窗并清除待确认框（避免继续显示虚线）
      setShowCategoryModal(false);
      setPendingAnnotation(null);

      // 触发 Context 更新
      addAnnotation(activeImage.path, newAnnotation);
      
      // 自动选择新创建的标注框
      setSelectedAnnotation(newAnnotation);
      
      // 强制重新绘制
      setForceRedraw(prev => prev + 1);
      setTimeout(() => drawAnnotations(), 0);
    }
  };

  const handleCancelAnnotation = () => {
    setShowCategoryModal(false);
    setPendingAnnotation(null);
    // 立即重绘以清除待确认的标注
    setTimeout(() => drawAnnotations(), 0);
  };

  // 删除选中的标注
  const handleDeleteSelected = useCallback(() => {
    if (selectedAnnotation) {
      if (window.confirm('是否删除此标注？')) {
        deleteAnnotation(activeImage.path, selectedAnnotation.id);
        setSelectedAnnotation(null);
        setForceRedraw(prev => prev + 1);
        setTimeout(() => drawAnnotations(), 0);
      }
    }
  }, [selectedAnnotation, activeImage, deleteAnnotation, drawAnnotations]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedAnnotation(null);
        setForceRedraw(prev => prev + 1);
        setTimeout(() => drawAnnotations(), 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation]);

  if (!activeImage) {
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
        <h3>{activeImage.name}</h3>
        {selectedAnnotation && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              已选中标注框 - 可拖拽调整大小或按 Delete 键删除
            </span>
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: '5px 10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              删除选中
            </button>
          </div>
        )}
      </div>

      <div className="annotation-content">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            ref={imageRef}
            src={activeImage.path}
            alt={activeImage.name}
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
