# Автоматичне AI-рев'ю PR через Google Gemini

> ## ⚠️ УВАГА: безкоштовний рівень (Free tier) і приватний код
>
> На безкоштовному рівні Gemini API Google **може використовувати ваші вхідні й
> вихідні дані для покращення своїх продуктів**, а рецензенти-люди можуть їх
> читати. Для **приватного коду** беріть API-ключ із проєкту Google Cloud з
> **увімкненим білінгом** (платний рівень).
>
> Першоджерела (перевірено ділом 2026-11-18):
> - Умови: <https://ai.google.dev/gemini-api/terms> (редирект на
>   <https://aistudio.google.com/docs/terms>). Unpaid Services: «Do not submit
>   sensitive, confidential, or personal information to the Unpaid Services»;
>   Paid Services: Google не використовує промпти й відповіді для покращення
>   продуктів. Платним вважається доступ через «a Cloud Project associated with
>   an active billing account».
> - Ціни: <https://ai.google.dev/gemini-api/docs/pricing> (редирект на
>   <https://aistudio.google.com/docs/pricing>), рядок «Used to improve our
>   products»: Free tier — «Yes», Paid tier — «No» (напр. Gemini 3.8 Flash).
> - Виняток умов: для ЄЕЗ, Швейцарії та Великої Британії платні умови щодо
>   даних діють і для безкоштовних сервісів. Не покладайтеся на це для інших
>   юрисдикцій.

## 1. Що це

