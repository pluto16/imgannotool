import React, { useRef } from 'react';
import { useImages } from '../context/ImageContext';

const FileUpload = () => {
  const fileInputRef = useRef(null);
  const { setImages, setLoading, setError } = useImages();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('请选择JSON文件');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // 假设JSON文件包含图像路径数组
      let imagePaths = [];
      
      if (Array.isArray(jsonData)) {
        imagePaths = jsonData;
      } else if (jsonData.images && Array.isArray(jsonData.images)) {
        imagePaths = jsonData.images;
      } else if (jsonData.paths && Array.isArray(jsonData.paths)) {
        imagePaths = jsonData.paths;
      } else {
        // 尝试从对象中提取路径
        const paths = Object.values(jsonData).filter(value => 
          typeof value === 'string' && value.toLowerCase().endsWith('.png')
        );
        imagePaths = paths;
      }

      if (imagePaths.length === 0) {
        setError('JSON文件中没有找到PNG图像路径');
        return;
      }

      // 创建图像对象数组
      const images = imagePaths.map((path, index) => ({
        id: index,
        path: path,
        name: path.split('/').pop() || path.split('\\').pop() || `image_${index}`,
        annotations: []
      }));

      setImages(images);
      
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setError('JSON文件格式错误: ' + error.message);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <div className="file-input">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button 
          className="btn btn-primary btn-sm"
          onClick={handleButtonClick}
        >
          选择JSON文件
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
