# CRUD API Documentation

## 1. Create a New Record
- **Method**: POST
- **URL**: `/api/records`
- **Request Body**:
```json
{
  "title": "string (required, max 100 chars)",
  "description": "string (required, max 500 chars)",
  "status": "todo" | "in_progress" | "done",
  "priority": "low" | "medium" | "high"
}
```
- **Response**: 201 Created
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "createdAt": "string (ISO date)"
}
```

## 2. List All Records
- **Method**: GET
- **URL**: `/api/records`
- **Response**: 200 OK
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "status": "string",
    "priority": "string",
    "createdAt": "string (ISO date)"
  }
]
```

## 3. Get Single Record
- **Method**: GET
- **URL**: `/api/records/:id`
- **Parameters**: id (number) in URL
- **Response**: 200 OK
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "createdAt": "string (ISO date)"
}
```
- **Error**: 404 Not Found if record doesn't exist

## 4. Update Record
- **Method**: PATCH
- **URL**: `/api/records/:id`
- **Parameters**: id (number) in URL
- **Request Body**:
```json
{
  "title": "string (required, max 100 chars)",
  "description": "string (required, max 500 chars)",
  "status": "todo" | "in_progress" | "done",
  "priority": "low" | "medium" | "high"
}
```
- **Response**: 200 OK
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "createdAt": "string (ISO date)"
}
```
- **Error**: 404 Not Found if record doesn't exist

## 5. Delete Record
- **Method**: DELETE
- **URL**: `/api/records/:id`
- **Parameters**: id (number) in URL
- **Response**: 204 No Content
- **Error**: 404 Not Found if record doesn't exist

## 6. Search Records
- **Method**: GET
- **URL**: `/api/records/search`
- **Query Parameters**: `q` (search term)
- **Example**: `/api/records/search?q=test`
- **Response**: 200 OK
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "status": "string",
    "priority": "string",
    "createdAt": "string (ISO date)"
  }
]
```

## Error Responses
All endpoints may return these error responses:
- 400 Bad Request: Invalid input data
```json
{
  "message": "Error description"
}
```
- 500 Internal Server Error: Server-side error
```json
{
  "message": "Internal Server Error"
}
```
