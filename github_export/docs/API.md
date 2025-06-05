# API Documentation

## Resume Optimizer API v1.0

Base URL: `http://localhost:8001` (development) or your deployed backend URL

### Authentication
Currently, no authentication is required for any endpoints.

---

## Endpoints

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### Analyze Resume

**POST** `/analyze`

Analyze a resume against a job description using AI.

**Request Body:**
```json
{
  "job_description": "string",
  "resume_text": "string"
}
```

**Response:**
```json
{
  "analysis_id": "uuid",
  "analysis": "string (JSON formatted)",
  "original_resume": "string",
  "job_description": "string",
  "created_at": "datetime"
}
```

**Analysis JSON Structure:**
```json
{
  "skills_gap": ["skill1", "skill2"],
  "suggestions": [
    {
      "section": "summary|experience|skills|achievements",
      "current_text": "existing text or null",
      "suggested_text": "improved version",
      "reason": "explanation for change"
    }
  ],
  "ats_keywords": ["keyword1", "keyword2"],
  "overall_score": "score out of 100 with explanation"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: AI analysis failed

---

### Generate Cover Letter

**POST** `/generate-cover-letter`

Generate both short and long versions of a cover letter.

**Request Body:**
```json
{
  "job_description": "string",
  "resume_text": "string"
}
```

**Response:**
```json
{
  "cover_letter_id": "uuid",
  "short_version": "string (250 words)",
  "long_version": "string (450-600 words)",
  "created_at": "datetime"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Cover letter generation failed

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request - Invalid input
- `500`: Internal Server Error - Server-side issue

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing:
- Rate limiting per IP address
- API key-based authentication
- Usage quotas

---

## Examples

### Analyze Resume Example

```bash
curl -X POST "http://localhost:8001/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Software Engineer position requiring Python, React, and AWS experience",
    "resume_text": "John Doe - Software Developer with 3 years experience in Python and web development"
  }'
```

### Generate Cover Letter Example

```bash
curl -X POST "http://localhost:8001/generate-cover-letter" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Marketing Manager position at a tech startup",
    "resume_text": "Marketing professional with 5 years experience in digital marketing and analytics"
  }'
```

---

## Development

### Adding New Endpoints

1. Define Pydantic models for request/response
2. Implement the endpoint function
3. Add proper error handling
4. Update this documentation
5. Add tests

### Testing the API

Use the included Postman collection or test with curl commands as shown above.