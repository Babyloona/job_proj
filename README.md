# API для управления задачами с интеграцией Bitrix24

Это Node.js Express API, которое интегрируется с Bitrix24 для управления задачами. Оно предоставляет CRUD-операции для задач, маппинг полей на поля Bitrix, с валидацией и обработкой ошибок. API действует как прокси к REST API Bitrix24, используя вебхуки для аутентификации.

## Особенности
- Создание, чтение, обновление и удаление задач в Bitrix24.
- Маппинг полей между запросами API и полями Bitrix.
- Валидация с использованием Joi.
- Пагинация и фильтрация для списков задач.
- Аутентификация по API-ключу для безопасности.
- Конфигурируемая стратегия удаления (мягкая/жесткая) через переменные окружения.

## Детали интеграции с Bitrix
Это API использует демо-версию Bitrix24 (доступную через указанный вебхук URL в `.env`). Задачи создаются и управляются в разделе "Задачи" Bitrix24. При создании задачи:
- Можно присваивать статус (например, "todo", "in_progress", "done") и срок (дедлайн).
- Исполнитель (ответственный) устанавливается по ID пользователя Bitrix (целое число). В этой демо-версии Bitrix основной/администраторский пользователь имеет ID 1. Вы можете назначать задачи на этот ID или другие валидные ID пользователей в вашем портале Bitrix.
- Комментарии добавляются через метод Bitrix `task.commentitem.add` (маппится на `comment.body` в запросах, но обрабатывается внутренне при необходимости).
- Все операции используют REST-методы Bitrix, такие как `tasks.task.add`, `tasks.task.list` и т.д., через endpoint вебхука.
Демо-вебхук URL: `https://b24-m0pq93.bitrix24.kz/rest/1/e33yzph0z4rlf69p/`.

## Структура проекта
```
.
├── routes/
│   └── tasks.js          # Основные маршруты (CRUD)
├── services/
│   └── bitrix.js         # Работа с Bitrix API через axios
├── utils/
│   ├── validator.js      # Валидация данных (Joi)
│   └── mapper.js         # Преобразование полей
├── index.js              # Точка входа Express
├── package.json
└── README.md
```

## Маппинг полей
| Наше поле    | Поле Bitrix       | Варианты / формат                          |
|--------------|-------------------|--------------------------------------------|
| id          | ID                | число                                      |
| title       | TITLE             | string (max 460)                           |
| description | DESCRIPTION       | string                                     |
| assignee_id | RESPONSIBLE_ID    | Bitrix user id (integer)                   |
| priority    | PRIORITY          | low ↔︎ 1, normal ↔︎ 2, high ↔︎ 3          |
| status      | STATUS            | todo ↔︎ 1, in_progress ↔︎ 3, done ↔︎ 5    |
| due_at      | DEADLINE          | UTC ISO8601 / YYYY-MM-DDThh:mm:ss±hh:mm    |
| comment.body| task.commentitem.add POST_MESSAGE | string (для добавления комментариев)      |

## Установка и настройка
1. Клонируйте репозиторий:
   ```
   git clone <repo-url>
   cd <repo-folder>
   ```

2. Установите зависимости:
   ```
   npm install
   ```

3. Создайте файл `.env` в корневой директории с следующими переменными:
   ```
   PORT=8080
   API_KEY=Gamechanger  # Ваш API-ключ для аутентификации (измените в продакшене)
   BITRIX_WEBHOOK_URL=https://b24-m0pq93.bitrix24.kz/rest/1/e33yzph0z4rlf69p/  # URL вебхука Bitrix
   DELETE_STRATEGY=soft  # 'soft' устанавливает завершение задачи; 'hard' удаляет навсегда
   ```

4. Запустите сервер:
   ```
   node index.js
   ```
   API будет доступен по адресу `http://localhost:8080`.

## Эндпоинты API
Все запросы требуют заголовка `X-API-Key` с значением из `.env` (например, `Gamechanger`).

### POST /tasks — Создать задачу
Создаёт новую задачу в Bitrix.

