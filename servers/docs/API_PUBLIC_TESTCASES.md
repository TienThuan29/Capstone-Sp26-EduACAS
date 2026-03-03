# Execute Public Testcases API

## Endpoint

**POST** `/api/v1/submissions/execute/public-testcases`

## Authorization

Requires authentication with one of the following roles:
- `STUDENT`
- `LECTURER`
- `ADMIN`

## Request Body

```json
{
  "compilerId": "string (required)",
  "lang": "string (required)",
  "runBatchRequest": {
    "source": "string (required)",
    "options": {
      "userArguments": "string (optional)",
      "filters": {
        "execute": true
      },
      "compilerOptions": {},
      "executeParameters": {
        "stdin": "string (optional)",
        "args": ["string (optional)"]
      }
    },
    "stdinList": ["string (required, at least one)"],
    "testCases": [
      {
        "id": "string",
        "problemId": "string",
        "inputData": "string",
        "expectedOutput": "string",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "floatingPointTolerance": null,
        "decimalPlaces": null,
        "isTokenComparision": false,
        "isNotOrderedComparision": null
      }
    ]
  }
}
```

### Request Fields

#### Top Level
- **compilerId** (string, required): The compiler ID from the code-runner service
- **lang** (string, required): Programming language identifier (e.g., "python3", "gdefault", "java")
- **runBatchRequest** (object, required): Batch execution request

#### runBatchRequest
- **source** (string, required): Source code to compile and execute
- **options** (object, required): Compilation and execution options
  - **filters.execute** (boolean): Must be `true` to execute code
  - **executeParameters.stdin** (string, optional): Default stdin (can be overridden by stdinList)
- **stdinList** (array, required): List of input strings, one per test case
- **testCases** (array, required): List of test cases with expected outputs and comparison options

