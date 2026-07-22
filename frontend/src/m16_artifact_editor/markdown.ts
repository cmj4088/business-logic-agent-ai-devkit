/** M16 产出物编辑器 — 简易 Markdown 渲染器 */

/**
 * 将 Markdown 文本渲染为 HTML 字符串。
 * 支持常见 Markdown 语法：标题、粗体、斜体、链接、列表、表格、代码块、引用、分割线。
 */
export function renderMarkdown(markdown: string): string {
  let html = markdown;

  // 转义 HTML 特殊字符（防止 XSS，但保留已有的 HTML 标签）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 代码块（```code```）
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const langLabel = lang ? `<span class="text-xs text-slate-400">${lang}</span>` : '';
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="code-block-header">${langLabel}</div><pre><code>${escapedCode.trim()}</code></pre>`;
  });

  // 行内代码（`code`）
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 表格
  html = html.replace(/(\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)*)/g, (tableBlock) => {
    const rows = tableBlock.trim().split('\n');
    let tableHtml = '<table class="md-table">';
    rows.forEach((row, idx) => {
      const cells = row.split('|').filter((c) => c.trim() !== '');
      const tag = idx === 0 ? 'th' : 'td';
      const cellHtml = cells.map((cell) => `<${tag}>${cell.trim()}</${tag}>`).join('');
      tableHtml += `<tr>${cellHtml}</tr>`;
      // 跳过分隔行
      if (idx === 0) {
        const nextRow = rows[1];
        if (nextRow && /^[\|:\- ]+$/.test(nextRow.replace(/\|/g, '').trim())) {
          return;
        }
      }
    });
    tableHtml += '</table>';
    return tableHtml;
  });

  // 处理第二行表格分隔符
  html = html.replace(/^\|[-:| ]+\|$/gm, '');

  // 标题（# ## ### 等）
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 链接 [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // 图片 ![alt](url)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="md-image" />',
  );

  // 无序列表
  html = html.replace(/^(\s*)[-*]\s+(.+)$/gm, (_match, indent: string, content: string) => {
    const level = Math.floor(indent.length / 2);
    const paddingLeft = level * 20;
    return `<li class="md-li" style="padding-left: ${paddingLeft}px">${content}</li>`;
  });

  // 有序列表
  html = html.replace(/^(\s*)\d+\.\s+(.+)$/gm, (_match, indent: string, content: string) => {
    const level = Math.floor(indent.length / 2);
    const paddingLeft = level * 20;
    return `<li class="md-li-ordered" style="padding-left: ${paddingLeft}px">${content}</li>`;
  });

  // 将连续的 <li> 包裹在 <ul> 中
  html = html.replace(/((?:<li class="md-li"[^>]*>.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');
  html = html.replace(/((?:<li class="md-li-ordered"[^>]*>.*<\/li>\n?)+)/g, '<ol class="md-ol">$1</ol>');

  // 引用
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="md-blockquote"><p>$1</p></blockquote>');

  // 合并连续的 blockquote
  html = html.replace(
    /(?:<\/blockquote>\n?<blockquote class="md-blockquote">)/g,
    '\n',
  );

  // 分割线
  html = html.replace(/^(---|\*\*\*|___)$/gm, '<hr class="md-hr" />');

  // 段落：将剩余的连续非空非 HTML 行包裹在 <p> 中
  // 先处理已经是 HTML 标签的行，跳过它们
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let paragraphBuffer: string[] = [];

  function flushParagraph(): void {
    if (paragraphBuffer.length > 0) {
      processedLines.push(`<p class="md-p">${paragraphBuffer.join('\n')}</p>`);
      paragraphBuffer = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      flushParagraph();
      processedLines.push('');
    } else if (/^<\/?(h[1-4]|table|tr|th|td|pre|ul|ol|li|blockquote|hr|div|img|p|code|strong|em|a)/.test(trimmed) || /^<code class="inline-code">/.test(trimmed)) {
      flushParagraph();
      processedLines.push(line);
    } else {
      paragraphBuffer.push(line);
    }
  }
  flushParagraph();

  html = processedLines.join('\n');

  return html;
}