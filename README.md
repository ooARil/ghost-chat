# Ghost Chat

Легковесный мессенджер на базе Revolt/Stoat с поддержкой голосовых каналов через LiveKit.

## Стек технологий

**Backend:**
- Rust (Rocket framework)
- MongoDB
- Redis
- RabbitMQ
- LiveKit (WebRTC)

**Frontend:**
- SolidJS
- TypeScript
- Vite

## Развертывание

### Требования
- Docker & Docker Compose
- GitHub Account с настроенным Container Registry

### GitHub Secrets

Настрой следующие секреты в GitHub Repository Settings → Secrets:

```
SERVER_HOST=213.176.65.138
SSH_USER=root
SSH_PRIVATE_KEY=<ваш приватный SSH ключ>
MONGO_PASSWORD=<сгенерируй надежный пароль>
```

### Автоматическое развертывание

При пуше в ветку `main` или `develop` GitHub Actions автоматически:
1. Соберет Docker образы
2. Запушит в GitHub Container Registry
3. Развернет на сервер

### Ручное развертывание

```bash
# Клонируй на сервер
git clone <repo-url> /opt/ghost-chat
cd /opt/ghost-chat

# Установи пароль MongoDB
export MONGO_PASSWORD=your_secure_password

# Запусти
ENV=prod docker compose up -d
```

## Доступ

- Frontend: https://atuj.ru:9443
- API: https://atuj.ru:9443/api
- WebSocket: wss://atuj.ru:9443/ws
- Health: https://atuj.ru:9443/health

## Локальная разработка

```bash
# Backend
cd backend
cargo run --bin revolt-delta &
cargo run --bin revolt-bonfire &

# Frontend
cd frontend
pnpm dev
```

## Порты

- 9443 - HTTPS (nginx)
- 14702 - Backend API
- 14703 - WebSocket
- 14704 - File uploads (Autumn)
- 14705 - Proxy (January)
- 14706 - GIF service (Gifbox)
- 7880-7881 - LiveKit
- 50000-50100 - LiveKit WebRTC (UDP)

## Архитектура

```
[Client] → [Nginx:9443 HTTPS] → 
    ├─ [Frontend:80]
    ├─ [Backend API:14702]
    ├─ [WebSocket:14703]
    └─ [LiveKit:7880]
```

## Известные проблемы

- stoat-frontend отправляет `Content-Type: text/plain` вместо `application/json` → используем revolt-frontend
- Voice channels требуют ветку `feat/livekit` (не в main)

## License

Based on [Revolt/Stoat](https://github.com/stoatchat) - AGPLv3
