let articlesGlobal = [];
let currentArticleIdx = 0;
let isMobile = window.matchMedia('(max-width: 900px)').matches;
let mobileView = 'toc'; // 'toc' or 'article'

window.addEventListener('resize', () => {
  const nowMobile = window.matchMedia('(max-width: 900px)').matches;
  if (nowMobile !== isMobile) {
    isMobile = nowMobile;
    if (isMobile) {
      mobileView = 'toc';
      renderMobileView();
    } else {
      renderTOC(articlesGlobal);
      renderArticle(articlesGlobal[currentArticleIdx]);
      document.getElementById('toc').style.display = '';
      document.getElementById('article').style.display = '';
      renderHeader();
    }
  }
});

function renderHeader() {
  const header = document.querySelector('.header');
  const headerInner = document.querySelector('.header-inner');
  header.classList.remove('header-article');
  headerInner.innerHTML = '';
  if (isMobile && mobileView === 'article') {
    // Article view: show back button, hide logo, secondary-bg
    header.classList.add('header-article');
    const back = document.createElement('div');
    back.className = 'header-back';
    back.tabIndex = 0;
    back.setAttribute('role', 'button');
    back.setAttribute('aria-label', 'Back to Table of Contents');
    back.addEventListener('click', () => {
      mobileView = 'toc';
      renderMobileView();
    });
    back.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        mobileView = 'toc';
        renderMobileView();
      }
    });
    // Add Material Icon
    const icon = document.createElement('span');
    icon.className = 'material-symbols-rounded';
    icon.style.fontWeight = 300;
    icon.style.fontSize = '2rem';
    icon.style.marginRight = '2px';
    icon.textContent = 'chevron_left';
    back.appendChild(icon);
    const label = document.createElement('span');
    label.textContent = 'Back';
    back.appendChild(label);
    headerInner.appendChild(back);
  } else {
    // TOC view or desktop: show logo and title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'header-title';
    const logo = document.createElement('img');
    logo.src = 'images/logo.png';
    logo.alt = 'Particles Logo';
    logo.className = 'header-logo';
    titleDiv.appendChild(logo);
    const span = document.createElement('span');
    span.textContent = 'Particles';
    titleDiv.appendChild(span);
    headerInner.appendChild(titleDiv);
  }
}

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
  // Separate Welcome article
  const welcomeIdx = articles.findIndex(a => a.title.trim().toLowerCase() === 'welcome to particles');
  let welcomeArticle = null;
  if (welcomeIdx !== -1) {
    welcomeArticle = articles.splice(welcomeIdx, 1)[0];
  }
  // Sort the rest by date descending
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (welcomeArticle) {
    articles.unshift(welcomeArticle);
  }
  articlesGlobal = articles;
  if (isMobile) {
    renderMobileView();
  } else {
    renderTOC(articles);
    renderArticle(articles[0]);
    renderHeader();
  }
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
  meta.caption = meta.caption || '';
  meta.file = file;
  return { ...meta, content };
}

function renderMobileView() {
  const toc = document.getElementById('toc');
  const article = document.getElementById('article');
  if (mobileView === 'toc') {
    toc.style.display = '';
    article.style.display = 'none';
    renderTOC(articlesGlobal, true);
  } else {
    toc.style.display = 'none';
    article.style.display = '';
    renderArticle(articlesGlobal[currentArticleIdx], true);
  }
  renderHeader();
}

function renderTOC(articles, mobile = false) {
  const toc = document.getElementById('toc');
  toc.innerHTML = '';
  articles.forEach((article, idx) => {
    const item = document.createElement('div');
    item.className = 'toc-item' + (idx === currentArticleIdx ? ' selected' : '');
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', article.title);
    item.addEventListener('click', () => {
      currentArticleIdx = idx;
      if (isMobile) {
        mobileView = 'article';
        renderMobileView();
      } else {
        selectArticle(idx, articles);
      }
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        currentArticleIdx = idx;
        if (isMobile) {
          mobileView = 'article';
          renderMobileView();
        } else {
          selectArticle(idx, articles);
        }
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
    details.appendChild(title);
    details.appendChild(desc);
    // Only show date if not Welcome article
    if (article.title.trim().toLowerCase() !== 'welcome to particles') {
      const date = document.createElement('div');
      date.className = 'toc-date';
      date.textContent = article.date;
      details.appendChild(date);
    }
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

function renderArticle(article, mobile = false) {
  const main = document.getElementById('article');
  main.innerHTML = '';
  const title = document.createElement('h1');
  title.className = 'article-title';
  title.textContent = article.title;
  // Only show date if not Welcome article
  let showDate = article.title.trim().toLowerCase() !== 'welcome to particles';
  if (showDate) {
    const date = document.createElement('div');
    date.className = 'article-date';
    date.textContent = article.date;
    main.appendChild(date);
  }
  main.appendChild(title);
  const img = document.createElement('img');
  img.className = 'article-image';
  img.src = article.image || 'https://placehold.co/800x240';
  img.alt = article.title;
  main.appendChild(img);
  // Add caption if present
  if (article.caption) {
    const caption = document.createElement('div');
    caption.className = 'article-caption';
    caption.innerHTML = marked.parseInline(article.caption);
    // Make all links open in a new tab
    caption.querySelectorAll('a').forEach(a => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    main.appendChild(caption);
  }
  const content = document.createElement('div');
  content.className = 'article-content';
  content.innerHTML = marked.parse(article.content);
  main.appendChild(content);
}

// Load marked.js for markdown parsing
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
script.onload = loadArticles;
document.head.appendChild(script); 