// js/app.js
import { ApiError } from './api.js';
import { login, logout, bootstrap } from './auth.js';
import { listArticles } from './articles.js';

const loginForm = document.querySelector('#login-form');
const loginSection = document.querySelector('#login-section');
const userNameEl = document.querySelector('#user-name');
const logoutBtn = document.querySelector('#logout-btn');
const articlesList = document.querySelector('#articles-list');

// ============================================================
// 1. Проверяем сессию при загрузке страницы
// ============================================================
let currentUser = null;

try {
  currentUser = await bootstrap();
  if (currentUser) {
    userNameEl.textContent = '👤 ' + (currentUser.display_name || currentUser.username);
    logoutBtn.hidden = false;
    loginSection.hidden = true;
  }
} catch (err) {
  console.warn('Не удалось восстановить сессию:', err.message);
}

// ============================================================
// 2. Форма входа
// ============================================================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(loginForm);
  const errorEl = loginForm.querySelector('[data-error-for="form"]');
  errorEl.textContent = '';

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Вход…';

  try {
    await login(data.get('email'), data.get('password'));
    location.reload();
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'invalid_credentials') {
        errorEl.textContent = 'Неверный email или пароль';
      } else if (err.code === 'rate_limited') {
        errorEl.textContent = 'Слишком много попыток. Подождите минуту.';
      } else {
        errorEl.textContent = err.message || 'Ошибка входа';
      }
    } else {
      errorEl.textContent = 'Не удалось связаться с сервером';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Войти';
  }
});

// ============================================================
// 3. Выход
// ============================================================
logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  await logout();
  location.reload();
});

// ============================================================
// 4. Загружаем список статей
// ============================================================
async function loadArticles() {
  articlesList.innerHTML = '<div class="loading">Загрузка статей…</div>';

  try {
    const page = await listArticles({ page_size: 10 });

    if (!page.items || page.items.length === 0) {
      articlesList.innerHTML = '<div class="empty">Статей пока нет.</div>';
      return;
    }

    articlesList.innerHTML = '';

    for (const article of page.items) {
      const card = document.createElement('article');
      card.className = 'article-card';
      card.addEventListener('click', () => {
        // можно потом сделать переход на страницу статьи
        alert('Открыть статью: ' + article.title);
      });

      const title = document.createElement('h3');
      title.className = 'article-card__title';
      title.textContent = article.title;

      const desc = document.createElement('p');
      desc.className = 'article-card__desc';
      desc.textContent = article.description || '';

      const meta = document.createElement('div');
      meta.className = 'article-card__meta';

      const author = document.createElement('span');
      author.textContent = '👤 ' + (article.author.display_name || article.author.username);

      const views = document.createElement('span');
      views.textContent = '👁 ' + article.views;

      const likes = document.createElement('span');
      likes.textContent = '❤ ' + article.likes;

      meta.append(author, views, likes);
      card.append(title, desc, meta);
      articlesList.append(card);
    }
  } catch (err) {
    articlesList.innerHTML = '<div class="empty">Ошибка загрузки статей: ' +
      (err.message || 'неизвестная ошибка') + '</div>';
  }
}

loadArticles();