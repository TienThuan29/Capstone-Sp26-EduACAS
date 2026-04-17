# Frontend LSP Integration Checklist

## Environment Configuration

```bash
# .env.development
VITE_API_GATEWAY_URL=http://localhost:8080
VITE_LSP_WS_URL=http://localhost:8080/lsp
VITE_LSP_API_URL=http://localhost:8080/api/lsp
```

## Checklist

### 1. WebSocket Connection URL

- [ ] Frontend kết nối đúng URL: `http://localhost:8080/lsp`
- [ ] Không dùng path `/api/lsp` cho WebSocket (namespace là `/lsp`)
- [ ] Dùng `socket.io-client` với path `/lsp`

```typescript
// ✅ Correct
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080', {
  path: '/lsp',
  transports: ['websocket'],
});

// ❌ Wrong
const socket = io('http://localhost:8080/api/lsp');
```

### 2. CORS Configuration (Backend)

- [ ] API Gateway forward WebSocket đúng
- [ ] Backend (`main.ts`) cho phép CORS với credentials

```typescript
// Backend main.ts - đã cấu hình
app.enableCors({
  origin: "*",
  credentials: true,
});
```

### 3. API Gateway Configuration (Port 8080)

- [ ] Proxy WebSocket `/lsp` namespace đến NestJS (port 5000)
- [ ] Proxy `/api/lsp` đến NestJS

```nginx
# nginx.conf example
location /lsp/ {
  proxy_pass http://localhost:5000/lsp/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}

location /api/lsp {
  proxy_pass http://localhost:5000/api/lsp;
  proxy_http_version 1.1;
}
```

### 4. Frontend Connection Flow

```typescript
// hooks/lsp/useLspClient.ts

// 1. Lấy URL từ env
const WS_URL = import.meta.env.VITE_LSP_WS_URL || 'http://localhost:8080/lsp';

// 2. Connect với đúng options
const socket = io(WS_URL, {
  path: '/lsp',  // IMPORTANT: path phải là namespace
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
});

// 3. Handle connection events
socket.on('connect', () => {
  console.log('[LSP] Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('[LSP] Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('[LSP] Disconnected:', reason);
});
```

### 5. Test Connection

```bash
# Test WebSocket endpoint
curl -v \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:8080/lsp

# Test REST endpoint
curl http://localhost:8080/api/lsp/status
```

### 6. Frontend Error Handling Checklist

```typescript
// Đảm bảo xử lý các cases sau:

const connectWithRetry = (maxRetries = 3) => {
  let retries = 0;

  const tryConnect = () => {
    if (retries >= maxRetries) {
      console.error('[LSP] Max connection attempts reached');
      return;
    }

    console.log(`[LSP] Connection attempt ${retries + 1}/${maxRetries}`);
    retries++;

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[LSP] Connected');
      retries = 0; // Reset on successful connection
    });

    socket.on('connect_error', (err) => {
      console.error('[LSP] Error:', err.message);

      // Retry logic
      if (retries < maxRetries) {
        setTimeout(tryConnect, 2000);
      }
    });
  };

  tryConnect();
};
```

### 7. Diagnostic Code

Thêm vào frontend để debug:

```typescript
// Debug: Kiểm tra environment
console.log('WS URL:', import.meta.env.VITE_LSP_WS_URL);
console.log('API URL:', import.meta.env.VITE_LSP_API_URL);

// Debug: Connection state
socket.on('connect', () => {
  console.log('✅ Connected');
  console.log('Transport:', socket.io.engine.transport.name);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.io.on('reconnect_attempt', (attempt) => {
  console.log('🔄 Reconnecting attempt:', attempt);
});

socket.io.on('reconnect_failed', () => {
  console.error('💥 Reconnection failed');
});
```

## Common Issues & Solutions

### Issue: "websocket error" ngay lập tức

**Nguyên nhân:**
- URL sai (dùng `/api/lsp` thay vì `/lsp`)
- API Gateway không forward WebSocket

**Check:**
```typescript
// Đúng
const URL = 'http://localhost:8080';  // Base URL
const socket = io(URL, { path: '/lsp' });  // Namespace là /lsp

// Hoặc đầy đủ
const socket = io('http://localhost:8080/lsp');  // Thường sai
```

### Issue: CORS error

**Nguyên nhân:**
- API Gateway block CORS
- Backend không set CORS headers

**Check:**
```bash
# Test CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8080/lsp
```

### Issue: 404 khi connect

**Nguyên nhân:**
- Namespace không đúng
- API Gateway route sai

**Check:**
```bash
# WS endpoint phải trả về HTTP 101 (Switching Protocols)
# Không phải 404
```

### Issue: Timeout liên tục

**Nguyên nhân:**
- LSP server không khả dụng
- Backend không initialize được server

**Check:**
```bash
curl http://localhost:5000/api/lsp/status
# Hoặc qua gateway
curl http://localhost:8080/api/lsp/status
```

## Quick Verification Script

```typescript
// Chạy trong browser console
const checkLsp = async () => {
  const BASE_URL = 'http://localhost:8080';

  // 1. Check REST API
  try {
    const res = await fetch(`${BASE_URL}/api/lsp/status`);
    const data = await res.json();
    console.log('✅ REST API OK:', data);
  } catch (e) {
    console.error('❌ REST API Error:', e);
  }

  // 2. Check WebSocket
  try {
    const ws = new WebSocket(`${BASE_URL.replace('http', 'ws')}/lsp`);
    ws.onopen = () => {
      console.log('✅ WebSocket OK');
      ws.close();
    };
    ws.onerror = (e) => {
      console.error('❌ WebSocket Error:', e);
    };
  } catch (e) {
    console.error('❌ WebSocket Creation Error:', e);
  }

  // 3. Check Socket.IO
  try {
    const io = window.io || (await import('socket.io-client')).io;
    const socket = io(BASE_URL, { path: '/lsp', transports: ['polling'] });
    socket.on('connect', () => {
      console.log('✅ Socket.IO OK:', socket.id);
      socket.close();
    });
    socket.on('connect_error', (e) => {
      console.error('❌ Socket.IO Error:', e.message);
    });
  } catch (e) {
    console.error('❌ Socket.IO Error:', e);
  }
};

checkLsp();
```

## Summary Flow

```
Frontend (3000)
    │
    ├─ REST: http://localhost:8080/api/lsp/status ✅
    │
    └─ WS:   http://localhost:8080/lsp
                │
                └─ API Gateway (8080)
                      │
                      ├─ Proxy /lsp  ──▶ NestJS (5000) /lsp
                      └─ Proxy /api/lsp ──▶ NestJS (5000) /api/lsp
                            │
                            └─ LspService
                                  │
                                  └─ LSP Servers (python3, clangd, etc.)
```

## Required Ports

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Monaco Editor UI |
| API Gateway | 8080 | Route requests |
| NestJS (LSP) | 5000 | LSP Service |
| Python | - | python3 -m pylsp |
| C++ | - | clangd |