#### TestCase
- **id** (string): Test case identifier
- **problemId** (string): Problem identifier
- **inputData** (string): Input data for this test case
- **expectedOutput** (string): Expected output to compare against
- **isPublic** (boolean): Whether test case is public
- **isCaseInsensitive** (boolean): Case-insensitive comparison
- **isFloatingPoint** (boolean): Floating-point number comparison
- **floatingPointTolerance** (double?, optional): Tolerance for floating-point comparison
- **decimalPlaces** (int?, optional): Decimal places for rounding comparison
- **isTokenComparision** (boolean): Token-based comparison (splits by whitespace)
- **isNotOrderedComparision** (boolean?, optional): Unordered token comparison (sorts tokens)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": [
    {
      "id": "guid",
      "testcaseId": "string",
      "input": "string",
      "actualOutput": "string",
      "expectedOutput": "string",
      "executionTimeMs": 123,
      "status": "SUCCESS | FAIL | TIMEOUT | COMPILE_ERROR | RUNTIME_ERROR | UNKNOWN_ERROR",
      "createdDate": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Note:** `dataResponse` is an array containing one `TestResultResponse` object for each test case in the request. The order matches the order of test cases in the request.

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Error message",
  "dataResponse": null
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to execute public testcases",
  "error": "Detailed error message",
  "dataResponse": null
}
```

## TestcaseStatus Values

- **SUCCESS**: Code compiled, executed successfully, and output matches expected result
- **FAIL**: Code compiled and executed, but output does not match expected result
- **TIMEOUT**: Code execution exceeded time limit
- **COMPILE_ERROR**: Code failed to compile
- **RUNTIME_ERROR**: Code compiled but crashed during execution
- **UNKNOWN_ERROR**: Unexpected error occurred

---

## Examples

### Example 1: SUCCESS - Correct Solution

**Request:**
```json
{
  "compilerId": "gdefault",
  "lang": "c",
  "runBatchRequest": {
    "source": "#include <stdio.h>\nint main() {\n    int a, b;\n    scanf(\"%d %d\", &a, &b);\n    printf(\"%d\\n\", a + b);\n    return 0;\n}",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": ["5 3", "10 20", "100 200"],
    "testCases": [
      {
        "id": "tc-001",
        "problemId": "prob-001",
        "inputData": "5 3",
        "expectedOutput": "8",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      },
      {
        "id": "tc-002",
        "problemId": "prob-001",
        "inputData": "10 20",
        "expectedOutput": "30",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      },
      {
        "id": "tc-003",
        "problemId": "prob-001",
        "inputData": "100 200",
        "expectedOutput": "300",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "testcaseId": "tc-001",
      "input": "5 3",
      "actualOutput": "8",
      "expectedOutput": "8",
      "executionTimeMs": 45,
      "status": "SUCCESS",
      "createdDate": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "testcaseId": "tc-002",
      "input": "10 20",
      "actualOutput": "30",
      "expectedOutput": "30",
      "executionTimeMs": 42,
      "status": "SUCCESS",
      "createdDate": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "testcaseId": "tc-003",
      "input": "100 200",
      "actualOutput": "300",
      "expectedOutput": "300",
      "executionTimeMs": 40,
      "status": "SUCCESS",
      "createdDate": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Example 2: FAIL - Wrong Output

**Request:**
```json
{
  "compilerId": "gdefault",
  "lang": "c",
  "runBatchRequest": {
    "source": "#include <stdio.h>\nint main() {\n    int a, b;\n    scanf(\"%d %d\", &a, &b);\n    printf(\"%d\\n\", a - b);\n    return 0;\n}",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": ["5 3"],
    "testCases": [
      {
        "id": "tc-001",
        "problemId": "prob-001",
        "inputData": "5 3",
        "expectedOutput": "8",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "testcaseId": "tc-001",
    "input": "5 3",
    "actualOutput": "2",
    "expectedOutput": "8",
    "executionTimeMs": 42,
    "status": "FAIL",
    "createdDate": "2024-01-15T10:31:00Z"
  }
}
```

---

### Example 3: COMPILE_ERROR - Syntax Error

**Request:**
```json
{
  "compilerId": "gdefault",
  "lang": "c",
  "runBatchRequest": {
    "source": "#include <stdio.h>\nint main() {\n    int a, b;\n    scanf(\"%d %d\", &a, &b);\n    printf(\"%d\\n\", a + b)\n    return 0;\n}",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": ["5 3"],
    "testCases": [
      {
        "id": "tc-001",
        "problemId": "prob-001",
        "inputData": "5 3",
        "expectedOutput": "8",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "testcaseId": "tc-001",
    "input": "5 3",
    "actualOutput": "",
    "expectedOutput": "8",
    "executionTimeMs": 0,
    "status": "COMPILE_ERROR",
    "createdDate": "2024-01-15T10:32:00Z"
  }
}
```

---

### Example 4: RUNTIME_ERROR - Division by Zero

**Request:**
```json
{
  "compilerId": "gdefault",
  "lang": "c",
  "runBatchRequest": {
    "source": "#include <stdio.h>\nint main() {\n    int a, b;\n    scanf(\"%d %d\", &a, &b);\n    printf(\"%d\\n\", a / b);\n    return 0;\n}",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": ["5 0"],
    "testCases": [
      {
        "id": "tc-002",
        "problemId": "prob-001",
        "inputData": "5 0",
        "expectedOutput": "Error",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "testcaseId": "tc-002",
    "input": "5 0",
    "actualOutput": "",
    "expectedOutput": "Error",
    "executionTimeMs": 0,
    "status": "RUNTIME_ERROR",
    "createdDate": "2024-01-15T10:33:00Z"
  }
}
```

---

### Example 5: TIMEOUT - Infinite Loop

**Request:**
```json
{
  "compilerId": "gdefault",
  "lang": "c",
  "runBatchRequest": {
    "source": "#include <stdio.h>\nint main() {\n    while(1) {}\n    return 0;\n}",
    "options": {
      "filters": {
        "execute": true
      },
      "executeParameters": {
        "stdin": ""
      }
    },
    "stdinList": [""],
    "testCases": [
      {
        "id": "tc-003",
        "problemId": "prob-002",
        "inputData": "",
        "expectedOutput": "",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "testcaseId": "tc-003",
    "input": "",
    "actualOutput": "",
    "expectedOutput": "",
    "executionTimeMs": 5000,
    "status": "TIMEOUT",
    "createdDate": "2024-01-15T10:34:00Z"
  }
}
```

---

### Example 6: SUCCESS - Floating Point Comparison with Tolerance

**Request:**
```json
{
  "compilerId": "gdefault",
  "lang": "c",
  "runBatchRequest": {
    "source": "#include <stdio.h>\n#include <math.h>\nint main() {\n    double x;\n    scanf(\"%lf\", &x);\n    printf(\"%.6f\\n\", sqrt(x));\n    return 0;\n}",
    "options": {
      // "userArguments": "-lm",
      "filters": {
        "execute": true
      },
      "compilerOptions": {},
      "executeParameters": {},
      "tools": [],
      "libraries": []
    },
    "stdinList": ["2.0", "4.0", "9.0"],
    "testCases": [
      {
        "id": "tc-004",
        "problemId": "prob-003",
        "inputData": "2.0",
        "expectedOutput": "1.414214",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": true,
        "floatingPointTolerance": 0.000001,
        "decimalPlaces": 6,
        "isTokenComparision": false
      },
      {
        "id": "tc-005",
        "problemId": "prob-003",
        "inputData": "4.0",
        "expectedOutput": "2.000000",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": true,
        "floatingPointTolerance": 0.000001,
        "decimalPlaces": 6,
        "isTokenComparision": false
      },
      {
        "id": "tc-006",
        "problemId": "prob-003",
        "inputData": "9.0",
        "expectedOutput": "3.000000",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": true,
        "floatingPointTolerance": 0.000001,
        "decimalPlaces": 6,
        "isTokenComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "testcaseId": "tc-004",
      "input": "2.0",
      "actualOutput": "1.414214",
      "expectedOutput": "1.414214",
      "executionTimeMs": 38,
      "status": "SUCCESS",
      "createdDate": "2024-01-15T10:35:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "testcaseId": "tc-005",
      "input": "4.0",
      "actualOutput": "2.000000",
      "expectedOutput": "2.000000",
      "executionTimeMs": 35,
      "status": "SUCCESS",
      "createdDate": "2024-01-15T10:35:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "testcaseId": "tc-006",
      "input": "9.0",
      "actualOutput": "3.000000",
      "expectedOutput": "3.000000",
      "executionTimeMs": 32,
      "status": "SUCCESS",
      "createdDate": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

### Example 7: SUCCESS - Token Comparison (Case Insensitive)

**Request:**
```json
{
  "compilerId": "python3",
  "lang": "python3",
  "runBatchRequest": {
    "source": "s = input()\nprint(s.upper())",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": ["Hello World"],
    "testCases": [
      {
        "id": "tc-005",
        "problemId": "prob-004",
        "inputData": "Hello World",
        "expectedOutput": "HELLO WORLD",
        "isPublic": true,
        "isCaseInsensitive": true,
        "isFloatingPoint": false,
        "isTokenComparision": true,
        "isNotOrderedComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "testcaseId": "tc-005",
    "input": "Hello World",
    "actualOutput": "HELLO WORLD",
    "expectedOutput": "HELLO WORLD",
    "executionTimeMs": 125,
    "status": "SUCCESS",
    "createdDate": "2024-01-15T10:36:00Z"
  }
}
```

---

### Example 8: SUCCESS - Unordered Token Comparison

**Request:**
```json
{
  "compilerId": "python3",
  "lang": "python3",
  "runBatchRequest": {
    "source": "words = input().split()\nprint(' '.join(sorted(words)))",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": ["banana apple cherry"],
    "testCases": [
      {
        "id": "tc-006",
        "problemId": "prob-005",
        "inputData": "banana apple cherry",
        "expectedOutput": "apple banana cherry",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": true,
        "isNotOrderedComparision": true
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "testcaseId": "tc-006",
    "input": "banana apple cherry",
    "actualOutput": "apple banana cherry",
    "expectedOutput": "apple banana cherry",
    "executionTimeMs": 98,
    "status": "SUCCESS",
    "createdDate": "2024-01-15T10:37:00Z"
  }
}
```

---

### Example 9: FAIL - Token Count Mismatch

**Request:**
```json
{
  "compilerId": "python3",
  "lang": "python3",
  "runBatchRequest": {
    "source": "print('Hello')",
    "options": {
      "filters": {
        "execute": true
      }
    },
    "stdinList": [""],
    "testCases": [
      {
        "id": "tc-007",
        "problemId": "prob-006",
        "inputData": "",
        "expectedOutput": "Hello World",
        "isPublic": true,
        "isCaseInsensitive": false,
        "isFloatingPoint": false,
        "isTokenComparision": true,
        "isNotOrderedComparision": false
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440008",
    "testcaseId": "tc-007",
    "input": "",
    "actualOutput": "Hello",
    "expectedOutput": "Hello World",
    "executionTimeMs": 67,
    "status": "FAIL",
    "createdDate": "2024-01-15T10:38:00Z"
  }
}
```

---

### Example 10: UNKNOWN_ERROR - Service Unavailable

**Note:** This status is typically returned when an unexpected error occurs that doesn't fit into the other categories (e.g., network issues, service unavailable, etc.). The exact scenario depends on the implementation and external service behavior.

**Response:**
```json
{
  "success": true,
  "message": "Public testcases executed successfully",
  "dataResponse": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "testcaseId": "tc-008",
    "input": "test",
    "actualOutput": "",
    "expectedOutput": "test",
    "executionTimeMs": 0,
    "status": "UNKNOWN_ERROR",
    "createdDate": "2024-01-15T10:39:00Z"
  }
}
```

---

## Notes

1. **stdinList vs testCases**: The `stdinList` array should have the same length as `testCases` array. Each element in `stdinList` corresponds to the input for the test case at the same index.

2. **Comparison Options**:
   - **isCaseInsensitive**: Converts both outputs to lowercase before comparison
   - **isFloatingPoint**: Treats outputs as floating-point numbers with optional tolerance/decimal places
   - **isTokenComparision**: Splits outputs by whitespace and compares token-by-token
   - **isNotOrderedComparision**: When true with token comparison, sorts tokens before comparison

3. **Execution Time**: The `executionTimeMs` field represents the execution time in milliseconds as reported by the code-runner service.

4. **Error Handling**: If compilation fails, the status will be `COMPILE_ERROR` regardless of test case expectations. Runtime errors (non-zero exit code or stderr output) result in `RUNTIME_ERROR`.
