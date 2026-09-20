# ConvertKit

🔄 在线文件格式转换工具 - 快速、安全、免费

## 特性

- ✅ **纯前端处理** - 所有转换在浏览器本地完成，文件不上传服务器
- 🚀 **即时转换** - 无需等待，秒级完成
- 🎯 **简单易用** - 拖拽上传或点击选择，一键转换
- 💰 **完全免费** - 无需注册，无限次使用
- 📱 **响应式设计** - 支持桌面和移动设备

## 支持的格式

### 当前支持的转换

| 源格式 | 目标格式 |
|--------|----------|
| Markdown (.md) | HTML, TXT, EPUB |
| HTML (.html/.htm) | Markdown, TXT, EPUB |
| TXT (.txt) | HTML, Markdown, EPUB |

## 快速开始

### 在线使用

直接打开 `index.html` 文件即可使用，无需安装任何依赖。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/dandan1232/ConvertKit.git
cd ConvertKit

# 使用任意 HTTP 服务器运行
python -m http.server 8080
# 或
npx serve

# 在浏览器中打开
open http://localhost:8080
```

## 使用方法

1. **上传文件** - 拖拽文件到上传区域，或点击选择文件
2. **选择格式** - 在下拉菜单中选择目标格式
3. **开始转换** - 点击"开始转换"按钮
4. **下载文件** - 转换完成后自动下载

## 技术栈

- **HTML5 / CSS3** - 现代响应式界面
- **Vanilla JavaScript** - 无框架依赖
- **JSZip** - EPUB 文件生成

## 路线图

- [ ] PDF 文本提取 (PDF → TXT)
- [ ] Word 文档支持 (DOCX ↔ 其他格式)
- [ ] 批量转换功能
- [ ] 转换历史记录
- [ ] 自定义 EPUB 元数据
- [ ] 更强大的 Markdown 解析

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

Created by dandan1232
