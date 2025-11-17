# CORS Configuration для Tauri Desktop

## Проблема
Tauri desktop приложение использует origin `tauri://localhost`, который должен быть разрешён в CORS на backend.

## Решение

### На продакшн-сервере voxithub.ru выполни:

```bash
# 1. Обнови конфигурацию backend
cd /opt/ghost-chat  # или где находится проект
git pull  # чтобы получить обновлённый Revolt.overrides.prod.toml

# 2. Или вручную добавь в конфиг backend (Revolt.overrides.prod.toml):
[api]
cors_allowed_origins = [
    "https://voxithub.ru",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost"
]

# 3. Перезапусти backend контейнер
docker compose restart backend

# 4. Проверь логи
docker compose logs -f backend
```

## Проверка

После применения, в Tauri desktop приложении:
1. Открой DevTools (F12)
2. Попробуй авторизоваться/зарегистрироваться
3. Не должно быть ошибок CORS в консоли

## Альтернатива (временная)

Если не можешь обновить продакшн, используй локальный backend:
- Docker backend работает на `localhost:14702`
- В `.env` файле desktop-shell уже настроено переключение

