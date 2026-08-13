# 💎 Gems Architect INTENT AI+ (2026 Edition)

Платформа проектування, моделювання та безпечного розгортання Агентного ШІ (**Custom Gems**) на базі **Google Gemini 3.5 & 3.1 Pro/Flash**, підтриманням **LLM Guardrails**, стандарту **EU AI Act / GDPR 2026**, **Media Analytics** та **Creative Studio**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PatriotAi/Gems-Architect-Ai-&env=VITE_GEMINI_API_KEY)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/PatriotAi/Gems-Architect-Ai-)

---

## 🌐 Як відкрити та застосувати у веб-браузері

### Варіант 1: Запуск у 1 клік через Vercel / Netlify (Рекомендовано)
1. Натисніть кнопку **[Deploy with Vercel]** вище.
2. Авторизуйтесь у Vercel за допомогою вашого GitHub-акаунту.
3. Додайте змінну середовища: `VITE_GEMINI_API_KEY` (ваш безкоштовний ключ з [Google AI Studio](https://aistudio.google.com/)).
4. Натисніть **Deploy** — за 30 секунд додаток буде готовий і матиме власне публічне веб-посилання!

### Варіант 2: Введення API ключа прямо в інтерфейсі програми
Якщо ви відкриваєте розгорнуту версію без попередньо налаштованого сервера, ви можете просто натиснути кнопку **🔑 API Key** у правому верхньому куті веб-додатку та ввести свій Gemini API Key. Ключ безпечно зберігається у вашому локальному браузері (`localStorage`).

---

## 🌟 Основні Можливості

- 🧠 **Конструктор Логіки та Навичок (Logic & Skills Tree)**:
  - Візуальне моделювання дерева мислення Gem.
  - Автоматична генерація системних інструкцій.
  - Автозбереження стану у `localStorage` (із запобіганням втрати даних при перезавантаженні).

- 🛡️ **Compliance & Guardrails Studio (Специфікація 2026)**:
  - **NeMo / LLM Guardrails**: Захист від Prompt Injection, Jailbreak атак, маскування PII (персональних даних).
  - **EU AI Act Article 50 & GDPR Art. 22**: Автоматичний дисклеймер прозорості та перевірка вимог регулювання ЄС.
  - **4C QA Scorecard**: Автоматична оцінка діалогів асистента (*Communication, Customer Connection, Compliance, Content/FCR*).
  - **Warm Handoff Protocol**: Формування структурованого JSON-пейлоаду для передачі контексту операторові (Human-in-the-Loop).

- 🔍 **Media-Analyst Studio**:
  - Розшифровка та аналіз аудіо, відео, документів та зображень за допомогою сучасної мультимодальності Gemini.
  - Витяг ключових думок, створення підсумків та аналітичних звітів.

- 🎨 **Creative Studio**:
  - Генерація маркетингових матеріалів, текстів та банерів.
  - Пряма інтеграція контексту сформованого Gem.

- ☁️ **Хмарне Збереження (Firebase Firestore)**:
  - Синхронізація готових Gems у хмарну бібліотеку Firestore.
  - Перегляд та швидке завантаження збережених Gems.

---

## 🚀 Локальний Запуск (Для розробників)

### 1. Клонування репозиторію
```bash
git clone https://github.com/PatriotAi/Gems-Architect-Ai-.git
cd Gems-Architect-Ai-
```

### 2. Встановлення залежностей
```bash
npm install
```

### 3. Налаштування змінних середовища
Створіть файл `.env` на основі `.env.example`:
```bash
cp .env.example .env
```
Додайте свій API ключ Gemini у `.env`:
```env
GEMINI_API_KEY="AIzaSy..."
VITE_GEMINI_API_KEY="AIzaSy..."
```

### 4. Запуск локального сервера
```bash
npm run dev
```
Відкрийте у браузері: `http://localhost:3000`

---

## 🛠️ Стек Технологій

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Framer Motion)
- **AI SDK**: `@google/genai` (Google Gen AI SDK v1)
- **Icons**: Lucide React
- **Database & Auth**: Firebase Firestore & Firebase Auth

---

## 📄 Ліцензія
MIT License