**Тело запроса (JSON):**
```json
{
  "title": "Name of new task",
  "description": "description of the task",
  "assignee_id": 1,  // ID пользователя Bitrix (например, 1 для демо-админа)
  "priority": "high",  // low, normal, high
  "status": "todo",  // todo, in_progress, done
  "due_at": "2025-10-10T12:00:00Z"  // ISO8601 UTC
}
```

**Пример cURL (в bash-консоли):**
```
curl -X POST http://localhost:8080/tasks \
-H "Content-Type: application/json" \
-H "X-API-Key: Gamechanger" \
-d '{"title": "New Task Title", "description": "Task description here", "assignee_id": 1, "priority": "high", "status": "todo", "due_at": "2025-10-10T12:00:00Z"}'
```

**Ответ (201 Created):**
```json
{
  "id": 123,
  "title": "Name of new task",
  "description": "description of the task",
  "assignee_id": 1,
  "priority": "high",
  "status": "todo",
  "due_at": "2025-10-10T12:00:00Z"
}
```

### GET /tasks — Список задач
Получает пагинированный список задач с опциональными фильтрами.

**Параметры запроса:**
- `status`: todo, in_progress, done
- `assignee`: ID пользователя Bitrix (например, 1)
- `created_from`: ISO-дата (например, 2025-01-01)
- `created_to`: ISO-дата
- `due_from`: ISO-дата
- `due_to`: ISO-дата
- `limit`: Количество элементов на странице (по умолчанию: 20)
- `offset`: Смещение (по умолчанию: 0)

**Пример cURL:**
```
curl -X GET "http://localhost:8080/tasks?status=todo&assignee=1&limit=10&offset=0" \
-H "X-API-Key: Gamechanger"
```

**Ответ (200 OK):**
```json
{
  "items": [
    {
      "id": 123,
      "title": "Name of the task",
      // ... другие поля
    }
  ],
  "total": 50,
  "offset": 0
}
```

### GET /tasks/:id — Получить задачу по ID
Получает отдельную задачу.

**Пример cURL:**
```
curl -X GET http://localhost:8080/tasks/123 \
-H "X-API-Key: Gamechanger"
```

**Ответ (200 OK):**
```json
{
  "id": 123,
  "title": "Name of the tsk",
  // ... другие поля
}
```

**Ошибка (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Задача не найдена"
  }
}
```

### PATCH /tasks/:id — Обновить задачу
Обновляет существующую задачу (частичные обновления разрешены).

**Тело запроса (JSON):**
```json
{
  "title": "Rewrite the name of the task",
  "status": "in_progress"
}
```

**Пример cURL:**
```
curl -X PATCH http://localhost:8080/tasks/123 \
-H "Content-Type: application/json" \
-H "X-API-Key: Gamechanger" \
-d '{"title": "Updated Title", "status": "in_progress"}'
```

**Ответ (200 OK):** Обновлённый объект задачи.

### DELETE /tasks/:id — Удалить задачу
Удаляет задачу (мягко или жёстко в зависимости от `DELETE_STRATEGY` в `.env`).

**Пример cURL:**
```
curl -X DELETE http://localhost:8080/tasks/123 \
-H "X-API-Key: Gamechanger"
```

**Ответ (204 No Content):** При успехе.

## Важные замечания
- **Проблема с кодировкой языка:** При отправке запросов через bash-консоль (например, с помощью cURL) используйте английский язык для заголовков и описаний задач. Если использовать русский текст, он может отображаться некорректно (крякозабры) из-за проблем с кодировкой в консоли или передаче. Это не влияет на запросы из других инструментов, таких как Postman.
- **Обработка ошибок:** Все эндпоинты возвращают структурированные ответы с ошибками, содержащими `code`, `message` и опционально `details`.
- **Зависимости:** Express, Joi, Axios, Dotenv, Morgan, Helmet.
- **Тестирование:** Используйте инструменты вроде Postman или Insomnia для тестирования API. Убедитесь, что вебхук Bitrix валиден и имеет права на задачи.

По вопросам или проблемам обращайтесь к разработчику(мне).
