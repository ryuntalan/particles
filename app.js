// Fetch and parse the articles manifest, then render TOC and article content
async function loadArticles() {
  const manifestRes = await fetch('articles/index.json');
  const files = await manifestRes.json();
  const articles = await Promise.all(
    files.map(async (file) => {
      const res = await fetch(`articles/${file}`);
      const text = await res.text();
      return parseMarkdownArticle(text, file);
    })
  );
  // Sort by date descending
  articles.sort((a, b) => (b.date > a.date ? 1 : -1));
  renderTOC(articles);
  renderArticle(articles[0]);
}

function parseMarkdownArticle(md, file) {
  // Extract frontmatter
  const meta = {};
  let content = md;
  const metaMatch = md.match(/^---([\s\S]*?)---/);
  if (metaMatch) {
    content = md.slice(metaMatch[0].length).trim();
    metaMatch[1].split(/\n/).forEach(line => {
      const [k, ...v] = line.split(':');
      if (k && v.length) meta[k.trim()] = v.join(':').trim();
    });
  }
  meta.title = meta.title || 'Untitled';
  meta.description = meta.description || '';
  meta.date = meta.date || '';
  meta.image = meta.image || '';
  meta.file = file;
  return { ...meta, content };
}

function renderTOC(articles) {
  const toc = document.getElementById('toc');
  toc.innerHTML = '';
  articles.forEach((article, idx) => {
    const item = document.createElement('div');
    item.className = 'toc-item' + (idx === 0 ? ' selected' : '');
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', article.title);
    item.addEventListener('click', () => selectArticle(idx, articles));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        selectArticle(idx, articles);
      }
    });
    const thumb = document.createElement('img');
    thumb.className = 'toc-thumbnail';
    thumb.src = article.image || 'https://placehold.co/90x90';
    thumb.alt = article.title;
    const details = document.createElement('div');
    details.className = 'toc-details';
    const title = document.createElement('div');
    title.className = 'toc-title';
    title.textContent = article.title;
    const desc = document.createElement('div');
    desc.className = 'toc-description';
    desc.textContent = article.description;
    const date = document.createElement('div');
    date.className = 'toc-date';
    date.textContent = article.date;
    details.appendChild(title);
    details.appendChild(desc);
    details.appendChild(date);
    item.appendChild(thumb);
    item.appendChild(details);
    toc.appendChild(item);
  });
}

function selectArticle(idx, articles) {
  document.querySelectorAll('.toc-item').forEach((el, i) => {
    if (i === idx) el.classList.add('selected');
    else el.classList.remove('selected');
  });
  renderArticle(articles[idx]);
}

function renderArticle(article) {
  const main = document.getElementById('article');
  main.innerHTML = '';
  const title = document.createElement('h1');
  title.className = 'article-title';
  title.textContent = article.title;
  const date = document.createElement('div');
  date.className = 'article-date';
  date.textContent = article.date;
  const img = document.createElement('img');
  img.className = 'article-image';
  img.src = article.image || 'https://placehold.co/800x240';
  img.alt = article.title;
  const content = document.createElement('div');
  content.className = 'article-content';
  content.innerHTML = marked.parse(article.content);
  main.appendChild(title);
  main.appendChild(date);
  main.appendChild(img);
  main.appendChild(content);
}

// Load marked.js for markdown parsing
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
script.onload = loadArticles;
document.head.appendChild(script); 