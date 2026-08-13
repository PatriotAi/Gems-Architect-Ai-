# 💎 Gems Architect INTENT AI+ (2026 Edition)

Платформа проектування, моделювання та безпечного розгортання Агентного ШІ (**Custom Gems**) на базі **Google Gemini 3.5 & 3.1 Pro/Flash**, підтриманням **LLM Guardrails**, стандарту **EU AI Act / GDPR 2026**, **Media Analytics** та **Creative Studio**.

---

## 🌟 Основні Можливості

- 🧠 **Конструктор Логіки та Навичок (Logic & Skills Tree)**:
  - Візуальне моделювання дерева мислення Gem.
  - Автоматична генерація системних системних промптів та інструкцій.
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

## 🚀 Швидкий Старт

### 1. Клонування репозиторію
```bash
git clone https://github.com/YOUR_USERNAME/gems-architect-intent-ai.git
cd gems-architect-intent-ai
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
*(Отримати ключ безкоштовно можна в [Google AI Studio](https://aistudio.google.com/))*

### 4. Запуск у режимі розробки
```bash
npm run dev
```
Додаток буде доступний за адресою: `http://localhost:3000`

---

## 🛠️ Стек Технологій

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Framer Motion)
- **AI SDK**: `@google/genai` (Google Gen AI SDK v1)
- **Icons**: Lucide React
- **Database & Auth**: Firebase Firestore & Firebase Auth

---

## 📦 Збірка для Продакшену

```bash
npm run build
```
Згенеровані статичні файли будуть у папці `dist/`. Проект можна безкоштовно розгорнути на **Vercel**, **Netlify**, **Cloudflare Pages** або **GitHub Pages**.

---

## 📄 Ліцензія
MIT License
