# PNG图像标注工具

一个基于React的图像标注工具，支持PNG图像的矩形框标注功能。

## 功能特性

- 📁 JSON文件上传：解析包含PNG图像路径的JSON文件
- 🖼️ 图像列表显示：左侧显示所有上传的图像缩略图
- 🎯 图像标注：右侧显示选中图像，支持矩形框标注
- 🏷️ 类别管理：独立的类别设置页面，支持自定义类别和颜色
- 💾 数据持久化：类别设置自动保存到本地存储
- 📤 标注导出：支持导出单个图像的标注数据为JSON文件

## 安装和运行

### 前置要求

- Node.js (版本 14 或更高)
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

## 使用方法

### 1. 上传JSON文件

在主页面上方点击"选择JSON文件"按钮，上传包含PNG图像路径的JSON文件。

支持的JSON格式示例：

```json
// 格式1：直接数组
["path/to/image1.png", "path/to/image2.png"]

// 格式2：包含images字段
{
  "images": ["path/to/image1.png", "path/to/image2.png"]
}

// 格式3：包含paths字段
{
  "paths": ["path/to/image1.png", "path/to/image2.png"]
}
```

### 2. 设置标注类别

点击页面顶部的"类别设置"链接，进入类别管理页面：

- 添加新类别：输入类别名称，选择颜色，点击"添加类别"
- 编辑类别：点击类别右侧的"编辑"按钮
- 删除类别：点击类别右侧的"删除"按钮

### 3. 进行图像标注

1. 在左侧图像列表中选择要标注的图像
2. 在右侧标注区域选择标注类别
3. 在图像上点击并拖拽创建矩形标注框
4. 点击"显示标注列表"查看所有标注
5. 点击"导出标注"下载标注数据

## 项目结构

```
src/
├── components/          # React组件
│   ├── FileUpload.js   # 文件上传组件
│   ├── ImageList.js    # 图像列表组件
│   ├── ImageAnnotation.js # 图像标注组件
│   └── CategorySettings.js # 类别设置组件
├── context/            # React Context
│   ├── ImageContext.js # 图像数据管理
│   └── CategoryContext.js # 类别数据管理
├── App.js             # 主应用组件
├── index.js           # 应用入口
└── index.css          # 全局样式
```

## 技术栈

- **React 18** - 用户界面框架
- **React Router** - 路由管理
- **React Context** - 状态管理
- **Canvas API** - 图像标注绘制
- **LocalStorage** - 数据持久化

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 注意事项

1. 图像文件路径需要是有效的URL或相对路径
2. 标注数据仅保存在浏览器内存中，刷新页面会丢失
3. 建议定期导出标注数据作为备份
4. 类别设置会自动保存到浏览器本地存储

## 开发说明

### 添加新功能

1. 在 `src/components/` 目录下创建新组件
2. 在 `src/context/` 目录下管理相关状态
3. 更新 `src/App.js` 中的路由配置

### 自定义样式

修改 `src/index.css` 文件中的CSS样式，支持响应式设计。

## 许可证

MIT License
