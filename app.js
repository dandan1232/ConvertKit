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

const formatOptions = {
  pdf: { label: 'PDF', targets: ['docx'] },
  md: { label: 'Markdown', targets: ['html', 'txt', 'epub'] },
  markdown: { label: 'Markdown', targets: ['html', 'txt', 'epub'] },
  html: { label: 'HTML', targets: ['md', 'txt', 'epub'] },
  htm: { label: 'HTML', targets: ['md', 'txt', 'epub'] },
  txt: { label: '纯文本', targets: ['html', 'md', 'epub'] }
};

const targetLabels = {
  html: 'HTML',
  md: 'Markdown',
  txt: '纯文本',
  docx: 'Word (DOCX)',
  epub: 'EPUB'
};

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
  const source = formatOptions[ext];
  sourceFormat.textContent = source?.label || ext.toUpperCase();

  updateTargetOptions(source?.targets || []);
  targetFormat.disabled = !source;

  if (!source) {
    showStatus(`暂不支持读取 ${ext.toUpperCase()} 文件`, 'error');
  } else {
    hideStatus();
  }

  updateConvertButton();
}

function updateTargetOptions(targets) {
  targetFormat.replaceChildren(new Option('-- 选择格式 --', ''));

  targets.forEach((format) => {
    targetFormat.add(new Option(targetLabels[format], format));
  });
}

// 移除文件
removeFileBtn.addEventListener('click', () => {
  currentFile = null;
  fileInput.value = '';

  uploadZone.hidden = false;
  fileInfo.hidden = true;

  sourceFormat.textContent = '自动检测';
  targetFormat.disabled = true;
  updateTargetOptions([]);

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
  // MVP 支持的转换路径
  const converters = {
    // PDF 相关
    'pdf_to_docx': pdfToDocx,

    // Markdown 相关
    'md_to_html': mdToHtml,
    'markdown_to_html': mdToHtml,
    'md_to_txt': mdToTxt,
    'markdown_to_txt': mdToTxt,
    'md_to_epub': mdToEpub,
    'markdown_to_epub': mdToEpub,

    // HTML 相关
    'html_to_txt': htmlToTxt,
    'htm_to_txt': htmlToTxt,
    'html_to_md': htmlToMd,
    'htm_to_md': htmlToMd,
    'html_to_epub': htmlToEpub,
    'htm_to_epub': htmlToEpub,

    // 纯文本相关
    'txt_to_html': txtToHtml,
    'txt_to_md': txtToMd,
    'txt_to_epub': txtToEpub
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
    const input = sourceExt === 'pdf' ? file : await readFileAsText(file);
    const converted = await converter(input);
    let blob;

    // EPUB 和 DOCX 转换已经返回 Blob，其他格式需要创建 Blob
    if (targetExt === 'epub' || targetExt === 'docx') {
      blob = converted;
    } else {
      blob = new Blob([converted], { type: getMimeType(targetExt) });
    }

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

// PDF → DOCX
async function pdfToDocx(file) {
  if (typeof pdfjsLib === 'undefined' || typeof docx === 'undefined') {
    throw new Error('转换组件加载失败，请检查网络后刷新页面');
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const paragraphs = [];
  let extractedTextLength = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const lines = groupPdfTextItems(textContent.items);

    lines.forEach((line, lineIndex) => {
      extractedTextLength += line.trim().length;
      paragraphs.push(new docx.Paragraph({
        children: [new docx.TextRun(line || ' ')],
        pageBreakBefore: pageNumber > 1 && lineIndex === 0,
        spacing: { after: 120 }
      }));
    });
  }

  if (extractedTextLength === 0) {
    throw new Error('未检测到可提取文字；扫描件 PDF 需要先进行 OCR 文字识别');
  }

  const document = new docx.Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  return await docx.Packer.toBlob(document);
}

function groupPdfTextItems(items) {
  const lines = [];
  let currentLine = '';
  let currentY = null;
  let lastEndX = null;

  const pushLine = () => {
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    currentLine = '';
    lastEndX = null;
  };

  items.forEach((item) => {
    const text = item.str || '';
    const x = item.transform?.[4] || 0;
    const y = item.transform?.[5] || 0;
    const startsNewLine = currentY !== null && Math.abs(y - currentY) > 2;

    if (startsNewLine) {
      pushLine();
    }

    if (currentLine && lastEndX !== null && x - lastEndX > 2) {
      currentLine += ' ';
    }

    currentLine += text;
    currentY = y;
    lastEndX = x + (item.width || 0);

    if (item.hasEOL) {
      pushLine();
      currentY = null;
    }
  });

  pushLine();
  return lines;
}

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

// ========== EPUB 生成函数 ==========

// Markdown → EPUB
async function mdToEpub(markdown) {
  const html = mdToHtml(markdown);
  return await generateEpub('转换文档', html);
}

// HTML → EPUB
async function htmlToEpub(html) {
  return await generateEpub('转换文档', html);
}

// TXT → EPUB
async function txtToEpub(text) {
  const html = txtToHtml(text);
  return await generateEpub('转换文档', html);
}

// EPUB 生成核心
async function generateEpub(title, htmlContent) {
  const zip = new JSZip();

  // 1. mimetype 文件（必须是第一个文件，无压缩）
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF').file('container.xml', containerXml);

  // 3. content.opf (包含元数据和清单)
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">convertkit-${Date.now()}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>zh-CN</dc:language>
    <dc:creator>ConvertKit</dc:creator>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>`;
  zip.folder('OEBPS').file('content.opf', contentOpf);

  // 4. toc.xhtml (目录)
  const tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>目录</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>目录</h1>
    <ol>
      <li><a href="content.xhtml">${escapeXml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`;
  zip.folder('OEBPS').file('toc.xhtml', tocXhtml);

  // 5. content.xhtml (实际内容)
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title)}</title>
  <style>
    body {
      font-family: serif;
      line-height: 1.6;
      margin: 1em;
    }
    h1, h2, h3 { margin-top: 1.5em; }
    p { text-indent: 2em; margin: 0.5em 0; }
    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      font-family: monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      overflow-x: auto;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
${extractBodyContent(htmlContent)}
</body>
</html>`;
  zip.folder('OEBPS').file('content.xhtml', contentXhtml);

  // 生成 EPUB 文件
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return blob;
}

// 提取 HTML body 内容
function extractBodyContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  // 如果没有 body 标签，返回整个内容
  return html.replace(/<\/?html[^>]*>/gi, '')
             .replace(/<\/?head[^>]*>/gi, '')
             .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
             .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
             .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
}

// XML 转义
function escapeXml(text) {
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&apos;');
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
