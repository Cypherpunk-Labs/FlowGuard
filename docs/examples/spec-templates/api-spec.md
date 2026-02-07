---
title: {{spec.title}}
status: draft
author: {{spec.author}}
created: {{spec.created}}
tags: [api, backend]
---

# {{spec.title}} API

## Overview

{{spec.description}}

## Endpoints

### {{endpoint.method}} {{endpoint.path}}

**Description**: {{endpoint.description}}

**Request Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | string | Yes | Description of param1 |
| param2 | integer | No | Description of param2 |

**Request Body**:
```json
{
  "field1": "value1",
  "field2": 123
}
```

**Response Codes**:
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 500 | Internal Server Error |

**Response Body**:
```json
{
  "result": "success",
  "data": {}
}
```

## Data Models

### {{model.name}}

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field1 | string | Yes | Description of field1 |
| field2 | integer | No | Description of field2 |

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `INVALID_INPUT`: Provided input data is invalid
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found

## Security Considerations

- All endpoints require authentication
- Rate limiting is enforced
- Input validation is performed
- Sensitive data is encrypted

## Implementation Notes

- [Note 1]
- [Note 2]
- [Note 3]

## Acceptance Criteria

- [ ] All endpoints return appropriate HTTP status codes
- [ ] Error responses follow the standard format
- [ ] Rate limiting is properly implemented
- [ ] Input validation prevents injection attacks

## References

- [Related specification](spec:related-spec)
- [Related ticket](ticket:related-ticket)