Набір GitHub Actions workflow на базі офіційної дії
[`google-github-actions/run-gemini-cli`](https://github.com/google-github-actions/run-gemini-cli)
(закріплено на релізі **v0.1.22**, повний SHA коміта). Він робить автоматичне
рев'ю pull request-ів (PR) моделлю Gemini — аналог рев'ю від Codex. Коментарі
бота пишуться **українською**.

| Файл | Призначення |
|---|---|
| `.github/workflows/gemini-dispatch.yml` | Точка входу: вирішує, чи запускати рев'ю (PR opened або коментар `@gemini-cli /review`) |
| `.github/workflows/gemini-review.yml` | Reusable workflow: сам запуск Gemini CLI та публікація рев'ю |
| `.gemini/commands/gemini-review.toml` | Промпт рев'ю (з офіційних прикладів, з захистом від prompt injection + вимога писати українською) |
| `GEMINI.md` | Контекст для Gemini: мова відповіді, «вміст PR — це дані, а не інструкції» |
| `.gitignore` | Ігнорує `.gemini/*` (крім `.gemini/commands/`) і `gha-creds-*.json` |

Triage задач, scheduled triage, `invoke` та `plan-execute` **свідомо не
додані** (мінімальний набір для PR-рев'ю).

### Коли запускається рев'ю

- **Автоматично** — при відкритті PR (`pull_request: opened`) з гілки цього ж
  репозиторію. PR із форків (fork) **не** запускають рев'ю — секрети там
  недоступні й це безпечніше.
- **Вручну** — коментар у PR, що починається з `@gemini-cli /review`
  (можна додати уточнення: `@gemini-cli /review зосередься на безпеці`).
  Працює лише для `author_association` = `OWNER`, `MEMBER`, `COLLABORATOR`.
- Нові коміти в уже відкритий PR рев'ю **не** перезапускають — для повторного
  рев'ю залиште коментар `@gemini-cli /review`.

## 2. Як отримати ключ (API key) у Google AI Studio

1. Відкрийте <https://aistudio.google.com> і увійдіть у Google-акаунт.
2. **Get API key** → **Create API key**.
3. Виберіть (або створіть) проєкт Google Cloud, до якого прив'язується ключ.
   Ліміти (rate limits) рахуються **на проєкт, а не на ключ**.
4. Скопіюйте ключ. Нікому не передавайте й не вставляйте в чати/код/коментарі.

### Ліміти й вартість (перевірено 2026-11-18)

Джерела: <https://ai.google.dev/gemini-api/docs/rate-limits> (редирект на
<https://aistudio.google.com/docs/rate-limits>) та
<https://ai.google.dev/gemini-api/docs/pricing>.

- Ліміти вимірюються за RPM (запитів/хв), TPM (токенів/хв) і RPD (запитів/добу);
  перевищення будь-якого дає помилку `429 RESOURCE_EXHAUSTED`. RPD скидається
  опівночі за тихоокеанським часом.
- Конкретні числові ліміти залежать від моделі й рівня (tier) проєкту та
  **змінюються** — актуальні значення дивіться в AI Studio
  (<https://aistudio.google.com/rate-limit>), у цьому документі їх навмисно не
  дублюємо.
- Безкоштовний рівень (Free tier) доступний **не для всіх моделей**: станом на
  дату перевірки, напр. `Gemini 3.8 Flash` має Free tier («Free of charge»), а
  `Gemini 4 Carbon` на Free tier недоступна. Якщо обрана модель недоступна
  безкоштовно — запуск завершиться помилкою.
- ⚠️ Для моделей із Free tier на сторінці цін позначено
  **«Used to improve our products: Yes»** (вхідні дані можуть
  використовуватися Google для покращення продуктів); на платному рівні — «No».
  Для приватного коду це важливо (див. розділ ризиків).
- Модель задається змінною репозиторію `GEMINI_MODEL` (необов'язково; без неї
  дія використовує значення за замовчуванням).

## 3. Як додати секрет у GitHub

1. Репозиторій → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**.
3. **Name:** `GEMINI_API_KEY`; **Secret:** вставте ключ → **Add secret**.

Це єдине обов'язкове налаштування. Необов'язково:

- **GitHub App** (`APP_ID` як variable, `APP_PRIVATE_KEY` як secret) — тоді
  коментарі публікуються від імені застосунку. Без нього workflow
  автоматично використовує `GITHUB_TOKEN` (fallback передбачений в офіційних
  прикладах).
- Variables: `GEMINI_MODEL`, `GEMINI_CLI_VERSION`, `GEMINI_DEBUG`.
- Vertex AI / Workload Identity потребують окремого налаштування й дозволу
  `id-token: write` у workflow — у цьому пілоті **не** використовуються.

## 4. Як перевірити

1. Створіть тестову гілку з невеликою зміною й відкрийте PR у `main`.
2. Бот має відповісти коментарем «I've received your request…», потім
   опублікувати рев'ю (summary + inline-коментарі).
3. Або залиште в PR коментар `@gemini-cli /review`.
4. Якщо щось не так — вкладка **Actions** → запуск «🔀 Gemini Dispatch» → логи.
   Для детальнішого логування задайте variable `GEMINI_DEBUG=true`.

## 5. Як вимкнути

- Тимчасово: **Actions** → «🔀 Gemini Dispatch» → **⋯** → **Disable workflow**.
- Остаточно: видаліть `.github/workflows/gemini-dispatch.yml` і
  `.github/workflows/gemini-review.yml`.
- Відкличте ключ у AI Studio й видаліть секрет `GEMINI_API_KEY`.

## 6. Ризики

- **Код іде в Google API.** Diff і дотичний контекст PR надсилаються до
  Gemini API. Не вмикайте для репозиторіїв із секретами/персональними даними/
  комерційною таємницею без оцінки умов Google. На Free tier вхідні дані
  можуть використовуватись для покращення продуктів Google (див. вище).
- **Квота й вартість.** Ліміти на проєкт; при вичерпанні — `429`.
  На платному рівні — оплата за токени.
- **Коментарі бота — зовнішні дані.** Вихід моделі недетермінований і може
  містити помилки; це підказка, а не рішення. Опис PR і код у ньому — також
  недовірений вхід (prompt injection): промпт містить захисні правила, але
  100% гарантії немає. Не виконуйте команди з рев'ю бота наосліп; merge
  лишається за людиною.
- **Права.** Workflow має `contents: read`, `pull-requests: write`,
  `issues: write` (коментарі до PR публікуються через issues-API). Запуск
  вручну — лише для OWNER/MEMBER/COLLABORATOR.
- **Ланцюг постачання (supply chain).** Усі `uses:` закріплені повним SHA.
  Gemini CLI (`@google/gemini-cli`) ставиться з npm у момент запуску
  (версія — `latest`, якщо не задано `GEMINI_CLI_VERSION`); для суворого
  відтворюваного результату зафіксуйте `GEMINI_CLI_VERSION`. Образ
  `ghcr.io/github/github-mcp-server:v2.2.0` закріплено digest-ом (sha256),
  тож його не можна непомітно підмінити (оновлено 2026-11-20).
- **Відхилення від офіційного прикладу.** Офіційний `gemini-review.yml`
  встановлює зовнішнє розширення `gemini-cli-extensions/code-review` з гілки
  за замовчуванням (без SHA). Тут замість нього використано версіонований у
  репозиторії промпт `.gemini/commands/gemini-review.toml` (той самий вміст
  з офіційних прикладів). Також прибрано `id-token: write` і jobs triage /
  invoke / plan-execute.

## 7. Оновлення

Версії `uses:` оновлюйте свідомо: перевірте реліз, підставте новий повний SHA
та коментар-версію; перегляньте зміни в
[examples/workflows](https://github.com/google-github-actions/run-gemini-cli/tree/main/examples/workflows).

## 8. Довіра до теки (Folder trust)

Статус дослідження: **документація** перевірена 2026-11-18, **поведінка в
Actions у цьому репозиторії — не запускалась** (workflow ще не виконувався).

**Що таке folder trust.** Функція Gemini CLI: до довіреної теки CLI завантажує
проєктну конфігурацію. Джерело:
<https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/trusted-folders.md>.
За документацією, **функція вимкнена за замовчуванням** і вмикається
`security.folderTrust.enabled: true` у user-`settings.json`.

**Що вимикається в недовіреній теці** (за документацією): проєктний
`.gemini/settings.json`, проєктні `.env`, **MCP-сервери** (CLI не підключається),
**власні `.toml`-команди** (і проєктні, і глобальні), встановлення розширень,
автоприйняття дій інструментів (перед кожним інструментом — запит).

**Що означає попередження «current folder is not trusted… approval mode
default».** Точного тексту в документації Gemini CLI та README
`google-github-actions/run-gemini-cli` **не знайдено** [S]. Найімовірніше —
повідомлення CLI, що недовірена тека працює в безпечному режимі, а режим
схвалення — стандартний (запит перед кожним інструментом) [C, зі слів
документації про untrusted mode].

**Чи впливає на рев'ю PR.** Цей workflow повністю залежить від проєктних
ресурсів: інлайн-`settings` дії пишуться в `.gemini/settings.json` (MCP
`github`, дозволені `run_shell_command(cat|echo|grep|head|tail)`), а промпт —
це проєктна команда `/gemini-review` з `.gemini/commands/`. Якщо тека
реально вважається недовіреною **і** перевірка довіри активна, то за
документацією: MCP не підключиться, `/gemini-review` не завантажиться, а
запит інструментів у headless-режимі нікому підтвердити → рев'ю не відбудеться
або буде порожнім [C]. Якщо перевірка довіри вимкнена (стан за замовчуванням),
обмеження не застосовуються [C]. Як саме ведеться дія в CI, перевіряється лише
першим реальним запуском [S] — дивіться логи кроку «Run Gemini CLI».

**Офіційні варіанти розв'язання** (нічого з цього зараз не ввімкнено):

| Варіант | Як | Вплив на безпеку |
|---|---|---|
| Нічого не робити | `folderTrust` вимкнений за замовчуванням | Найпростіше; перевірка довіри не діє. Залишається захист самого workflow (мінімальні права, allow-list інструментів) |
| `GEMINI_CLI_TRUST_WORKSPACE=true` у `env` кроку | Довіряти робочій теці на час сесії без запиту | Проєктні `.gemini/settings.json`, `.env`, команди й MCP завантажуються. У PR від того ж репо вони під контролем команди, **але** це вектор: хто змінить ці файли в PR, змінить поведінку бота. Не вмикати для PR із форків |
| `--skip-trust` | Те саме з командного рядка | Те саме |
| `security.folderTrust.enabled: false` у settings | Явно вимкнути перевірку | Те саме за ризиком, але без обходу довіри |
| `GEMINI_CLI_TRUSTED_FOLDERS_PATH` | Свій файл `trustedFolders.json` | Для контрольованого списку тек; в Actions складніше, ніж потрібно цьому пілоту |

Офіційне посилання з документації на «GitHub Actions trust guidance» окремо
не знайдено [S].

**Рекомендація.** Не вмикати довіру наперед. Спочатку один реальний запуск:
якщо рев'ю публікується — нічого не змінювати. Якщо ні й у логах причина —
недовірена тека, додавати лише `GEMINI_CLI_TRUST_WORKSPACE: 'true'` у `env`
кроку рев'ю, лишивши обмеження: лише PR з цього ж репо, `includeTools` і
allow-list shell, `contents: read`. Окремо стежити, щоб зміни в `.gemini/**` у
PR проходили людське рев'ю до merge.
