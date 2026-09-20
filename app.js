// ConvertKit - 文件格式转换核心逻辑

// DOM 元素
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const removeFileBtn = document.getElementById('remove-file');
const sourceFormat = document.getElementById('source-format');
const targetFormat = document.getElementById('target-format');
const convertButton = document.getElementById('convert-button');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const statusMessage = document.getElementById('status-message');

let currentFile = null;

// 文件大小格式化
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 获取文件扩展名
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

// 点击上传区域
uploadZone.addEventListener('click', () => {
  fileInput.click();
});

// 阻止默认拖拽行为
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// 拖拽高亮
['dragenter', 'dragover'].forEach(eventName => {
  uploadZone.addEventListener(eventName, () => {
    uploadZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  uploadZone.addEventListener(eventName, () => {
    uploadZone.classList.remove('dragover');
  });
});

// 处理拖拽文件
uploadZone.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

// 处理文件选择
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// 处理文件
function handleFile(file) {
  currentFile = file;

  // 显示文件信息
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);

  // 隐藏上传区，显示文件信息
  uploadZone.hidden = true;
  fileInfo.hidden = false;

  // 检测源格式
  const ext = getFileExtension(file.name);
  const formatMap = {
    'pdf': 'PDF',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'docx': 'Word (DOCX)',
    'doc': 'Word (DOC)',
    'epub': 'EPUB',
    'html': 'HTML',
    'htm': 'HTML',
    'txt': '纯文本'
  };

  sourceFormat.textContent = formatMap[ext] || ext.toUpperCase();

  // 启用格式选择
  targetFormat.disabled = false;
  targetFormat.value = '';
  updateConvertButton();
}

// 移除文件
removeFileBtn.addEventListener('click', () => {
  currentFile = null;
  fileInput.value = '';

  uploadZone.hidden = false;
  fileInfo.hidden = true;

  sourceFormat.textContent = '自动检测';
  targetFormat.disabled = true;
  targetFormat.value = '';

  hideStatus();
  updateConvertButton();
});

// 格式选择变化
targetFormat.addEventListener('change', updateConvertButton);

// 更新转换按钮状态
function updateConvertButton() {
  convertButton.disabled = !(currentFile && targetFormat.value);
}

// 转换按钮点击
convertButton.addEventListener('click', async () => {
  if (!currentFile || !targetFormat.value) return;

  const sourceExt = getFileExtension(currentFile.name);
  const targetExt = targetFormat.value;

  // 检查是否是相同格式
  if (sourceExt === targetExt) {
    showStatus('源格式和目标格式相同，无需转换', 'error');
    return;
  }

  // 显示进度
  showProgress('正在转换...');
  convertButton.disabled = true;

  try {
    const result = await convertFile(currentFile, sourceExt, targetExt);

    if (result.success) {
      downloadFile(result.blob, result.filename);
      showStatus('✅ 转换成功！文件已下载', 'success');
    } else {
      showStatus(`❌ ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ 转换失败: ${error.message}`, 'error');
    console.error('转换错误:', error);
  } finally {
    hideProgress();
    updateConvertButton();
  }
});

// 核心转换函数
async function convertFile(file, sourceExt, targetExt) {
  const text = await readFileAsText(file);

  // MVP 支持的转换路径
  const converters = {
    // Markdown 相关
    'md_to_html': mdToHtml,
    'markdown_to_html': mdToHtml,
    'md_to_txt': mdToTxt,
    'markdown_to_txt': mdToTxt,

    // HTML 相关
    'html_to_txt': htmlToTxt,
    'htm_to_txt': htmlToTxt,
    'html_to_md': htmlToMd,
    'htm_to_md': htmlToMd,

    // 纯文本相关
    'txt_to_html': txtToHtml,
    'txt_to_md': txtToMd,
  };

  const converterKey = `${sourceExt}_to_${targetExt}`;
  const converter = converters[converterKey];

  if (!converter) {
    return {
      success: false,
      error: `暂不支持 ${sourceExt.toUpperCase()} → ${targetExt.toUpperCase()} 转换`
    };
  }

  try {
    const converted = converter(text);
    const blob = new Blob([converted], { type: getMimeType(targetExt) });
    const filename = file.name.replace(/\.[^.]+$/, `.${targetExt}`);

    return { success: true, blob, filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 读取文件为文本
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'UTF-8');
  });
}

// 获取 MIME 类型
function getMimeType(ext) {
  const mimeTypes = {
    'html': 'text/html',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'epub': 'application/epub+zip'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ========== 转换函数 ==========

// Markdown → HTML
function mdToHtml(markdown) {
  // 简单的 Markdown 解析（MVP 版本）
  let html = markdown;

  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // 代码块
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 列表
  html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // 段落
  html = html.split('\n\n').map(para => {
    if (para.match(/^<[h|u|p]/)) return para;
    return `<p>${para}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>转换文档</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 { margin-top: 24px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    a { color: #0066cc; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

// Markdown → TXT
function mdToTxt(markdown) {
  let text = markdown;

  // 移除 Markdown 语法
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/___(.+?)___/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[图片: $2]');
  text = text.replace(/```[^`]+```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^#+\s+/gm, '');

  return text.trim();
}

// HTML → TXT
function htmlToTxt(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

// HTML → Markdown
function htmlToMd(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let markdown = '';

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const content = Array.from(node.childNodes).map(processNode).join('');

      switch (tag) {
        case 'h1': return `# ${content}\n\n`;
        case 'h2': return `## ${content}\n\n`;
        case 'h3': return `### ${content}\n\n`;
        case 'h4': return `#### ${content}\n\n`;
        case 'h5': return `##### ${content}\n\n`;
        case 'h6': return `###### ${content}\n\n`;
        case 'p': return `${content}\n\n`;
        case 'strong':
        case 'b': return `**${content}**`;
        case 'em':
        case 'i': return `*${content}*`;
        case 'a': return `[${content}](${node.href})`;
        case 'img': return `![${node.alt || ''}](${node.src})`;
        case 'code': return `\`${content}\``;
        case 'pre': return `\`\`\`\n${content}\n\`\`\`\n\n`;
        case 'ul':
        case 'ol': return content + '\n';
        case 'li': return `- ${content}\n`;
        case 'br': return '\n';
        default: return content;
      }
    }

    return '';
  }

  return processNode(tempDiv).trim();
}

// TXT → HTML
function txtToHtml(text) {
  const paragraphs = text.split('\n\n').map(p => {
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>转换文档</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
  </style>
</head>
<body>
${paragraphs}
</body>
</html>`;
}

// TXT → Markdown
function txtToMd(text) {
  // 纯文本转 Markdown，保持原样但添加换行
  return text;
}

// 下载文件
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 显示进度
function showProgress(text) {
  progressText.textContent = text;
  progressContainer.hidden = false;
  hideStatus();
}

// 隐藏进度
function hideProgress() {
  progressContainer.hidden = true;
}

// 显示状态消息
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;
  hideProgress();
}

// 隐藏状态消息
function hideStatus() {
  statusMessage.hidden = true;
}
