# Cursor Handoff Example

This is an example of a handoff document formatted for Cursor AI assistant.

## Task: Implement User Authentication API

### Description
Implement the authentication API endpoints as defined in spec:user-authentication-api.

### Requirements
- Create POST /api/auth/register endpoint
- Create POST /api/auth/login endpoint
- Create POST /api/auth/forgot-password endpoint
- Create POST /api/auth/reset-password endpoint
- Hash passwords using bcrypt
- Generate JWT tokens on successful login
- Implement rate limiting (10 requests/minute/IP)
- Enforce HTTPS on all endpoints

### Acceptance Criteria
- [ ] POST /api/auth/register endpoint created and functional
- [ ] POST /api/auth/login endpoint created and functional
- [ ] POST /api/auth/forgot-password endpoint created and functional
- [ ] POST /api/auth/reset-password endpoint created and functional
- [ ] Passwords are hashed using bcrypt before storage
- [ ] JWT tokens are generated on successful login
- [ ] Rate limiting implemented (10 requests/minute/IP)
- [ ] All endpoints enforce HTTPS
- [ ] Unit tests written for all endpoints
- [ ] Integration tests written for authentication flow

### Implementation Plan
1. Create auth controller with endpoint methods
2. Implement user registration logic
3. Implement user login logic
4. Implement password reset functionality
5. Add bcrypt hashing for passwords
6. Implement JWT token generation
7. Add rate limiting middleware
8. Ensure HTTPS enforcement
9. Write unit tests
10. Write integration tests

### Codebase Context
Relevant files:
- src/controllers/auth.controller.ts (create this file)
- src/models/user.model.ts (existing user model)
- src/middleware/rate-limit.middleware.ts (existing rate limiter)
- src/utils/jwt.util.ts (existing JWT utilities)

### References
- spec:user-authentication-api
- ticket:implement-auth-api

### Cursor-Specific Instructions
1. Create new files by specifying the full path
2. Modify existing files by referencing them explicitly
3. Use the file explorer to navigate the codebase
4. Run tests using the integrated terminal
