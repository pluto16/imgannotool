import React, { useState } from 'react';
import { useCategories } from '../context/CategoryContext';

const CategorySettings = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#007bff');
  const [editingCategory, setEditingCategory] = useState(null);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    addCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor
    });

    setNewCategoryName('');
    setNewCategoryColor('#007bff');
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    if (!editingCategory.name.trim()) return;

    updateCategory(editingCategory.id, {
      name: editingCategory.name.trim(),
      color: editingCategory.color
    });

    setEditingCategory(null);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('确定要删除这个类别吗？')) {
      deleteCategory(id);
    }
  };

  const predefinedColors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
    '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
  ];

  return (
    <div className="container">
      <div className="header">
        <h1>标注类别设置</h1>
        <p>管理图像标注的类别和颜色</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="category-form">
            <h3>添加新类别</h3>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label">类别名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="输入类别名称"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">颜色</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: color,
                          border: newCategoryColor === color ? '2px solid #333' : '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setNewCategoryColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary">
                添加类别
              </button>
            </form>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="category-form">
            <h3>现有类别 ({categories.length})</h3>
            <div className="category-list">
              {categories.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  暂无类别，请先添加类别
                </div>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="category-item">
                    {editingCategory && editingCategory.id === category.id ? (
                      <form onSubmit={handleUpdateCategory} style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="form-input"
                          style={{ flex: 1 }}
                          required
                        />
                        <input
                          type="color"
                          value={editingCategory.color}
                          onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                          style={{ width: '40px', height: '30px', border: 'none', borderRadius: '4px' }}
                        />
                        <button type="submit" className="btn btn-success" style={{ padding: '5px 10px' }}>
                          保存
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '5px 10px' }}
                          onClick={() => setEditingCategory(null)}
                        >
                          取消
                        </button>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div 
                            className="category-color" 
                            style={{ backgroundColor: category.color, marginRight: '10px' }}
                          />
                          <span className="category-name">{category.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => handleEditCategory(category)}
                          >
                            编辑
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>使用说明</h3>
        <ul style={{ marginTop: '10px', lineHeight: '1.6' }}>
          <li>添加类别：输入类别名称，选择颜色，点击"添加类别"</li>
          <li>编辑类别：点击类别右侧的"编辑"按钮，修改名称或颜色后保存</li>
          <li>删除类别：点击类别右侧的"删除"按钮</li>
          <li>类别颜色：可以选择预设颜色或自定义颜色</li>
          <li>标注时：在图像标注页面选择类别后，点击并拖拽图像来创建标注框</li>
        </ul>
      </div>
    </div>
  );
};

export default CategorySettings;
