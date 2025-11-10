# 🔌 RankSmart API Documentation

**Version**: 1.0  
**Base URL**: `https://ranksmart.vercel.app/api`  
**Authentication**: Bearer Token

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Analytics](#analytics)
3. [Audit History](#audit-history)
4. [Team Management](#team-management)
5. [API Keys](#api-keys)
6. [Rate Limits](#rate-limits)
7. [Error Handling](#error-handling)

---

## 🔐 Authentication

All API requests require authentication using a Bearer token in the Authorization header.

### Get API Key

1. Log in to your RankSmart account
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Save the key securely (shown only once!)

### Usage

```bash
curl -H "Authorization: Bearer rs_live_your_api_key_here" \
  https://ranksmart.vercel.app/api/analytics/dashboard
```

---

## 📊 Analytics

### GET /api/analytics/dashboard

Get comprehensive analytics and insights.

**Parameters**:
- `timeframe` (optional): `7d`, `30d`, or `90d` (default: `30d`)

**Response**:
```json
{
  "success": true,
  "timeframe": "30d",
  "analytics": {
    "overview": {
      "total_audits": 150,
      "average_score": 78.5,
      "active_monitors": 5,
      "changes_detected": 12
    },
    "trends": {
      "score_trend": [
        { "date": "2025-11-01", "value": 75.2 },
        { "date": "2025-11-02", "value": 76.8 }
      ],
      "audit_volume": [
        { "date": "2025-11-01", "count": 5 },
        { "date": "2025-11-02", "count": 8 }
      ]
    },
    "pages": {
      "top_performing": [
        {
          "url": "https://example.com/page1",
          "score": 95,
          "date": "2025-11-10T00:00:00Z"
        }
      ],
      "needs_attention": [
        {
          "url": "https://example.com/page2",
          "score": 45,
          "date": "2025-11-09T00:00:00Z"
        }
      ]
    },
    "score_distribution": {
      "excellent": 20,
      "good": 80,
      "fair": 40,
      "poor": 10
    },
    "monitors": {
      "total": 10,
      "active": 5,
      "paused": 3,
      "error": 2,
      "changes_detected": 12,
      "avg_changes_per_monitor": "2.40"
    }
  }
}
```

---

## 📜 Audit History

### GET /api/history/audits

Retrieve audit history with filtering and pagination.

**Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sort` (optional): Sort field (default: `created_at`)
- `order` (optional): `asc` or `desc` (default: `desc`)
- `min_score` (optional): Minimum score filter
- `max_score` (optional): Maximum score filter
- `url_filter` (optional): URL search term
- `date_from` (optional): Start date (ISO 8601)
- `date_to` (optional): End date (ISO 8601)

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://ranksmart.vercel.app/api/history/audits?page=1&limit=20&min_score=70"
```

**Response**:
```json
{
  "success": true,
  "audits": [
    {
      "id": "uuid",
      "url": "https://example.com/page",
      "score": 85,
      "created_at": "2025-11-10T00:00:00Z",
      "eeat_score": 82,
      "technical_score": 88,
      "has_recommendations": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_more": true
  },
  "summary": {
    "total_audits": 150,
    "average_score": 78.5,
    "score_distribution": {
      "excellent": 20,
      "good": 80,
      "fair": 40,
      "poor": 10
    }
  }
}
```

### DELETE /api/history/audits

Delete one or more audits.

**Body**:
```json
{
  "audit_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Deleted 3 audit(s)",
  "deleted_count": 3
}
```

---

## 👥 Team Management

**Note**: Requires Agency plan

### GET /api/team/members

List all team members.

**Response**:
```json
{
  "success": true,
  "team_id": "uuid",
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "permissions": ["all"],
      "status": "active",
      "joined_at": "2025-11-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

### POST /api/team/members

Invite a team member.

**Body**:
```json
{
  "email": "newmember@example.com",
  "role": "editor",
  "permissions": ["read", "write"]
}
```

**Roles**: `admin`, `editor`, `member`, `viewer`

**Response**:
```json
{
  "success": true,
  "message": "Team member added",
  "member": {
    "id": "uuid",
    "email": "newmember@example.com",
    "role": "editor",
    "status": "active"
  }
}
```

### PUT /api/team/members

Update team member role or permissions.

**Body**:
```json
{
  "member_id": "uuid",
  "role": "admin",
  "permissions": ["all"]
}
```

### DELETE /api/team/members

Remove a team member.

**Body**:
```json
{
  "member_id": "uuid"
}
```

---

## 🔑 API Keys

**Note**: Requires Professional or Agency plan

### GET /api/api-keys/manage

List all API keys.

**Response**:
```json
{
  "success": true,
  "keys": [
    {
      "id": "uuid",
      "name": "Production API Key",
      "key_prefix": "rs_live_",
      "scopes": ["read", "write"],
      "last_used": "2025-11-10T00:00:00Z",
      "created_at": "2025-11-01T00:00:00Z",
      "expires_at": "2026-11-01T00:00:00Z",
      "status": "active",
      "is_expired": false
    }
  ],
  "total": 3
}
```

### POST /api/api-keys/manage

Create a new API key.

**Body**:
```json
{
  "name": "My API Key",
  "scopes": ["read", "write"],
  "expires_in_days": 365
}
```

**Scopes**: `read`, `write`, `admin`

**Response**:
```json
{
  "success": true,
  "message": "API key created successfully",
  "key": {
    "id": "uuid",
    "name": "My API Key",
    "api_key": "rs_live_abc123...",
    "key_prefix": "rs_live_",
    "scopes": ["read", "write"],
    "created_at": "2025-11-10T00:00:00Z",
    "expires_at": "2026-11-10T00:00:00Z"
  },
  "warning": "Save this API key now. You won't be able to see it again!"
}
```

### DELETE /api/api-keys/manage

Revoke an API key.

**Body**:
```json
{
  "key_id": "uuid"
}
```

---

## ⚡ Rate Limits

| Plan | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Starter | 100 | 1,000 |
| Professional | 500 | 5,000 |
| Agency | 2,000 | 20,000 |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 450
X-RateLimit-Reset: 1699564800
```

---

## ❌ Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": 400
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

### Common Errors

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "details": "Invalid or missing API key"
}
```

**403 Forbidden**:
```json
{
  "error": "API access requires Professional or Agency plan",
  "upgrade_url": "/pricing"
}
```

**429 Rate Limit**:
```json
{
  "error": "Rate limit exceeded",
  "details": "You have exceeded your hourly request limit",
  "retry_after": 3600
}
```

---

## 📝 Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_KEY = 'rs_live_your_api_key';
const BASE_URL = 'https://ranksmart.vercel.app/api';

async function getAnalytics() {
  try {
    const response = await axios.get(`${BASE_URL}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      params: {
        timeframe: '30d'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

getAnalytics();
```

### Python

```python
import requests

API_KEY = 'rs_live_your_api_key'
BASE_URL = 'https://ranksmart.vercel.app/api'

def get_analytics():
    headers = {
        'Authorization': f'Bearer {API_KEY}'
    }
    params = {
        'timeframe': '30d'
    }
    
    response = requests.get(
        f'{BASE_URL}/analytics/dashboard',
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        print(response.json())
    else:
        print(f'Error: {response.json()}')

get_analytics()
```

### cURL

```bash
# Get Analytics
curl -X GET \
  -H "Authorization: Bearer rs_live_your_api_key" \
  "https://ranksmart.vercel.app/api/analytics/dashboard?timeframe=30d"

# Create API Key
curl -X POST \
  -H "Authorization: Bearer rs_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Key","scopes":["read","write"],"expires_in_days":365}' \
  "https://ranksmart.vercel.app/api/api-keys/manage"

# Get Audit History
curl -X GET \
  -H "Authorization: Bearer rs_live_your_api_key" \
  "https://ranksmart.vercel.app/api/history/audits?page=1&limit=20&min_score=70"
```

---

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** to store keys
3. **Rotate keys regularly** (every 90 days recommended)
4. **Use minimum required scopes** for each key
5. **Monitor API usage** for suspicious activity
6. **Revoke compromised keys** immediately
7. **Use HTTPS only** for all API requests

---

## 📞 Support

- **Documentation**: https://docs.ranksmart.io
- **Email**: support@ranksmart.io
- **Discord**: https://discord.gg/ranksmart

---

**Last Updated**: November 10, 2025
