# BÁO CÁO YÊU CẦU UNIT TEST — DỰ ÁN EDUACAS

> **Phiên bản: 7.0** | Ngày: 23/04/2026
>
> **Mục đích:** Tài liệu mô tả toàn bộ unit test (test từng **HÀM**) cho backend .NET
>
> **Quy ước:**
> - **Mỗi cột = 1 test case.** Cột đầu tiên (bên trái) là tên thực tế của input hoặc precondition.
> - **"O" trong ô** = input/precondition đó **có áp dụng** cho test case đó. Ô trống = không áp dụng.
> - **Giá trị trong ô** = giá trị cụ thể của input đó trong test case đó. Ký hiệu `"—"` = giá trị không thay đổi so với baseline. Ký hiệu `"= TC-XX"` = dùng lại giá trị cùng hàng từ TC-XX.
> - **Phần Precondition** liệt kê tên điều kiện thực tế, đánh dấu "O" cho test case nào cần precondition đó.
> - **Phần Expected Output** nằm dưới divider `---`, mỗi hàng = 1 test case với Expected, Exceptions, Log Messages.
> - **LineOfCode** = số dòng code của hàm (từ dòng signature đến dòng đóng ngoặc cuối cùng).

---

## MỤC LỤC

1. [Quy tắc viết Unit Test](#1-quy-tắc-viết-unit-test)
2. [AuthService — Utils](#2-authservice--utils)
3. [AuthService — Commands](#3-authservice--commands)
4. [AuthService — Queries](#4-authservice--queries)
5. [AcasService — Utils](#5-acasservice--utils)
6. [AcasService — Jobs](#6-acasservice--jobs)
7. [AcasService — Commands](#7-acasservice--commands)
8. [AcasService — Queries](#8-acasservice--queries)
9. [AcasService — CodeRunner](#9-acasservice--coderunner)

---

## 1. QUY TẮC VIẾT UNIT TEST

### 1.1. Cấu trúc bảng test case

**Format bảng chính:**

| Trường | Mô tả |
|--------|--------|
| **LineOfCode** | Số dòng code của hàm (từ dòng signature đến dòng đóng ngoặc cuối cùng). |
| **Input / Precondition** | Bảng kết hợp — cột đầu tiên là tên tham số / tên điều kiện thực tế. Các cột tiếp theo là test case (UTCD-01, UTCD-02...). "O" = có áp dụng. Giá trị cụ thể ghi trực tiếp trong ô. |
| **Expected Output** | Nằm dưới divider `---`. Mỗi hàng = 1 test case: Expected, Exceptions, Log Messages. |

### 1.2. Format code mẫu

```csharp
[Fact]
public async Task MethodName_ValidInput_ReturnsExpectedResult()
{
    // Arrange: setup Precondition (mocks, stubs)
    // Act: gọi hàm với giá trị từ Input Data matrix
    var result = await _sut.MethodName(param1, param2);

    // Assert
    Assert.NotNull(result);
    Assert.Equal(expectedValue, result.SomeProperty);
}

[Fact]
public async Task MethodName_InvalidInput_ThrowsSpecificException()
{
    // Arrange: Precondition + giá trị từ Input Data
    // Act & Assert
    await Assert.ThrowsAsync<SpecificException>(
        () => _sut.MethodName(param1, param2));
}
```

### 1.3. Quy ước ký hiệu trong bảng

| Ký hiệu | Ý nghĩa |
|---------|----------|
| **O** | Input/Precondition này **có áp dụng** cho test case này |
| **(blank)** | Input/Precondition này **không áp dụng** cho test case này |
| **—** | Giá trị không thay đổi so với baseline |
| **= TC-XX** | Dùng lại giá trị cùng hàng từ test case TC-XX |

---

## 2. AUTHSERVICE — UTILS

---

### JwtUtil

**File:** `AuthService/Application/Utils/JwtUtil.cs`

#### `JwtUtil(IConfiguration configuration)`

**LineOfCode:** 8

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **config["Jwt:JwtSecret"]** | null | `""` | `valid-32-char-secret-key-here12345678` |
| **config["Jwt:JwtAccessTokenExpiration"]** | — | — | `"1d"` |
| **config["Jwt:JwtRefreshTokenExpiration"]** | — | — | `"7d"` |
| **config["Jwt:Issuer"]** | — | — | `"AuthService"` |
| **config["Jwt:Audience"]** | — | — | `"Acas"` |
| **IConfiguration service available** | O | O | O |
| **Configuration key Jwt:JwtSecret is present and non-empty** | — | — | O |
| **Configuration key Jwt:JwtAccessTokenExpiration is present** | — | — | O |
| **Configuration key Jwt:JwtRefreshTokenExpiration is present** | — | — | O |
| **Configuration key Jwt:Issuer is present** | — | — | O |
| **Configuration key Jwt:Audience is present** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | — | InvalidOperationException | JWT_SECRET is not configured |
| **UTCD-02** | — | InvalidOperationException | JWT_SECRET is not configured |
| **UTCD-03** | JwtUtil instance created | Instance created successfully, _secret != null | — |

---

#### `string GenerateAccessToken(JwtPayload payload)`

**LineOfCode:** 4

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **payload.Id** | `"u1"` | `"u2"` | `"u1"` | `"u1"` | `"u1"` |
| **payload.Email** | `"a@b.com"` | `"b@c.com"` | `"a@b.com"` | `"special!#$%@test.com"` | `"test@unicode.com"` |
| **payload.Role** | `"User"` | `"Admin"` | `"User"` | `"Super-Admin"` | `"User"` |
| **JwtUtil instantiated with valid config** | O | O | O | O | O |
| **payload.Id is non-null string** | O | O | O | O | O |
| **payload.Email is non-null string** | O | O | O | O | O |
| **payload.Role is non-null string** | O | O | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns non-empty string | Returns JWT string (split('.') length == 3) | — |
| **UTCD-02** | Returns non-empty string | token2 != token1 (different payload) | — |
| **UTCD-03** | Returns non-empty string | Token contains id=u1, email=a@b.com, role=User claims | — |
| **UTCD-04** | Returns non-empty string | split('.') == 3 | — |
| **UTCD-05** | Returns non-empty string | split('.') == 3 | — |

---

#### `string GenerateRefreshToken(JwtPayload payload)`

**LineOfCode:** 4

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **payload.Id** | `"u1"` | `"u1"` | `"u1"` |
| **payload.Email** | `"a@b.com"` | `"a@b.com"` | `"b@c.com"` |
| **payload.Role** | `"User"` | `"User"` | `"Admin"` |
| **JwtUtil instantiated with valid config** | O | O | O |
| **payload.Id is non-null string** | O | O | O |
| **payload.Email is non-null string** | O | O | O |
| **payload.Role is non-null string** | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns non-empty string | split('.') == 3 | — |
| **UTCD-02** | Returns non-empty string | refreshToken.ValidTo > accessToken.ValidTo (default 7d vs 1d) | — |
| **UTCD-03** | Returns non-empty string | claims contain id=u1, role=Admin | — |

---

#### `Task<JwtPayload> VerifyAsync(string token)`

**LineOfCode:** 31

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|
| **token** | `validJWT (signed with _secret)` | `"invalid.token.here"` | `validJWT_modified_at_end` | `expiredJWT (expiration=0s)` | `tokenSignedWithDifferentSecret` | `""` | `null` | `"only.two.parts"` |
| **JwtUtil instantiated with valid secret key** | O | O | O | O | O | O | O | O |
| **Token is a valid JWT string format** | O | — | — | — | — | — | — | — |
| **Token is signed with the configured secret** | O | — | — | — | — | — | — | — |
| **Token is not expired** | O | — | — | — | — | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns JwtPayload | JwtPayload.Id != null, Email != null, Role != null | — |
| **UTCD-02** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-03** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-04** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-05** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-06** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-07** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-08** | — | SecurityTokenException | SecurityTokenException |

---

### HashingUtil (static)

**File:** `AuthService/Application/Utils/HashingUtil.cs`

#### `string HashString(string input, IConfiguration configuration)`

**LineOfCode:** 12

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 | UTCD-10 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **input** | `"test-password"` | `"test-password"` | `"password_a"` | `"mypassword123"` | `"Unicode: 中文测试 français €"` | `""` | `"   "` | `"test-password"` | `"test-password"` | `"test-password"` |
| **configuration["HashingSecretKey"]** | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | `= UTCD-02` | `null` | `""` |
| **configuration["HashingSecretKey"] is present and non-empty** | O | O | O | O | O | O | O | O | — | — |
| **input is a string (can be empty)** | O | O | O | O | O | O | O | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | Returns 64-char lowercase hex (matches ^[0-9a-f]{64}$) | — |
| **UTCD-02** | Returns string | hash1 == hash2 (deterministic for same input) | — |
| **UTCD-03** | Returns string | hash_a != hash_b (different inputs) | — |
| **UTCD-04** | Returns string | hash != input | — |
| **UTCD-05** | Returns string | Returns 64-char hash | — |
| **UTCD-06** | Returns string | Returns 64-char hash (empty string hashed) | — |
| **UTCD-07** | Returns string | Returns 64-char hash (whitespace hashed) | — |
| **UTCD-08** | Returns string | hash == UTCD-02.hash (same input = same output) | — |
| **UTCD-09** | — | InvalidOperationException | InvalidOperationException: HASHING_SECRET_KEY is not configured |
| **UTCD-10** | — | InvalidOperationException | InvalidOperationException: HASHING_SECRET_KEY is not configured |

---

#### `bool VerifyHash(string input, string hash, IConfiguration configuration)`

**LineOfCode:** 8

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **input** | `"correctpassword"` | `"wrongpassword"` | `"password"` | `"password"` | `"PASSWORD"` | `"password"` | `"password"` | `"pass "` | `"test"` |
| **hash** | `HashString("correctpassword", config)` | `HashString("correctpassword", config)` | `"aaa" + "b"*61` | `HashString("password", config_with_secretA)` | `HashString("password", config)` | `""` | `"not-hex-string" + "0"*52` | `HashString("pass", config)` | `HashString("test", config)` |
| **configuration["HashingSecretKey"]** | `valid secret key` | `valid secret key` | `valid secret key` | `different secret key` | `valid secret key` | `valid secret key` | `valid secret key` | `valid secret key` | `null` |
| **configuration["HashingSecretKey"] is present and non-empty** | O | O | O | O | O | O | O | O | — |
| **hash is a 64-char hex string** | O | O | — | O | O | — | — | O | O |
| **input is a string** | O | O | O | O | O | O | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | — | — |
| **UTCD-02** | Returns false | — | — |
| **UTCD-03** | Returns false | — | — |
| **UTCD-04** | Returns false | hash verified with different secret than hash was created | — |
| **UTCD-05** | Returns false | case-sensitive comparison | — |
| **UTCD-06** | Returns false | — | — |
| **UTCD-07** | Returns false | — | — |
| **UTCD-08** | Returns false | trailing space vs no space | — |
| **UTCD-09** | — | InvalidOperationException | InvalidOperationException |

---

### OptGenerator (static)

**File:** `AuthService/Application/Utils/OptGenerator.cs`

#### `string GenerateOpt(int length = 6)`

**LineOfCode:** 4

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **length** | `6 (default, not passed)` | `4` | `10` | `1` | `0` | `100` | `6` | `6` | `20` |
| **None (pure function, no external dependencies)** | O | O | O | O | O | O | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | length == 6 | — |
| **UTCD-02** | Returns string | length == 4 | — |
| **UTCD-03** | Returns string | length == 10 | — |
| **UTCD-04** | Returns string | length == 1 | — |
| **UTCD-05** | Returns string | length == 0 (empty string) | — |
| **UTCD-06** | Returns string | length == 100 | — |
| **UTCD-07** | Returns string | All characters are digits (0-9) | — |
| **UTCD-08** | Returns string | 100 calls produce >= 90 distinct OTPs (randomness) | — |
| **UTCD-09** | Returns string | All digits, length=20 | — |

---

### GoogleTokenVerifier

**File:** `AuthService/Application/Utils/GoogleTokenVerifier.cs`

#### `Constructor GoogleTokenVerifier(IConfiguration configuration, ILogger<GoogleTokenVerifier> logger)`

**LineOfCode:** 5

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **configuration["Google:ClientId"]** | `null` | `""` | `"valid-id.apps.googleusercontent.com"` |
| **logger** | `mock` | `mock` | `mock` |
| **IConfiguration service injected** | O | O | O |
| **ILogger<GoogleTokenVerifier> injected** | O | O | O |
| **Configuration key Google:ClientId is present and non-empty** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | — | InvalidOperationException | InvalidOperationException: Google:ClientId is not configured |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: Google:ClientId is not configured |
| **UTCD-03** | Instance created | Instance created, _clientId != null | — |

---

#### `Task<GoogleTokenPayload> VerifyTokenAsync(string idToken)`

**LineOfCode:** 30

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 | UTCD-10 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **idToken** | `validGoogleIdToken` | `validGoogleIdToken` | `validGoogleIdToken` | `null` | `""` | `"   "` | `"not.a.valid.jwt"` | `tokenForDifferentClientId` | `expiredGoogleToken` | `"only.two.parts"` |
| **GoogleTokenVerifier instantiated with valid ClientId** | O | O | O | O | O | O | O | O | O | O |
| **Google token verification endpoint accessible** | O | O | O | — | — | — | — | — | — | — |
| **idToken is a non-empty valid JWT string** | O | O | O | — | — | — | — | — | — | — |
| **Token is not expired** | O | O | O | — | — | — | — | — | — | — |
| **Token is signed for the configured ClientId** | O | O | O | — | — | — | — | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns GoogleTokenPayload | Email != null, Email is valid format | — |
| **UTCD-02** | Returns GoogleTokenPayload | GoogleId != null | — |
| **UTCD-03** | Returns GoogleTokenPayload | Name != null, Picture != null | — |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |
| **UTCD-05** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |
| **UTCD-06** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |
| **UTCD-07** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |
| **UTCD-08** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |
| **UTCD-09** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |
| **UTCD-10** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |

---

### ResponseUtil (static)

**File:** `AuthService/Application/Utils/ResponseUtil.cs`

#### `ActionResult Success<T>(T dataResponse, string? message = null, int statusCode = 200)`

**LineOfCode:** 17

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **dataResponse** | `{Id:1, Name:"Test"}` | `"simple string"` | `null` | `{Value:42}` | `{Nested:{Value:"x"}, List:[1,2,3]}` | `"ok"` |
| **message** | `null` | — | — | `"Created successfully"` | — | `"Success"` |
| **statusCode** | `200` | `200` | `200` | `201` | `200` | `204` |
| **None (static utility)** | O | O | O | O | O | O |
| **ASP.NET Core ObjectResult/ApiResponse pipeline available** | O | O | O | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ObjectResult | StatusCode == 200, Success == true | — |
| **UTCD-02** | Returns ObjectResult | DataResponse == "simple string" | — |
| **UTCD-03** | Returns ObjectResult | DataResponse == null, Success == true | — |
| **UTCD-04** | Returns ObjectResult | Message == "Created successfully", StatusCode == 201 | — |
| **UTCD-05** | Returns ObjectResult | Nested data preserved in response | — |
| **UTCD-06** | Returns ObjectResult | StatusCode == 204 | — |

---

#### `ActionResult Error<T>(string? message = null, int statusCode = 500, string? error = null, string? stack = null)`

**LineOfCode:** 26

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **message** | `null` | `"Not Found"` | `"Bad Request"` | `"Custom Error"` | `"Error"` | `"Error"` | `"Forbidden"` |
| **statusCode** | `500` | `404` | `400` | `422` | `500` | `500` | `403` |
| **error** | `null` | — | — | `"Detailed validation error"` | `null` | `null` | — |
| **stack** | `null` | — | — | — | `"at Method()" (ASP.NET_ENV=Development)` | `null (ASP.NET_ENV!=Development)` | — |
| **None (static utility)** | O | O | O | O | O | O | O |
| **Environment.GetEnvironmentVariable accessible for stack trace in Development** | O | — | — | — | O | O | — |
| **ASP.NET_ENV == Development** | — | — | — | — | O | — | — |
| **ASP.NET_ENV != Development** | — | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ObjectResult | StatusCode == 500, Message == "Internal Server Error", Success == false | — |
| **UTCD-02** | Returns ObjectResult | StatusCode == 404, Message == "Not Found" | — |
| **UTCD-03** | Returns ObjectResult | StatusCode == 400, Message == "Bad Request" | — |
| **UTCD-04** | Returns ObjectResult | StatusCode == 422, Error == "Detailed validation error" | — |
| **UTCD-05** | Returns ObjectResult | Stack == "at Method()" | — |
| **UTCD-06** | Returns ObjectResult | Stack == null in non-Development | — |
| **UTCD-07** | Returns ObjectResult | StatusCode == 403 | — |

---

## 3. AUTHSERVICE — COMMANDS

---

### UserCommand

**File:** `AuthService/Application/Commands/UserCommand.cs`

#### `Task<AuthResponse> CreateUserAsync(RegisterData registerData)`

**LineOfCode:** 41

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **registerData.Email** | `"new@test.com"` | `"existing@test.com"` | `"new@test.com"` | `"new@test.com"` | `"new@test.com"` | `"a@b.com"` | `"a@b.com"` |
| **registerData.Password** | `"pass123"` | `"pass123"` | `"pass123"` | `"pass123"` | `"pass"` | `"pass123"` | `"pass123"` |
| **registerData.Fullname** | `"New User"` | `"Existing User"` | `"New User"` | `"New User"` | `"Test"` | `"User"` | `"User"` |
| **registerData.Role** | `"STUDENT"` | `"STUDENT"` | `"STUDENT"` | `"STUDENT"` | `"INVALID_ROLE"` | `"LECTURER"` | `"ADMIN"` |
| **registerData.RoleNumber** | `"SE123456"` | `"SE999999"` | `"SE000000"` | `"SE000000"` | `"SE000000"` | `"GV000001"` | `"AD000000"` |
| **IUserRepository.FindByEmailAsync returns null** | O | — | O | O | O | O | O |
| **IUserRepository.FindByEmailAsync returns existing User** | — | O | — | — | — | — | — |
| **IUserRepository.CreateAsync succeeds** | O | — | — | O | — | O | O |
| **IUserRepository.CreateAsync returns null** | — | — | O | — | — | — | — |
| **IEmailService.SendEmailAsync succeeds** | O | — | — | — | — | O | O |
| **IEmailService.SendEmailAsync throws Exception** | — | — | — | O | — | — | — |
| **registerData.Role is a valid Role enum value** | O | — | O | O | — | O | O |
| **registerData.Role is an invalid Role enum value** | — | — | — | — | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns AuthResponse | AccessToken != null, RefreshToken != null, UserProfile.Email == new@test.com | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: User with this email already exists. |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: An error occurred while creating the account |
| **UTCD-04** | Returns AuthResponse (email non-critical) | AuthResponse returned despite email failure | — |
| **UTCD-05** | — | ArgumentException | ArgumentException |
| **UTCD-06** | Returns AuthResponse | UserRole == LECTURER | — |
| **UTCD-07** | Returns AuthResponse | UserRole == ADMIN | — |

---

#### `Task<string> RegisterWithEmailVerificationAsync(RegisterData registerData)`

**LineOfCode:** 30

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **registerData.Email** | `"new@test.com"` | `"existing@test.com"` | `"new@test.com"` | `"new@test.com"` |
| **registerData.Password** | `"pass123"` | `"pass123"` | `"pass123"` | `"pass123"` |
| **registerData.Fullname** | `"User"` | `"User"` | `"User"` | `"User"` |
| **registerData.Role** | `"STUDENT"` | `"STUDENT"` | `"STUDENT"` | `"STUDENT"` |
| **registerData.RoleNumber** | `"SE000000"` | `"SE000000"` | `"SE000000"` | `"SE000000"` |
| **IUserRepository.FindByEmailAsync returns null** | O | — | O | O |
| **IUserOptCacheRepository.SaveAsync returns true** | O | — | — | O |
| **IUserOptCacheRepository.SaveAsync returns false** | — | — | O | — |
| **IEmailService.SendEmailAsync succeeds** | O | — | — | — |
| **IEmailService.SendEmailAsync throws Exception** | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | Returns non-empty registerSession GUID | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: User with this email already exists. |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Failed to save user to cache |
| **UTCD-04** | Returns string | registerSession GUID returned despite email failure | — |

---

#### `Task<bool> VerifyEmailAsync(VerifyEmailRequest verifyEmailRequest)`

**LineOfCode:** 20

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **verifyEmailRequest.RegisterSession** | `"valid-guid-xxxx"` | `"invalid-guid-xxxx"` | `"valid-guid-xxxx"` | `"valid-guid-xxxx"` | `"valid-guid-xxxx"` |
| **verifyEmailRequest.Otp** | `"123456"` | `"123456"` | `"999999"` | `"123456"` | `"654321 (wrong)"` |
| **IUserOptCacheRepository.GetAsync returns UserWithOpt with matching OTP** | O | — | — | — | — |
| **IUserOptCacheRepository.GetAsync returns null** | — | O | — | — | — |
| **IUserOptCacheRepository.GetAsync returns UserWithOpt with mismatched OTP** | — | — | O | O | O |
| **IUserOptCacheRepository.DeleteAsync succeeds** | O | — | — | — | — |
| **IUserRepository.CreateAsync succeeds** | O | — | — | — | — |
| **IUserRepository.CreateAsync returns null** | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | User saved to DB, session deleted from cache | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: Invalid register session |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Invalid register session |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Failed to save user to database |
| **UTCD-05** | — | InvalidOperationException | InvalidOperationException: Invalid register session |

---

#### `Task<bool> SendForgotPasswordLinkAsync(ForgotPasswordRequest forgotPasswordRequest)`

**LineOfCode:** 19

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **forgotPasswordRequest.Email** | `"user@test.com"` | `"nonexistent@test.com"` | `"user@test.com"` | `"user@test.com"` |
| **IUserRepository.FindByEmailAsync returns User** | O | — | O | O |
| **IUserRepository.FindByEmailAsync returns null** | — | O | — | — |
| **IUserCacheRepository.SaveAsync returns true** | O | — | — | O |
| **IUserCacheRepository.SaveAsync returns false** | — | — | O | — |
| **IEmailService.SendEmailAsync succeeds** | O | — | — | — |
| **IEmailService.SendEmailAsync throws Exception** | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | Token saved to cache, email sent | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: User not found |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Failed to save user to cache |
| **UTCD-04** | Returns true (email non-critical) | Token saved to cache despite email failure | — |

---

#### `Task<bool> ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest)`

**LineOfCode:** 15

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **resetPasswordRequest.Token** | `"valid-token-uuid"` | `"invalid-token-uuid"` | `"valid-token-uuid"` |
| **resetPasswordRequest.NewPassword** | `"newpass123"` | `"newpass123"` | `"newpass123"` |
| **IUserCacheRepository.GetAsync returns User** | O | — | O |
| **IUserCacheRepository.GetAsync returns null** | — | O | — |
| **IUserRepository.UpdatePasswordAsync succeeds** | O | — | — |
| **IUserRepository.UpdatePasswordAsync returns null** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | Password updated in DB | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: Invalid token |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Failed to update user password |

---

#### `Task<GrantAccountResponse> GrantAccountAsync(GrantAccountRequest grantAccountRequest)`

**LineOfCode:** 63

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **grantAccountRequest.Email** | `"student@fpt.edu.vn"` | `"lecturer@fpt.edu.vn"` | `"admin@test.com"` | `"existing@test.com"` | `"student@fpt.edu.vn"` | `"student@fpt.edu.vn"` | `"student@fpt.edu.vn"` |
| **grantAccountRequest.Fullname** | `"Student Name"` | `"Lecturer"` | `"Admin"` | `"Existing"` | `"Student"` | `"Student"` | `"Student"` |
| **grantAccountRequest.Role** | `"STUDENT"` | `"LECTURER"` | `"ADMIN"` | `"STUDENT"` | `"STUDENT"` | `"STUDENT"` | `"INVALID_ROLE"` |
| **grantAccountRequest.RoleNumber** | `"SE123456"` | `"GV999999"` | `"AD000000"` | `"SE000000"` | `"SE000000"` | `"SE000000"` | `"SE000000"` |
| **IUserRepository.FindByEmailAsync returns null** | O | O | — | — | O | O | O |
| **IUserRepository.FindByEmailAsync returns existing User** | — | — | — | O | — | — | — |
| **IUserRepository.CreateAsync succeeds** | O | O | — | — | — | O | — |
| **IUserRepository.CreateAsync returns null** | — | — | — | — | O | — | — |
| **IEmailService.SendEmailAsync succeeds** | O | O | — | — | — | — | — |
| **IEmailService.SendEmailAsync throws Exception** | — | — | — | — | — | O | — |
| **grantAccountRequest.Role is STUDENT or LECTURER** | O | O | — | O | O | O | — |
| **grantAccountRequest.Role is ADMIN** | — | — | O | — | — | — | — |
| **grantAccountRequest.Role is an invalid Role enum value** | — | — | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns GrantAccountResponse | TemporaryPassword != null (length=10, mixed chars), FirstLogin == true | — |
| **UTCD-02** | Returns GrantAccountResponse | TemporaryPassword != null, FirstLogin == true, Email sent | — |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Admin can only grant accounts to Lecturer or Student |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: User with this email already exists |
| **UTCD-05** | — | InvalidOperationException | InvalidOperationException: Failed to create user account |
| **UTCD-06** | Returns GrantAccountResponse (email non-critical) | TemporaryPassword returned despite email failure | — |
| **UTCD-07** | — | ArgumentException | ArgumentException (Role enum parse fail) |

---

#### `Task<bool> ResetFirstLoginPasswordAsync(ResetFirstLoginPasswordRequest resetFirstLoginRequest)`

**LineOfCode:** 29

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **resetFirstLoginRequest.Email** | `"user@test.com"` | `"nonexistent@test.com"` | `"user@test.com"` | `"user@test.com"` |
| **resetFirstLoginRequest.NewPassword** | `"newpass123"` | `"newpass123"` | `"newpass123"` | `"newpass123"` |
| **IUserRepository.FindByEmailAsync returns User** | O | — | O | O |
| **IUserRepository.FindByEmailAsync returns null** | — | O | — | — |
| **user.FirstLogin == true** | O | — | — | O |
| **user.FirstLogin == false** | — | — | O | — |
| **IUserRepository.UpdatePasswordAndFirstLoginAsync succeeds** | O | — | — | — |
| **IUserRepository.UpdatePasswordAndFirstLoginAsync returns null** | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | Password updated, FirstLogin set to false | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: User not found |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: This endpoint is only for users on first login |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Failed to reset password |

---

#### `Task<bool> ChangePasswordAsync(string accessToken, ChangePasswordRequest changePasswordRequest)`

**LineOfCode:** 47

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **accessToken** | `validJWT` | `"invalid.token"` | `validJWT_of_deleted_user` | `validJWT` | `validJWT` | `validJWT` | `validJWT` | `validJWT` | `validJWT_of_disabled_user` |
| **changePasswordRequest.CurrentPassword** | `"oldpass"` | `"oldpass"` | `"oldpass"` | `"wrongpass"` | `"oldpass"` | `"oldpass"` | `"oldpass"` | `"oldpass"` | `"oldpass"` |
| **changePasswordRequest.NewPassword** | `"newpass123"` | `"newpass123"` | `"newpass123"` | `"newpass123"` | `"newpass1"` | `"abc" (len=3)` | `"a"*65 (len=65)` | `"newpass123"` | `"newpass123"` |
| **changePasswordRequest.ConfirmPassword** | `"newpass123"` | `"newpass123"` | `"newpass123"` | `"newpass123"` | `"newpass2"` | `"abc"` | `"a"*65` | `"newpass123"` | `"newpass123"` |
| **JwtUtil.VerifyAsync succeeds** | O | — | — | O | O | O | O | O | — |
| **JwtUtil.VerifyAsync throws exception** | — | O | — | — | — | — | — | — | — |
| **IUserRepository.FindByIdAsync returns User with IsEnable=true** | O | — | — | O | O | O | O | O | — |
| **IUserRepository.FindByIdAsync returns null** | — | — | O | — | — | — | — | — | — |
| **IUserRepository.FindByIdAsync returns User with IsEnable=false** | — | — | — | — | — | — | — | — | O |
| **HashingUtil.VerifyHash returns true** | O | — | — | — | — | — | — | O | — |
| **HashingUtil.VerifyHash returns false** | — | — | — | O | — | — | — | — | — |
| **NewPassword == ConfirmPassword** | O | — | — | O | — | O | O | O | — |
| **NewPassword != ConfirmPassword** | — | — | — | — | O | — | — | — | — |
| **Password length is between 5 and 64 characters** | O | — | — | O | — | — | — | O | — |
| **Password length is less than 5 characters** | — | — | — | — | — | O | — | — | — |
| **Password length is greater than 64 characters** | — | — | — | — | — | — | O | — | — |
| **IUserRepository.UpdatePasswordByIdAsync succeeds** | O | — | — | — | — | — | — | O | — |
| **IUserRepository.UpdatePasswordByIdAsync returns null** | — | — | — | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | Password updated, LogInformation: User u1 changed their password | — |
| **UTCD-02** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: User not found |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Current password is incorrect |
| **UTCD-05** | — | InvalidOperationException | InvalidOperationException: New password and confirm password do not match |
| **UTCD-06** | — | InvalidOperationException | InvalidOperationException: New password must be between 5 and 64 characters |
| **UTCD-07** | — | InvalidOperationException | InvalidOperationException: New password must be between 5 and 64 characters |
| **UTCD-08** | — | InvalidOperationException | InvalidOperationException: Failed to update password |
| **UTCD-09** | — | InvalidOperationException | InvalidOperationException: User not found |

---

#### `Task<UserProfileResponse> UpdateUserAsync(string userId, string? fullname, string? roleNumber, Role? role, bool? isEnable)`

**LineOfCode:** 17

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **userId** | `"u1"` | `"u1"` | `"u1"` |
| **fullname** | `"New Name"` | `null` | `"Name"` |
| **roleNumber** | `"SE999999"` | `null` | `"SE000000"` |
| **role** | `Role.LECTURER` | `null` | `Role.STUDENT` |
| **isEnable** | `true` | `null` | `false` |
| **IUserRepository.UpdateUserAsync succeeds** | O | O | — |
| **IUserRepository.UpdateUserAsync returns null** | — | — | O |
| **All parameters can be null (indicating no update)** | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns UserProfileResponse | Fullname==New Name, RoleNumber==SE999999, Role==LECTURER, IsEnable==true | — |
| **UTCD-02** | Returns UserProfileResponse | Fields unchanged (null = no update) | — |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Failed to update user |

---

#### `Task<UserProfileResponse> UpdateProfileAsync(string accessToken, string? fullname, DateTime? birthday, string? avatarUrl)`

**LineOfCode:** 19

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **accessToken** | `validJWT` | `"invalid.token"` | `validJWT_of_disabled_user` | `validJWT` | `validJWT` |
| **fullname** | `"New Name"` | `"Name"` | `"Name"` | `"Name"` | `null` |
| **birthday** | `DateTime(1990,1,1)` | `null` | `null` | `null` | `DateTime(2000,12,31)` |
| **avatarUrl** | `"https://example.com/avatar.png"` | `null` | `null` | `null` | `null` |
| **JwtUtil.VerifyAsync succeeds** | O | — | — | O | O |
| **JwtUtil.VerifyAsync throws exception** | — | O | — | — | — |
| **IUserRepository.FindByIdAsync returns User with IsEnable=true** | O | — | — | O | O |
| **IUserRepository.FindByIdAsync returns User with IsEnable=false** | — | — | O | — | — |
| **IUserRepository.UpdateProfileAsync succeeds** | O | — | — | — | O |
| **IUserRepository.UpdateProfileAsync returns null** | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns UserProfileResponse | Fullname, Birthday, AvatarUrl updated | — |
| **UTCD-02** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: User not found or inactive |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Failed to update profile |
| **UTCD-05** | Returns UserProfileResponse | Birthday updated, Fullname unchanged | — |

---

## 4. AUTHSERVICE — QUERIES

---

### UserQuery

**File:** `AuthService/Application/Queries/UserQuery.cs`

#### `Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials)`

**LineOfCode:** 47

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **credentials.Email** | `"user@test.com"` | `"nonexistent@test.com"` | `"user@test.com"` | `"disabled@test.com"` | `"firstlogin@test.com"` |
| **credentials.Password** | `"correctpass"` | `"pass"` | `"wrongpass"` | `"pass"` | `"pass"` |
| **IUserRepository.FindByEmailAsync returns User** | O | — | O | O | O |
| **IUserRepository.FindByEmailAsync returns null** | — | O | — | — | — |
| **User.IsEnable == true** | O | — | O | — | O |
| **User.IsEnable == false** | — | — | — | O | — |
| **User.FirstLogin == true** | — | — | — | — | O |
| **User.FirstLogin == false** | O | — | O | O | — |
| **HashingUtil.VerifyHash returns true (correct password)** | O | — | — | — | O |
| **HashingUtil.VerifyHash returns false (wrong password)** | — | — | O | — | — |
| **JwtUtil available** | O | — | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns AuthResponse | AccessToken != null, RefreshToken != null, FirstLogin == false | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: Invalid email or password |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Invalid email or password |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: User is forbidden |
| **UTCD-05** | Returns AuthResponse | FirstLogin == true | — |

---

#### `Task<AuthResponse> AuthenticateWithGoogleAsync(string idToken)`

**LineOfCode:** 52

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **idToken** | `validGoogleToken` | `validGoogleToken` | `validGoogleToken` | `validGoogleToken` | `validGoogleToken` | `"invalid.google.token"` |
| **GoogleTokenVerifier.VerifyTokenAsync succeeds** | O | O | O | O | O | — |
| **GoogleTokenVerifier.VerifyTokenAsync throws exception** | — | — | — | — | — | O |
| **IUserRepository.FindByEmailAsync returns User** | O | — | O | O | O | — |
| **IUserRepository.FindByEmailAsync returns null** | — | O | — | — | — | — |
| **User.GoogleId matches token's GoogleId** | O | — | — | — | — | — |
| **User.GoogleId does not match token's GoogleId** | — | — | O | — | — | — |
| **User.GoogleId is null** | — | — | — | O | — | — |
| **User.IsEnable == true** | O | — | O | O | O | — |
| **User.IsEnable == false** | — | — | — | — | — | — |
| **UpdateGoogleIdAsync succeeds** | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns AuthResponse | AccessToken != null, RefreshToken != null | — |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: User not found with this email |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: User is forbidden |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Google ID does not match this account |
| **UTCD-05** | Returns AuthResponse | UpdateGoogleIdAsync called with gid123 | — |
| **UTCD-06** | — | InvalidOperationException | InvalidOperationException: Invalid Google token |

---

#### `Task<UserProfileResponse> GetProfileAsync(string accessToken)`

**LineOfCode:** 21

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **accessToken** | `validJWT` | `"invalid.token"` | `validJWT_of_deleted_user` | `validJWT_of_disabled_user` |
| **JwtUtil.VerifyAsync succeeds** | O | — | — | — |
| **JwtUtil.VerifyAsync throws exception** | — | O | — | — |
| **IUserRepository.FindByIdAsync returns User** | O | — | — | — |
| **IUserRepository.FindByIdAsync returns null** | — | — | O | — |
| **User.IsEnable == true** | O | — | — | — |
| **User.IsEnable == false** | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns UserProfileResponse | Id==u1, IsEnable==true | — |
| **UTCD-02** | — | SecurityTokenException | SecurityTokenException |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: User not found or inactive |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: User not found or inactive |

---

#### `Task<List<UserProfileResponse>> GetAllUsersAsync()`

**LineOfCode:** 13

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **IUserRepository.FindAllAsync returns list** | O | — |
| **IUserRepository.FindAllAsync returns empty list** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<UserProfileResponse> | Count == 3 | — |
| **UTCD-02** | Returns List<UserProfileResponse> | Count == 0 | — |

---

#### `Task<PagedResult<UserProfileResponse>> GetPagedUsersAsync(int pageIndex, int pageSize, string? searchTerm = null, string? role = null, bool? isEnable = null)`

**LineOfCode:** 14

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **pageIndex** | `1` | `1` | `1` | `1` | `1` | `2` |
| **pageSize** | `10` | `10` | `10` | `10` | `10` | `10` |
| **searchTerm** | `null` | `"@fpt.edu.vn"` | `null` | `null` | `"xyznotexist999"` | `null` |
| **role** | `null` | `null` | `"STUDENT"` | `null` | `null` | `null` |
| **isEnable** | `null` | `null` | `null` | `false` | `null` | `null` |
| **IUserRepository.FindPagedAsync returns (items, totalCount)** | O | O | O | O | O | O |
| **pageIndex is valid** | O | O | O | O | O | O |
| **pageSize is valid** | O | O | O | O | O | O |
| **searchTerm is null or empty** | O | — | O | O | — | O |
| **searchTerm contains filter text** | — | O | — | — | O | — |
| **role is null or empty** | O | O | — | O | O | O |
| **role filters by specific role** | — | — | O | — | — | — |
| **isEnable is null** | O | O | O | — | O | O |
| **isEnable filters by true/false** | — | — | — | O | — | — |
| **page returns data** | O | O | O | O | — | O |
| **page returns no data (beyond results)** | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult | Items.Count == 10, TotalCount == 25 | — |
| **UTCD-02** | Returns PagedResult | All users have email containing @fpt.edu.vn | — |
| **UTCD-03** | Returns PagedResult | All users have Role==STUDENT | — |
| **UTCD-04** | Returns PagedResult | All users have IsEnable==false | — |
| **UTCD-05** | Returns PagedResult | Items == [], TotalCount == 0 | — |
| **UTCD-06** | Returns PagedResult | Items.Count == 5, TotalCount == 25 | — |

---

#### `Task<CheckEmailExistsResponse> CheckEmailExistsAsync(string email)`

**LineOfCode:** 17

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **email** | `"existing@test.com"` | `"new@test.com"` | `"user@FPT.EDU.VN"` |
| **IUserRepository.FindByEmailAsync returns User** | O | — | O |
| **IUserRepository.FindByEmailAsync returns null** | — | O | — |
| **Email lookup is case-insensitive** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns CheckEmailExistsResponse | Exists == true, Message == null | — |
| **UTCD-02** | Returns CheckEmailExistsResponse | Exists == false, Message == "Email not found in the system" | — |
| **UTCD-03** | Returns CheckEmailExistsResponse | Exists == true (case-insensitive lookup) | — |

---

## 5. ACASSERVICE — UTILS

---

### ResultComparator

**File:** `AcasService/Application/Commands/Submission/ResultComparator.cs`

#### `TestcaseStatus Compare(string expectedOutput, string output, TestcaseOption option)`

**LineOfCode:** 50

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 | UTCD-10 | UTCD-11 | UTCD-12 | UTCD-13 | UTCD-14 | UTCD-15 | UTCD-16 | UTCD-17 | UTCD-18 | UTCD-19 | UTCD-20 | UTCD-21 | UTCD-22 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **expectedOutput** | `"Hello World"` | `"Hello"` | `"HELLO"` | `"HELLO"` | `"3.14159"` | `"3.14"` | `"3.14"` | `"foo bar baz"` | `"foo bar baz"` | `"foo bar"` | `"cat dog bird"` | `"cat dog bird"` | `""` | `""` | `"abc"` | `"3,14"` | `"  Hello  World  "` | `"a\nb\nc"` | `"0.1 + 0.2"` | `"0.0"` | `"1.23456"` | `"1.23456"` |
| **output** | `"Hello World"` | `"World"` | `"hello"` | `"WORLD"` | `"3.14160"` | `"3.20"` | `"3.14"` | `"foo bar baz"` | `"foo baz bar"` | `"foo bar baz"` | `"dog bird cat"` | `"cat dog"` | `""` | `"result"` | `"def"` | `"3.14"` | `"Hello World"` | `"a b c"` | `"0.3"` | `"0.0"` | `"1.23457"` | `"1.23457"` |
| **option.IsTokenComparision** | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `true` | `true` | `true` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | `true` | `false` | `false` | `false` | `false` |
| **option.IsFloatingPoint** | `false` | `false` | `false` | `false` | `true` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `true` | `true` | `false` | `false` | `true` | `true` | `true` | `true` |
| **option.IsCaseInsensitive** | `false` | `false` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` |
| **option.IsNotOrderedComparision** | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | `false` |
| **option.FloatingPointTolerance** | — | — | — | — | `0.0001` | `0.01` | `0.01` | — | — | — | — | — | — | — | — | — | — | — | `null` | `null` | — | — |
| **option.DecimalPlaces** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | `3` | `4` |
| **expectedOutput == output (exact match)** | O | — | — | — | — | — | O | O | — | — | — | — | O | — | — | — | — | — | — | O | — | — |
| **expectedOutput != output** | — | O | — | O | — | O | — | — | O | O | — | O | — | O | O | — | — | — | O | — | — | O |
| **Token count matches** | — | — | — | — | — | — | — | — | — | O | O | — | — | — | — | — | — | O | — | — | — | — |
| **Token count mismatches** | — | — | — | — | — | — | — | — | — | — | — | O | — | — | — | — | — | — | — | — | — | — |
| **comma decimal separator used** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | O | — | — | — | — | — | — |
| **Near-zero floating point values** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | O | — | — |
| **Epsilon comparison needed** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | O | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns SUCCESS | — | — |
| **UTCD-02** | Returns FAIL | — | — |
| **UTCD-03** | Returns SUCCESS | — | — |
| **UTCD-04** | Returns FAIL | — | — |
| **UTCD-05** | Returns SUCCESS | diff <= 0.0001 | — |
| **UTCD-06** | Returns FAIL | diff > 0.01 | — |
| **UTCD-07** | Returns SUCCESS | — | — |
| **UTCD-08** | Returns SUCCESS | — | — |
| **UTCD-09** | Returns FAIL | token order matters | — |
| **UTCD-10** | Returns FAIL | token count mismatch (2 vs 3) | — |
| **UTCD-11** | Returns SUCCESS | tokens sorted before compare | — |
| **UTCD-12** | Returns FAIL | token count mismatch | — |
| **UTCD-13** | Returns SUCCESS | — | — |
| **UTCD-14** | Returns FAIL | — | — |
| **UTCD-15** | Returns FAIL | non-numeric strings | — |
| **UTCD-16** | Returns SUCCESS | comma replaced with dot | — |
| **UTCD-17** | Returns SUCCESS | leading/trailing whitespace trimmed | — |
| **UTCD-18** | Returns SUCCESS | whitespace normalized in token mode | — |
| **UTCD-19** | Returns FAIL | epsilon comparison: 0.1+0.2 != 0.3 in binary | — |
| **UTCD-20** | Returns SUCCESS | near-zero values pass epsilon check | — |
| **UTCD-21** | Returns SUCCESS | rounded to 3 decimal places | — |
| **UTCD-22** | Returns FAIL | rounded values differ at 5th decimal | — |

---

### TextAnswerComparer (static)

**File:** `AcasService/Application/Utils/TextAnswerComparer.cs`

#### `string NormalizeSingleChoice(string? answer)`

**LineOfCode:** 9

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **answer** | `"  Hello World  "` | `null` | `"   "` | `"Tôi YÊU em"` | `"Mixed CaSe"` | `""` |
| **None (static pure function)** | O | O | O | O | O | O |
| **answer is not null** | O | — | O | O | O | O |
| **answer is null** | — | O | — | — | — | — |
| **answer contains only whitespace** | — | — | O | — | — | — |
| **answer contains Unicode characters** | — | — | — | O | — | — |
| **answer contains mixed case** | O | — | — | O | O | — |
| **answer is empty string** | — | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | "HELLO WORLD" (trimmed, uppercase) | — |
| **UTCD-02** | Returns string | "" (empty) | — |
| **UTCD-03** | Returns string | "" (whitespace-only → empty) | — |
| **UTCD-04** | Returns string | "TÔI YÊU EM" (Unicode preserved, uppercase) | — |
| **UTCD-05** | Returns string | "MIXED CASE" | — |
| **UTCD-06** | Returns string | "" | — |

---

#### `string NormalizeMultipleChoice(string? answer)`

**LineOfCode:** 12

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|
| **answer** | `"C, A, B"` | `"[\"X\", \"Y\", \"Z\"]"` | `"A, A, B, A"` | `"[bad json"` | `null` | `""` | `"X|Y|Z"` | `"[\"A\", \"B\"]\nC;D"` |
| **None (static pure function)** | O | O | O | O | O | O | O | O |
| **answer is comma-delimited string** | O | — | O | — | — | — | — | — |
| **answer is valid JSON array string** | — | O | — | — | — | — | — | O |
| **answer contains duplicate items** | — | — | O | — | — | — | — | — |
| **answer is malformed JSON** | — | — | — | O | — | — | — | — |
| **answer is pipe-delimited string** | — | — | — | — | — | — | O | — |
| **answer contains mixed delimiters** | — | — | — | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | "A\|B\|C" (sorted, delimited by \|) | — |
| **UTCD-02** | Returns string | "X\|Y\|Z" (JSON array parsed, sorted) | — |
| **UTCD-03** | Returns string | "A\|B" (duplicates removed, sorted) | — |
| **UTCD-04** | Returns string | "BAD\|JSON" (malformed JSON → fallback to delimiter split) | — |
| **UTCD-05** | Returns string | "" | — |
| **UTCD-06** | Returns string | "" | — |
| **UTCD-07** | Returns string | "X\|Y\|Z" (sorted: X\|Y\|Z) | — |
| **UTCD-08** | Returns string | "A\|B\|C\|D" (JSON + delimiters) | — |

---

#### `bool CompareSingleChoice(string? expectedAnswer, string? submittedAnswer)`

**LineOfCode:** 3

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **expectedAnswer** | `"A"` | `"A"` | `"A"` | `null` | `null` | `""` | `""` |
| **submittedAnswer** | `"a"` | `"B"` | `"  a  "` | `null` | `"A"` | `""` | `" "` |
| **Both inputs normalized via NormalizeSingleChoice** | O | O | O | O | O | O | O |
| **Both answers are null** | — | — | — | O | — | — | — |
| **expectedAnswer is null, submittedAnswer is not null** | — | — | — | — | O | — | — |
| **expectedAnswer is not null, submittedAnswer is null** | — | — | — | — | — | — | — |
| **Normalized values match (same)** | O | — | O | O | — | O | O |
| **Normalized values differ** | — | O | — | — | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | normalized both to "A" | — |
| **UTCD-02** | Returns false | normalized differ | — |
| **UTCD-03** | Returns true | whitespace trimmed | — |
| **UTCD-04** | Returns true | both null → "" == "" | — |
| **UTCD-05** | Returns false | "" != "A" | — |
| **UTCD-06** | Returns true | both empty → equal | — |
| **UTCD-07** | Returns true | "" == "" (whitespace-only → empty) | — |

---

#### `bool CompareMultipleChoice(string? expectedAnswer, string? submittedAnswer)`

**LineOfCode:** 3

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **expectedAnswer** | `"A,B"` | `"A,B"` | `"X,Y,Z"` | `"A,B"` | `"A,B,C"` | `"A,B"` | `null` |
| **submittedAnswer** | `"b,a"` | `"A,C"` | `"Z,X,Y"` | `"A"` | `"A,B,C"` | `"[\"B\",\"A\"]"` | `null` |
| **Both inputs normalized via NormalizeMultipleChoice** | O | O | O | O | O | O | O |
| **Normalized values match (same items, same count)** | O | — | O | — | O | O | — |
| **Normalized values differ** | — | O | — | O | — | — | — |
| **Order differs but items same** | O | — | O | — | — | — | — |
| **Item count differs** | — | — | — | O | — | — | — |
| **JSON array vs delimiter format** | — | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | "A\|B" == "A\|B" (normalized, sorted) | — |
| **UTCD-02** | Returns false | "A\|B" != "A\|C" | — |
| **UTCD-03** | Returns true | order-independent comparison | — |
| **UTCD-04** | Returns false | "A\|B" != "A" (different count) | — |
| **UTCD-05** | Returns true | exact match | — |
| **UTCD-06** | Returns true | JSON array vs delimiter | — |
| **UTCD-07** | Returns false | null → "" != "" (different from empty) | — |

---

#### `bool CompareByQuestionType(QuestionType questionType, string? expectedAnswer, string? submittedAnswer)`

**LineOfCode:** 8

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **questionType** | `QuestionType.SINGLE_CHOICE` | `QuestionType.MULTIPLE_CHOICE` | `QuestionType.ESSAY` | `QuestionType.SHORT_ANSWER` | `QuestionType.SINGLE_CHOICE` | `QuestionType.MULTIPLE_CHOICE` |
| **expectedAnswer** | `"A"` | `"A,B"` | `"some text"` | `"answer"` | `null` | `null` |
| **submittedAnswer** | `"a"` | `"a,b"` | `"some text"` | `"answer"` | `null` | `null` |
| **questionType is enum value** | O | O | O | O | O | O |
| **questionType == QuestionType.SINGLE_CHOICE** | O | — | — | — | O | — |
| **questionType == QuestionType.MULTIPLE_CHOICE** | — | O | — | — | — | O |
| **questionType == QuestionType.ESSAY** | — | — | O | — | — | — |
| **questionType == QuestionType.SHORT_ANSWER** | — | — | — | O | — | — |
| **Both answers are null** | — | — | — | — | O | O |
| **CompareSingleChoice returns true** | O | — | — | — | O | — |
| **CompareMultipleChoice returns false** | — | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | calls CompareSingleChoice | — |
| **UTCD-02** | Returns true | calls CompareMultipleChoice | — |
| **UTCD-03** | Returns false | ESSAY type not handled → false | — |
| **UTCD-04** | Returns false | SHORT_ANSWER not handled → false | — |
| **UTCD-05** | Returns true | CompareSingleChoice(null, null) == true | — |
| **UTCD-06** | Returns false | CompareMultipleChoice(null, null) → "" vs "" → false? | — |

---

## 6. ACASSERVICE — JOBS

---

### ClassroomQuizJobScheduling

**File:** `AcasService/Application/Jobs/ClassroomQuizJobScheduling.cs`

#### `Task<string> ScheduleCloseJobAsync(string classroomQuizId, DateTime closeTime)`

**LineOfCode:** 13

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **classroomQuizId** | `"cq1"` | `"cq1"` | `"cq1"` |
| **closeTime** | `DateTime.UtcNow.AddMinutes(30)` | `DateTime.UtcNow.AddMinutes(-5) (past)` | `DateTime.UtcNow.AddMinutes(1)` |
| **IBackgroundJobClient available** | O | O | O |
| **Hangfire scheduling available** | O | O | O |
| **closeTime is in the future** | O | — | O |
| **closeTime is in the past** | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | Returns jobId (format: hangfire-job-id) | — |
| **UTCD-02** | Returns string | delay == 0, CloseQuizAsync scheduled immediately | — |
| **UTCD-03** | Returns string | delay > 0, job scheduled for future | — |

---

#### `Task CancelCloseJobAsync(string jobId)`

**LineOfCode:** 7

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **jobId** | `"hangfire-job-id-123"` | `null or ""` |
| **IBackgroundJobClient available** | O | O |
| **jobId is non-null and non-empty** | O | — |
| **jobId is null or empty** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | job deleted from Hangfire | — |
| **UTCD-02** | Returns void | early return (no-op) | — |

---

#### `Task<string> RescheduleCloseJobAsync(string? oldJobId, string classroomQuizId, DateTime newCloseTime)`

**LineOfCode:** 8

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **oldJobId** | `"old-job-id"` | `null` |
| **classroomQuizId** | `"cq1"` | `"cq1"` |
| **newCloseTime** | `DateTime.UtcNow.AddHours(1)` | `DateTime.UtcNow.AddHours(1)` |
| **IBackgroundJobClient available** | O | O |
| **oldJobId is non-null (existing job to cancel)** | O | — |
| **oldJobId is null (no existing job)** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | old job cancelled, new job scheduled | — |
| **UTCD-02** | Returns string | no cancel, new job scheduled | — |

---

#### `Task<string> ScheduleStartJobAsync(string classroomQuizId, DateTime startTime)`

**LineOfCode:** 13

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **classroomQuizId** | `"cq1"` | `"cq1"` |
| **startTime** | `DateTime.UtcNow.AddMinutes(30)` | `DateTime.UtcNow.AddMinutes(-5) (past)` |
| **IBackgroundJobClient available** | O | O |
| **startTime is in the future** | O | — |
| **startTime is in the past** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | Returns jobId | — |
| **UTCD-02** | Returns string | delay == 0, OpenQuizAsync scheduled immediately | — |

---

#### `Task CancelStartJobAsync(string jobId)`

**LineOfCode:** 7

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **jobId** | `"hangfire-job-id-456"` | `null or ""` |
| **IBackgroundJobClient available** | O | O |
| **jobId is non-null and non-empty** | O | — |
| **jobId is null or empty** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | job deleted | — |
| **UTCD-02** | Returns void | early return (no-op) | — |

---

#### `Task<string> RescheduleStartJobAsync(string? oldJobId, string classroomQuizId, DateTime newStartTime)`

**LineOfCode:** 8

**Input / Precondition:**

| | UTCD-01 |
|---|---------|
| **oldJobId** | `"old-job-id"` |
| **classroomQuizId** | `"cq1"` |
| **newStartTime** | `DateTime.UtcNow.AddHours(1)` |
| **IBackgroundJobClient available** | O |
| **oldJobId is non-null** | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns string | old cancelled, new scheduled | — |

---

#### `Task OpenQuizAsync(string classroomQuizId)`

**LineOfCode:** 28

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **classroomQuizId** | `"cq1"` | `"nonexistent"` | `"cq1"` | `"cq1"` |
| **IClassroomQuizRepository.FindByIdAsync available** | O | O | O | O |
| **IClassroomQuizRepository.UpdateAsync available** | O | — | O | O |
| **ClassroomQuiz found by FindByIdAsync** | O | — | O | O |
| **ClassroomQuiz not found** | — | O | — | — |
| **ClassroomQuiz.Status == PUBLISHED** | O | — | — | — |
| **ClassroomQuiz.Status == ONGOING** | — | — | O | — |
| **ClassroomQuiz.Status == DRAFT** | — | — | — | O |
| **UpdateAsync succeeds** | O | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | Status == ONGOING | — |
| **UTCD-02** | Returns void | no-op, LogWarning | — |
| **UTCD-03** | Returns void | no-op (already ONGOING) | — |
| **UTCD-04** | Returns void | no-op (not PUBLISHED) | — |

---

#### `Task CloseQuizAsync(string classroomQuizId)`

**LineOfCode:** 43

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **classroomQuizId** | `"cq1"` | `"cq1"` | `"cq1"` | `"nonexistent"` |
| **IClassroomQuizRepository.FindByIdAsync available** | O | O | O | O |
| **IClassroomQuizRepository.UpdateAsync available** | O | O | O | — |
| **IQuizAttemptRepository.FindByClassroomQuizIdAsync available** | O | O | O | — |
| **ClassroomQuiz found** | O | O | O | — |
| **ClassroomQuiz not found** | — | — | — | O |
| **ClassroomQuiz.Status == ONGOING** | O | — | — | — |
| **ClassroomQuiz.Status == PUBLISHED** | — | O | — | — |
| **ClassroomQuiz.Status == CLOSED** | — | — | O | — |
| **Attempts found with Status == INPROGRESS** | — | O | — | — |
| **No INPROGRESS attempts** | O | — | — | — |
| **UpdateAsync succeeds** | O | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | Status == CLOSED | — |
| **UTCD-02** | Returns void | Status == CLOSED, INPROGRESS attempt auto-submitted | — |
| **UTCD-03** | Returns void | no-op (already CLOSED) | — |
| **UTCD-04** | Returns void | no-op | — |

---

### ExaminationJobScheduling

**File:** `AcasService/Application/Jobs/ExaminationJobScheduling.cs`

#### `void ScheduleJobs(string examId, DateTime startDatetime, DateTime endDatetime)`

**LineOfCode:** 65

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **examId** | `"e1"` | `"e1"` | `"e1"` | `"e1"` | `"e1"` | `null or ""` |
| **startDatetime** | `DateTime.UtcNow.AddHours(1)` | `DateTime.UtcNow.AddMinutes(-10) (past)` | `DateTime.UtcNow.AddHours(1)` | `DateTime.UtcNow.AddHours(1)` | `DateTime.UtcNow.AddMinutes(-5) (past)` | `DateTime.UtcNow.AddHours(1)` |
| **endDatetime** | `DateTime.UtcNow.AddHours(3)` | `DateTime.UtcNow.AddHours(3)` | `DateTime.UtcNow.AddMinutes(-5) (past)` | `DateTime.UtcNow.AddHours(3)` | `DateTime.UtcNow.AddMinutes(-1) (past)` | `DateTime.UtcNow.AddHours(3)` |
| **IBackgroundJobClient available** | O | O | O | O | O | O |
| **ASP.NET Core DI available** | O | O | O | O | O | O |
| **examId is non-null and non-empty** | O | O | O | O | O | — |
| **examId is null or empty** | — | — | — | — | — | O |
| **startDatetime is in the future** | O | — | O | O | — | O |
| **startDatetime is in the past** | — | O | — | — | O | — |
| **endDatetime is after startDatetime** | O | O | — | O | — | O |
| **endDatetime is before or equal to startDatetime** | — | — | O | — | — | — |
| **Both startDatetime and endDatetime are in the past** | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | 2 jobs scheduled (OPEN + COMPLETE) | — |
| **UTCD-02** | Returns void | OPEN job fires immediately (TimeSpan.Zero), COMPLETE scheduled | — |
| **UTCD-03** | — | ArgumentException | ArgumentException: StartDatetime must not be after EndDatetime |
| **UTCD-04** | Returns void | OPEN delay == 1h, COMPLETE delay == 3h | — |
| **UTCD-05** | Returns void | no jobs scheduled (exam already expired) | — |
| **UTCD-06** | — | ArgumentNullException | ArgumentNullException |

---

#### `void CancelJobs(string examId)`

**LineOfCode:** 12

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **examId** | `"e1"` | `"e1"` |
| **IBackgroundJobClient available** | O | O |
| **Both jobs exist** | O | — |
| **No jobs exist** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | 2 Delete calls (exam-open:e1, exam-complete:e1) | — |
| **UTCD-02** | Returns void | Delete called but returns false (non-critical) | — |

---

#### `void RescheduleJobs(string examId, DateTime newStartDatetime, DateTime newEndDatetime)`

**LineOfCode:** 5

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **examId** | `"e1"` | `"e1"` |
| **newStartDatetime** | `DateTime.UtcNow.AddHours(2)` | `DateTime.UtcNow.AddHours(2)` |
| **newEndDatetime** | `DateTime.UtcNow.AddHours(4)` | `DateTime.UtcNow.AddHours(1) (start > end)` |
| **IBackgroundJobClient available** | O | O |
| **newStartDatetime is before newEndDatetime** | O | — |
| **newStartDatetime is after newEndDatetime** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | CancelJobs called, then ScheduleJobs called | — |
| **UTCD-02** | — | ArgumentException | ArgumentException |

---

#### `Task MarkExamAsOpenAsync(string examId)`

**LineOfCode:** 49

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **examId** | `"e1"` | `"nonexistent"` | `"e1"` | `"e1"` |
| **IExaminationRepository.GetByIdAsync available** | O | O | O | O |
| **IExaminationRepository.UpdateAsync available** | O | — | O | O |
| **Exam found** | O | — | O | O |
| **Exam not found** | — | O | — | — |
| **Exam.Status == PENDING** | O | — | — | — |
| **Exam.Status == ONGOING** | — | — | O | — |
| **Exam.Status == COMPLETED** | — | — | — | O |
| **UpdateAsync succeeds** | O | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | Status == ONGOING | — |
| **UTCD-02** | Returns void | no-op | — |
| **UTCD-03** | Returns void | no-op (already ONGOING) | — |
| **UTCD-04** | Returns void | no-op (already COMPLETED) | — |

---

#### `Task MarkExamAsCompletedAsync(string examId)`

**LineOfCode:** 42

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **examId** | `"e1"` | `"nonexistent"` | `"e1"` | `"e1"` |
| **IExaminationRepository.GetByIdAsync available** | O | O | O | O |
| **IExaminationRepository.UpdateAsync available** | O | — | O | O |
| **Exam found** | O | — | O | O |
| **Exam not found** | — | O | — | — |
| **Exam.Status == ONGOING** | O | — | — | — |
| **Exam.Status == COMPLETED** | — | — | O | — |
| **Exam.Status == PENDING** | — | — | — | O |
| **UpdateAsync succeeds** | O | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | Status == COMPLETED | — |
| **UTCD-02** | Returns void | no-op | — |
| **UTCD-03** | Returns void | no-op (already COMPLETED) | — |
| **UTCD-04** | Returns void | Status transitions from PENDING to COMPLETED (skipped ONGOING) | — |

---

## 7. ACASSERVICE — COMMANDS

---

### SubmissionCommand

**File:** `AcasService/Application/Commands/Submission/SubmissionCommand.cs`

#### `Task<SubmissionResponse?> SubmitProblemAsync(SubmitProblemRequest request)`

**LineOfCode:** 43

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **request.StudentId** | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` |
| **request.ExamId** | `"e1"` | `"e1"` | `"e1"` | `"e1"` | `"e1"` | `"nonexistent"` |
| **request.ProblemId** | `"p1"` | `"p1"` | `"p1"` | `"p1"` | `"p1"` | `"p1"` |
| **request.Source** | `"code..."` | `"code..."` | `"code..."` | `"code..."` | `"code..."` | `"code..."` |
| **request.CompilerId** | `"csharp"` | `"csharp"` | `"csharp"` | `"python"` | `"csharp"` | `"csharp"` |
| **request.LanguageId** | `"csharp"` | `"csharp"` | `"csharp"` | `"python"` | `"csharp"` | `"csharp"` |
| **IExaminationRepository.GetByIdAsync returns Exam** | O | O | O | O | O | — |
| **IExaminationRepository.GetByIdAsync returns null** | — | — | — | — | — | O |
| **Exam.Mode == EXAMINATION** | O | O | — | — | — | — |
| **Exam.Mode == PRACTICE** | — | — | O | O | O | — |
| **Exam.Status == ONGOING** | O | O | — | — | — | — |
| **IStudentExamSessionRepository.GetByStudentAndExamAsync returns Session** | O | — | — | — | — | — |
| **IStudentExamSessionRepository.GetByStudentAndExamAsync returns null** | — | O | — | — | — | — |
| **Session.Phase == FINISHED** | — | O | — | — | — | — |
| **ISubmissionRepository.CreateAsync succeeds** | — | — | O | O | — | — |
| **ISubmissionRepository.CreateAsync returns null** | — | — | — | — | O | — |
| **ISubmissionCache.GetLatestSubmissionKey returns key** | — | — | — | O | — | — |
| **ISubmissionCache.GetLatestSubmissionKey returns null** | — | — | — | — | O | — |
| **ISubmissionCache.GetAsync returns Submission** | — | — | — | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | — | InvalidOperationException | InvalidOperationException: Exam session is not active |
| **UTCD-02** | — | InvalidOperationException | InvalidOperationException: Exam session is not active |
| **UTCD-03** | Returns SubmissionResponse | SubmissionId != null, Version == 1 | — |
| **UTCD-04** | Returns SubmissionResponse | Version == 3 (previous + 1) | — |
| **UTCD-05** | Returns null | — | — |
| **UTCD-06** | — | KeyNotFoundException | KeyNotFoundException: Exam not found |

---

#### `Task<AutoGradeProblemResponse> AutoGradeAllSubmissionsOfProblemAsync(BulkSubmissionGradingRequest bulkRequest)`

**LineOfCode:** 112

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **bulkRequest.ExamId** | `"e1"` | `"e1"` | `"e1"` | `"e1"` | `"e1"` |
| **bulkRequest.ProblemId** | `"p1"` | `"nonexistent"` | `"p1"` | `"p1"` | `"p1"` |
| **bulkRequest.Submissions** | `[{Id:"sub1", ...}]` | `[{Id:"sub1", ...}]` | `[{Id:"sub1", ...}]` | `[{Id:"sub1", ...}]` | `[{Id:"sub1"}, {Id:"sub2"}]` |
| **IProblemRepository.GetByIdAsync returns Problem** | O | — | O | O | O |
| **IProblemRepository.GetByIdAsync returns null** | — | O | — | — | — |
| **Problem has hidden TestCases** | O | — | — | O | O |
| **Problem has empty hidden TestCases** | — | — | O | — | — |
| **ITestcaseEvaluator.ExecuteTestcasesAsync works** | O | — | — | — | O |
| **ITestcaseEvaluator.ExecuteTestcasesAsync throws Exception** | — | — | — | O | — |
| **IBusinessNotificationService available** | O | — | O | O | O |
| **Multiple submissions provided** | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns AutoGradeProblemResponse | GradedCount == 1, notification sent | — |
| **UTCD-02** | Returns AutoGradeProblemResponse | TotalSubmissions == 0 | — |
| **UTCD-03** | Returns AutoGradeProblemResponse | TotalSubmissions == 1, GradedCount == 0 (no hidden test cases) | — |
| **UTCD-04** | Returns AutoGradeProblemResponse | FailedCount == 1, ErrorMessage set for sub1 | — |
| **UTCD-05** | Returns AutoGradeProblemResponse | GradedCount == 1, FailedCount == 1 | — |

---

#### `Task<AutoGradeSubmissionResult> RegradeSingleSubmissionAsync(string submissionId, SingleSubmissionRegradeRequest request)`

**LineOfCode:** 116

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **submissionId** | `"sub1"` | `"nonexistent"` | `"sub1"` | `"sub1"` | `"sub1"` |
| **request.CompilerId** | `"csharp"` | `"csharp"` | `"csharp"` | `"csharp"` | `"csharp"` |
| **request.LanguageId** | `"csharp"` | `"csharp"` | `"csharp"` | `"csharp"` | `"csharp"` |
| **ISubmissionRepository.GetByIdAsync returns Submission** | O | — | O | O | O |
| **ISubmissionRepository.GetByIdAsync returns null** | — | O | — | — | — |
| **IProblemRepository.GetByIdAsync returns Problem** | O | — | — | O | O |
| **IProblemRepository.GetByIdAsync returns null** | — | — | O | — | — |
| **Problem has hidden TestCases** | O | — | — | O | O |
| **Problem has empty hidden TestCases** | — | — | — | — | — |
| **ITestcaseEvaluator works** | O | — | — | — | — |
| **ITestcaseEvaluator throws Exception** | — | — | — | — | O |
| **IBusinessNotificationService available** | O | — | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns AutoGradeSubmissionResult | FinalScore == 8.0, Status == GRADED, notification sent | — |
| **UTCD-02** | Returns AutoGradeSubmissionResult | ErrorMessage == "Submission not found" | — |
| **UTCD-03** | Returns AutoGradeSubmissionResult | ErrorMessage == "Problem not found" | — |
| **UTCD-04** | Returns AutoGradeSubmissionResult | ErrorMessage == "No hidden test cases found for this problem" | — |
| **UTCD-05** | Returns AutoGradeSubmissionResult | ErrorMessage == exception.Message | — |

---

#### `Task<bool> OverrideSubmissionScoreAsync(string submissionId, float newScore, float maxMark)`

**LineOfCode:** 49

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **submissionId** | `"sub1"` | `"nonexistent"` | `"sub1"` | `"sub1"` | `"sub1"` | `"sub1"` | `"sub1"` |
| **newScore** | `8.5f` | `5.0f` | `11f` | `-1f` | `8.5f` | `0f` | `5.0f` |
| **maxMark** | `10f` | `10f` | `10f` | `10f` | `10f` | `10f` | `100f` |
| **ISubmissionRepository.GetByIdAsync returns Submission** | O | — | O | O | O | O | O |
| **ISubmissionRepository.GetByIdAsync returns null** | — | O | — | — | — | — | — |
| **ISubmissionRepository.UpdateAsync succeeds** | O | — | — | — | — | O | O |
| **ISubmissionRepository.UpdateAsync returns null** | — | — | — | — | O | — | — |
| **IBusinessNotificationService available** | O | — | O | O | O | O | O |
| **newScore is within valid range [0, maxMark]** | O | — | — | — | — | O | O |
| **newScore exceeds maxMark** | — | — | O | — | — | — | — |
| **newScore is negative** | — | — | — | O | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns true | FinalScore == 8.5f, Status == GRADED, notification sent | — |
| **UTCD-02** | Returns false | — | — |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Score cannot exceed max mark |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: Score cannot exceed max mark |
| **UTCD-05** | Returns false | — | — |
| **UTCD-06** | Returns true | FinalScore == 0f (minimum valid score) | — |
| **UTCD-07** | Returns true | FinalScore == 5.0f, maxMark==100f | — |

---

### QuizAttemptCommand

**File:** `AcasService/Application/Commands/QuizAttempt/QuizAttemptCommand.cs`

#### `Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request)`

**LineOfCode:** 73

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 | UTCD-10 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **request.ClassroomQuizId** | `"cq1"` | `"nonexistent"` | `"cq1"` | `"cq1"` | `"cq1"` | `"cq1"` | `"cq1"` | `"cq1"` | `"cq1"` | `"cq1"` |
| **request.StudentId** | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` |
| **request.Passcode** | `null` | `null` | `null` | `null` | `null` | `null` | `"wrongpass"` | `"correctpass"` | `null` | `"correctpass"` |
| **IClassroomQuizRepository.FindByIdAsync returns quiz** | O | — | O | O | O | O | O | O | O | O |
| **IClassroomQuizRepository.FindByIdAsync returns null** | — | O | — | — | — | — | — | — | — | — |
| **IEnrollmentRepository.FindByClassAndStudentIdAsync returns enrollment** | O | — | — | — | — | O | — | O | O | O |
| **IEnrollmentRepository.FindByClassAndStudentIdAsync returns null** | — | — | — | — | — | — | O | — | — | — |
| **ClassroomQuiz.Status == PUBLISHED** | O | — | — | — | — | — | — | — | — | — |
| **ClassroomQuiz.Status == DRAFT** | — | — | O | — | — | — | — | — | — | — |
| **ClassroomQuiz.Status == ONGOING** | — | — | — | O | O | O | O | O | O | O |
| **ClassroomQuiz.StartTime is in the past** | O | — | — | — | O | O | O | O | O | O |
| **ClassroomQuiz.StartTime is in the future** | — | — | — | O | — | — | — | — | — | — |
| **ClassroomQuiz.EndTime is in the future** | O | — | — | — | — | O | O | O | O | O |
| **ClassroomQuiz.EndTime is in the past** | — | — | — | — | O | — | — | — | — | — |
| **ClassroomQuiz.Passcode is null** | O | — | — | — | — | O | — | — | O | — |
| **ClassroomQuiz.Passcode matches request.Passcode** | — | — | — | — | — | — | — | O | — | O |
| **ClassroomQuiz.Passcode does not match request.Passcode** | — | — | — | — | — | — | O | — | — | — |
| **ClassroomQuiz.MaxAttempts is not reached (count=0,2)** | O | — | — | — | — | — | — | O | O | O |
| **ClassroomQuiz.MaxAttempts is reached (count=2, limit=2)** | — | — | — | — | — | — | — | — | — | — |
| **IRepository.CreateAsync succeeds** | O | — | — | — | — | — | — | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns QuizAttemptResponse | Status == INPROGRESS, AttemptNumber == 1 | — |
| **UTCD-02** | — | KeyNotFoundException | KeyNotFoundException: ClassroomQuiz not found |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: This quiz is currently in DRAFT mode |
| **UTCD-04** | — | InvalidOperationException | InvalidOperationException: This quiz has been scheduled but not yet started |
| **UTCD-05** | — | InvalidOperationException | InvalidOperationException: The quiz is not within its valid time window |
| **UTCD-06** | — | InvalidOperationException | InvalidOperationException: You are not enrolled in the classroom |
| **UTCD-07** | — | ArgumentException | ArgumentException: Incorrect or missing quiz passcode |
| **UTCD-08** | — | InvalidOperationException | InvalidOperationException: You have already reached the maximum allowed attempts |
| **UTCD-09** | Returns QuizAttemptResponse | AttemptNumber == 2 | — |
| **UTCD-10** | Returns QuizAttemptResponse | Status == INPROGRESS, AttemptNumber == 1 | — |

---

#### `Task UpdateAnswerAsync(string attemptId, UpdateQuizAnswerRequest request)`

**LineOfCode:** 23

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **attemptId** | `"att1"` | `"nonexistent"` | `"att1"` | `"att1"` | `"att1"` |
| **request.QuestionId** | `"q1"` | `"q1"` | `"q1"` | `"q1"` | `"q1"` |
| **request.SelectedOptionId** | `"A"` | `"A"` | `"A"` | `null` | `"B"` |
| **request.TextAnswer** | `null` | — | — | `"essay answer text"` | `null` |
| **IRepository.FindByIdAsync returns QuizAttempt** | O | — | O | O | O |
| **IRepository.FindByIdAsync returns null** | — | O | — | — | — |
| **QuizAttempt.Status == INPROGRESS** | O | — | — | O | O |
| **QuizAttempt.Status == SUBMITTED** | — | — | O | — | — |
| **IQuizCache.GetAsync/SetAsync available** | O | — | O | O | O |
| **request.SelectedOptionId is not null** | O | O | O | — | O |
| **request.TextAnswer is not null** | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | Answer cached with TTL | — |
| **UTCD-02** | — | KeyNotFoundException | KeyNotFoundException: QuizAttempt not found |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: Cannot update answers for a submitted quiz |
| **UTCD-04** | Returns void | Text answer cached | — |
| **UTCD-05** | Returns void | Answer updated (overwrites previous answer) | — |

---

#### `Task<QuizAttemptResponse> SubmitAttemptAsync(string attemptId)`

**LineOfCode:** 124

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **attemptId** | `"att1"` | `"nonexistent"` | `"att1"` | `"att1"` | `"att1"` | `"att1"` |
| **IRepository.FindByIdAsync returns QuizAttempt** | O | — | O | O | O | O |
| **IRepository.FindByIdAsync returns null** | — | O | — | — | — | — |
| **QuizAttempt.Status == INPROGRESS** | O | — | — | O | O | O |
| **QuizAttempt.Status == SUBMITTED** | — | — | O | — | — | — |
| **IClassroomQuizRepository.FindByIdAsync returns ClassroomQuiz** | O | — | O | O | O | O |
| **IQuizRepository.FindByIdAsync returns Quiz** | O | — | O | O | O | O |
| **Quiz has Questions** | O | — | O | O | O | — |
| **Quiz has no Questions** | — | — | — | — | — | O |
| **IQuestionRepository.FindByIdAsync returns Question** | O | — | O | O | — | — |
| **IQuestionRepository.FindByIdAsync returns null** | — | — | — | — | O | — |
| **Question.Type == SINGLE_CHOICE** | O | — | — | — | — | — |
| **Question.Type == MULTIPLE_CHOICE** | — | — | — | O | — | — |
| **Question.Type == ESSAY** | — | — | — | — | O | — |
| **IStudentAnswerRepository.BatchCreateAsync succeeds** | O | — | O | — | — | O |
| **IRepository.UpdateAsync succeeds** | O | — | O | O | O | O |
| **IQuizCache.GetAsync returns cached answer** | O | — | O | O | O | — |
| **IQuizCache.RemoveAsync succeeds** | O | — | O | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns QuizAttemptResponse | Status == SUBMITTED, FinalScore calculated | — |
| **UTCD-02** | — | KeyNotFoundException | KeyNotFoundException |
| **UTCD-03** | — | InvalidOperationException | InvalidOperationException: This quiz has already been submitted |
| **UTCD-04** | Returns QuizAttemptResponse | Status == SUBMITTED, Correct answer matched | — |
| **UTCD-05** | Returns QuizAttemptResponse | Status == SUBMITTED, Score == 0 (ESSAY not auto-graded) | — |
| **UTCD-06** | Returns QuizAttemptResponse | Status == SUBMITTED, FinalScore == 0 (no questions) | — |

---

### ErrorGroupCommand

**File:** `AcasService/Application/Commands/ErrorGroup/ErrorGroupCommand.cs`

#### `Task<int> GroupSubmissionsByErrorsAsync(string examId, string problemId)`

**LineOfCode:** 44

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **examId** | `"e1"` | `"e1"` | `"e1"` | `"e1"` |
| **problemId** | `"p1"` | `"p1"` | `"p1"` | `"p1"` |
| **ISubmissionRepository.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync available** | O | O | O | O |
| **Submissions with shared ErrorSignature exist** | O | — | — | O |
| **No submissions found** | — | O | — | — |
| **All submissions have unique ErrorSignature** | — | — | O | — |
| **Submissions have Status == GRADED** | — | — | — | O |
| **IErrorGroupRepository.DeleteByProblemIdPaginatedAsync available** | O | O | O | O |
| **IErrorGroupRepository.CreateAsync available** | O | — | — | O |
| **IJPlagCommand available** | O | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns int | createdCount == 2 (ERR001 group: 2 submissions, ERR002 group: 1 submission) | — |
| **UTCD-02** | Returns int | createdCount == 0 (no submissions) | — |
| **UTCD-03** | Returns int | createdCount == 0 (all unique, no grouping) | — |
| **UTCD-04** | Returns int | createdCount >= 1 (grouped by shared error signature) | — |

---

#### `Task CheckSimilarityForProblemAsync(string examId, string problemId)`

**LineOfCode:** 6

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **examId** | `"e1"` | `"e1"` | `"e1"` |
| **problemId** | `"p1"` | `"p1"` | `"p1"` |
| **IErrorGroupRepository.GetByProblemIdPaginatedAsync available** | O | O | O |
| **ErrorGroups found with JPlagStatus == PENDING** | O | — | O |
| **No ErrorGroups found** | — | O | — |
| **IJPlagCommand.RunSimilarityCheckAsync succeeds** | O | — | — |
| **IJPlagCommand.RunSimilarityCheckAsync throws Exception** | — | — | O |
| **IErrorGroupRepository.UpdateAsync available** | O | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | JPlagStatus updated to RUNNING/COMPLETED | — |
| **UTCD-02** | Returns void | no-op | — |
| **UTCD-03** | Returns void | JPlagStatus updated to FAILED, ErrorMessage set | — |

---

#### `Task CheckSimilarityForGroupsAsync(List<string> groupIds)`

**LineOfCode:** 13

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **groupIds** | `["g1", "g2"]` | `[]` | `["nonexistent"]` |
| **IErrorGroupRepository.GetByIdAsync available** | O | — | O |
| **IJPlagCommand available** | O | — | O |
| **IErrorGroupRepository.UpdateAsync available** | O | — | O |
| **groupIds is non-empty list** | O | — | — |
| **groupIds is empty list** | — | O | — |
| **ErrorGroup found** | O | — | — |
| **ErrorGroup not found (null)** | — | — | O |
| **IJPlagCommand.RunSimilarityCheckAsync succeeds** | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns void | JPlag status updated for each group | — |
| **UTCD-02** | Returns void | no-op (early return) | — |
| **UTCD-03** | Returns void | no-op (group not found) | — |

---

## 8. ACASSERVICE — QUERIES

---

### ClassroomQuery

**File:** `AcasService/Application/Queries/Classroom/ClassroomQuery.cs`

#### `Task<ClassroomResponse> GetClassroomByIdAsync(string id)`

**LineOfCode:** 26

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **id** | `"c1"` | `"nonexistent"` | `"c1"` |
| **IClassroomRepository.FindByIdAsync returns Classroom** | O | — | O |
| **IClassroomRepository.FindByIdAsync returns null** | — | O | — |
| **ISubjectRepository.FindByIdAsync returns Subject** | O | — | — |
| **ISubjectRepository.FindByIdAsync returns null** | — | — | O |
| **IUserRequestProducer.GetUserByIdAsync retrieves lecturer profile** | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ClassroomResponse | — | — |
| **UTCD-02** | — | KeyNotFoundException | KeyNotFoundException |
| **UTCD-03** | — | KeyNotFoundException | KeyNotFoundException: Subject with ID not found |

---

#### `Task<PagedResult<ClassroomResponse>> GetAllClassroomsAsync(string? userId, string? search, string? status, int pageIndex, int pageSize)`

**LineOfCode:** 82

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 | UTCD-08 | UTCD-09 | UTCD-10 |
|---|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **userId** | `null` | `"l1"` | `null` | `null` | `null` | `null` | `null` | `null` | `"s1"` | `null` |
| **search** | `null` | `null` | `"PRN"` | `null` | `null` | `null` | `null` | `"invalid_status"` | `null` | `null` |
| **status** | `null` | `null` | `null` | `"active"` | `"completed"` | `"deleted"` | `null` | `null` | `null` | `null` |
| **pageIndex** | `1` | `1` | `1` | `1` | `1` | `1` | `1` | `1` | `1` | `9999` |
| **pageSize** | `10` | `10` | `10` | `10` | `10` | `10` | `10` | `10` | `10` | `10` |
| **IClassroomRepository.FindAllAsync returns list** | O | — | — | — | — | — | O | O | O | O |
| **GetStudentCountByClassIdsAsync available** | O | — | — | — | — | — | O | O | O | O |
| **GetUsersByIdsAsync available** | O | — | — | — | — | — | O | O | O | O |
| **FindByClassIdsAndStudentIdAsync available** | O | — | — | — | — | — | O | O | O | O |
| **userId is null** | O | — | O | O | O | O | O | O | — | O |
| **userId is non-null** | — | O | — | — | — | — | — | — | O | — |
| **search is null** | O | O | — | O | O | O | O | O | O | O |
| **search contains filter text** | — | — | O | — | — | — | — | — | — | — |
| **status is null** | O | O | O | — | — | — | O | — | O | O |
| **status == "active"** | — | — | — | O | — | — | — | — | — | — |
| **status == "completed"** | — | — | — | — | O | — | — | — | — | — |
| **status == "deleted"** | — | — | — | — | — | O | — | — | — | — |
| **status is invalid** | — | — | — | — | — | — | — | O | — | — |
| **pageIndex is valid** | O | O | O | O | O | O | O | O | O | O |
| **Enrollment data exists for user** | — | — | — | — | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult | Items.Count <= 10, TotalCount == 5 | — |
| **UTCD-02** | Returns PagedResult | Only classrooms where LecturerId == l1 | — |
| **UTCD-03** | Returns PagedResult | Only ClassName or ClassCode containing "PRN" | — |
| **UTCD-04** | Returns PagedResult | Only !IsDeleted && EndDate >= now | — |
| **UTCD-05** | Returns PagedResult | Only !IsDeleted && EndDate < now | — |
| **UTCD-06** | Returns PagedResult | Only IsDeleted == true | — |
| **UTCD-07** | Returns PagedResult | Only !IsDeleted (default status filter) | — |
| **UTCD-08** | Returns PagedResult | Treated as !IsDeleted (default) | — |
| **UTCD-09** | Returns PagedResult | Enrollment data populated for user s1 | — |
| **UTCD-10** | Returns PagedResult | Items == [], TotalCount unchanged (page beyond data) | — |

---

#### `Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request)`

**LineOfCode:** 28

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **request.ClassCode** | `"PRN231"` | `"xyznotexist"` |
| **IClassroomRepository.GetClassroomsByKeywordAsync available** | O | O |
| **ISubjectRepository.FindByIdsAsync available** | O | O |
| **UserRequestProducer.GetUsersByIdsAsync available** | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns IEnumerable<ClassroomResponse> | — | — |
| **UTCD-02** | Returns IEnumerable<ClassroomResponse> | empty list (no classrooms found) | — |

---

#### `Task<PagedResult<ClassroomResponse>> FindByStudentIdAsync(string studentId, string? status, string? search, int pageIndex, int pageSize)`

**LineOfCode:** 69

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **studentId** | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` |
| **status** | `null` | `"joining"` | `"movedout"` | `null` | `null` |
| **search** | `null` | `null` | `null` | `"PRN"` | `null` |
| **pageIndex** | `1` | `1` | `1` | `1` | `1` |
| **pageSize** | `10` | `10` | `10` | `10` | `10` |
| **IClassroomEnrollmentRepository.FindByStudentIdAsync available** | O | O | O | O | O |
| **IClassroomRepository.FindByIdsAsync available** | O | O | O | O | O |
| **UserRequestProducer.GetUsersByIdsAsync available** | O | O | O | O | O |
| **ISubjectRepository.FindByIdsAsync available** | O | O | O | O | O |
| **Enrollments found** | O | O | O | O | — |
| **No enrollments found** | — | — | — | — | O |
| **status is null** | O | — | — | O | O |
| **status == "joining"** | — | O | — | — | — |
| **status == "movedout"** | — | — | O | — | — |
| **search is null or empty** | O | O | O | — | O |
| **search contains text** | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult | Only enrolled classrooms, !IsDeleted | — |
| **UTCD-02** | Returns PagedResult | Only IsJoining == true && EndDate >= now | — |
| **UTCD-03** | Returns PagedResult | Only !IsJoining && JoinedDate != null | — |
| **UTCD-04** | Returns PagedResult | Filtered by ClassName/ClassCode containing "PRN" | — |
| **UTCD-05** | Returns PagedResult | Items == [], TotalCount == 0 | — |

---

#### `Task<PagedResult<ClassroomResponse>> GetClassroomsByLecturerIdAsync(string lecturerId, string? search, int pageIndex, int pageSize)`

**LineOfCode:** 48

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **lecturerId** | `"l1"` | `"l1"` | `"l1"` |
| **search** | `null` | `"PRN"` | `null` |
| **pageIndex** | `1` | `1` | `1` |
| **pageSize** | `10` | `10` | `10` |
| **IClassroomRepository.GetClassroomsByLecturerIdAsync available** | O | O | O |
| **ISubjectRepository.FindByIdsAsync available** | O | O | O |
| **UserRequestProducer.GetUsersByIdsAsync available** | O | O | O |
| **search is null or empty** | O | — | O |
| **search contains text** | — | O | — |
| **Results returned** | O | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult | — | — |
| **UTCD-02** | Returns PagedResult | Filtered by ClassName/ClassCode containing "PRN" | — |
| **UTCD-03** | Returns PagedResult | Sorted by CreatedDate descending | — |

---

### ProblemQuery

**File:** `AcasService/Application/Queries/Problem/ProblemQuery.cs`

#### `Task<ProblemResponse?> GetProblemByIdAsync(string problemId)`

**LineOfCode:** 32

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **problemId** | `"p1"` | `"nonexistent"` | `"p1"` | `"p1"` |
| **IProblemRepository.GetByIdAsync returns Problem** | O | — | O | O |
| **IProblemRepository.GetByIdAsync returns null** | — | O | — | — |
| **Problem.IsDeleted == false** | O | — | — | O |
| **Problem.IsDeleted == true** | — | — | O | — |
| **GetTestCasesByProblemIdAsync available** | O | — | — | O |
| **IPrivateS3Query.GetFileUrlAsync available** | O | — | — | O |
| **IPrivateS3Query.GetFileUrlAsync succeeds** | O | — | — | — |
| **IPrivateS3Query.GetFileUrlAsync throws Exception** | — | — | — | O |
| **Problem.FileName is not null** | O | — | — | — |
| **Problem.FileName is null** | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ProblemResponse? | — | — |
| **UTCD-02** | Returns null | — | — |
| **UTCD-03** | Returns null | — | — |
| **UTCD-04** | Returns ProblemResponse? | FileUrl == "" (S3 error handled gracefully) | — |

---

#### `Task<List<ProblemResponse>> GetProblemsByIdsAsync(IEnumerable<string> problemIds)`

**LineOfCode:** 24

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **problemIds** | `["p1", "p2"]` | `["nonexistent"]` |
| **IProblemRepository.GetByIdsAsync available** | O | O |
| **IPrivateS3Query.GetFileUrlsAsync available** | O | O |
| **problemIds contains valid IDs** | O | — |
| **problemIds contains non-existent IDs** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ProblemResponse> | — | — |
| **UTCD-02** | Returns List<ProblemResponse> | empty list | — |

---

#### `Task<List<ProblemBasicResponse>> GetProblemsByExamIdAsync(string examId)`

**LineOfCode:** 24

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **examId** | `"e1"` | `"e1"` |
| **IProblemRepository.GetByExamIdAsync available** | O | O |
| **Problems found (IsDeleted=false)** | O | — |
| **No problems found** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ProblemBasicResponse> | IsDeleted=false only | — |
| **UTCD-02** | Returns List<ProblemBasicResponse> | empty list | — |

---

#### `Task<List<ProblemBasicResponse>> GetProblemsByLecturerIdAsync(string lecturerId)`

**LineOfCode:** 24

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **lecturerId** | `"l1"` | `"l1"` |
| **IProblemRepository.GetByLecturerIdAsync available** | O | O |
| **Problems found** | O | — |
| **No problems found** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ProblemBasicResponse> | — | — |
| **UTCD-02** | Returns List<ProblemBasicResponse> | empty list | — |

---

#### `Task<PagedResult<ProblemBasicResponse>> GetProblemsByLecturerIdPagedAsync(string lecturerId, int pageIndex, int pageSize, string? searchTerm, string? difficulty)`

**LineOfCode:** 57

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **lecturerId** | `"l1"` | `"l1"` | `"l1"` | `"l1"` | `"l1"` | `"l1"` |
| **pageIndex** | `1` | `1` | `1` | `0` | `1` | `1` |
| **pageSize** | `10` | `10` | `10` | `10` | `200` | `10` |
| **searchTerm** | `null` | `"sum"` | `null` | `null` | `null` | `"xyz"` |
| **difficulty** | `null` | `null` | `"EASY"` | `null` | `null` | `"MEDIUM"` |
| **IProblemRepository.GetByLecturerIdAsync available** | O | O | O | O | O | O |
| **pageIndex is valid (>0)** | O | O | O | — | O | O |
| **pageIndex is 0 or less** | — | — | — | O | — | — |
| **pageSize is valid (<=100)** | O | O | O | O | — | O |
| **pageSize exceeds 100** | — | — | — | — | O | — |
| **searchTerm is null or empty** | O | — | O | O | O | — |
| **searchTerm contains text** | — | O | — | — | — | O |
| **difficulty is null or empty** | O | O | — | O | O | — |
| **difficulty is specific value** | — | — | O | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult | Items.Count == 10, TotalCount == 15 | — |
| **UTCD-02** | Returns PagedResult | All Titles contain "sum" | — |
| **UTCD-03** | Returns PagedResult | All Difficulty == EASY | — |
| **UTCD-04** | Returns PagedResult | pageIndex corrected to 1 | — |
| **UTCD-05** | Returns PagedResult | pageSize corrected to 100 | — |
| **UTCD-06** | Returns PagedResult | Title contains "xyz" AND Difficulty == MEDIUM | — |

---

#### `Task<List<ProblemBasicResponse>> GetAllProblemsAsync()`

**LineOfCode:** 24

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **IProblemRepository.GetAllAsync available** | O | O |
| **Problems found (IsDeleted=false)** | O | — |
| **No problems found** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ProblemBasicResponse> | Count == 5, IsDeleted=false only | — |
| **UTCD-02** | Returns List<ProblemBasicResponse> | Count == 0 | — |

---

#### `Task<List<TestCaseResponse>> GetTestCasesByProblemIdAsync(string problemId)`

**LineOfCode:** 28

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **problemId** | `"p1"` | `"p1"` |
| **IProblemRepository.GetTestCasesByProblemIdAsync available** | O | O |
| **TestCases found (IsDeleted=false)** | O | — |
| **No TestCases found** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<TestCaseResponse> | IsDeleted=false only | — |
| **UTCD-02** | Returns List<TestCaseResponse> | empty list | — |

---

#### `Task<TestCaseResponse?> GetTestCaseAsync(string problemId, string testCaseId)`

**LineOfCode:** 29

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **problemId** | `"p1"` | `"p1"` | `"p1"` |
| **testCaseId** | `"tc1"` | `"nonexistent"` | `"tc1"` |
| **IProblemRepository.GetTestCaseAsync available** | O | O | O |
| **TestCase found** | O | — | O |
| **TestCase not found** | — | O | — |
| **TestCase.IsDeleted == false** | O | — | — |
| **TestCase.IsDeleted == true** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns TestCaseResponse? | — | — |
| **UTCD-02** | Returns null | — | — |
| **UTCD-03** | Returns null | — | — |

---

### ExaminationQuery

**File:** `AcasService/Application/Queries/Examination/ExaminationQuery.cs`

#### `Task<ExaminationResponse?> GetByIdAsync(string id)`

**LineOfCode:** 22

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **id** | `"e1"` | `"nonexistent"` |
| **IExaminationRepository.GetByIdAsync returns Exam** | O | — |
| **IExaminationRepository.GetByIdAsync returns null** | — | O |
| **IProgrammingLanguageRepository.GetByIdAsync available** | O | — |
| **IClassroomRepository.FindByIdAsync available** | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ExaminationResponse? | — | — |
| **UTCD-02** | — | Exception | Exception: Examination with id not found. |

---

#### `Task<List<ExaminationResponse?>> GetAllAsync()`

**LineOfCode:** 32

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **IExaminationRepository.GetAllAsync returns list** | O | — |
| **IExaminationRepository.GetAllAsync returns empty list** | — | O |
| **IProgrammingLanguageRepository.GetByIdsAsync available** | O | — |
| **IClassroomRepository.FindByIdsAsync available** | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ExaminationResponse?> | Count == 2 | — |
| **UTCD-02** | — | Exception | Exception: No examinations found. |

---

#### `Task<List<ExaminationResponse?>> GetByClassIdAsync(string classId)`

**LineOfCode:** 36

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **classId** | `"c1"` | `"c1"` |
| **IExaminationRepository.GetByClassIdAsync available** | O | O |
| **IExaminationRepository.GetByClassIdAndModeAsync available** | O | O |
| **IProgrammingLanguageRepository.GetByIdsAsync available** | O | O |
| **IClassroomRepository.FindByIdsAsync available** | O | O |
| **Examinations found** | O | — |
| **No examinations found** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ExaminationResponse?> | — | — |
| **UTCD-02** | Returns List<ExaminationResponse?> | empty list | — |

---

#### `Task<List<ExaminationResponse?>> GetByClassIdAndModeAsync(string classId, string mode)`

**LineOfCode:** 36

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **classId** | `"c1"` | `"c1"` | `"c1"` |
| **mode** | `"EXAMINATION"` | `"PRACTICE"` | `"invalid_mode"` |
| **IExaminationRepository.GetByClassIdAndModeAsync available** | O | O | O |
| **IProgrammingLanguageRepository.GetByIdsAsync available** | O | O | O |
| **IClassroomRepository.FindByIdsAsync available** | O | O | O |
| **mode is valid** | O | O | — |
| **mode is invalid** | — | — | O |
| **Examinations found** | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ExaminationResponse?> | — | — |
| **UTCD-02** | Returns List<ExaminationResponse?> | empty list (no PRACTICE exams) | — |
| **UTCD-03** | Returns List<ExaminationResponse?> | empty list | — |

---

#### `Task<ExaminationSpecProblemResponse> GetExaminationProblemResponseAsync(string examId, string problemId)`

**LineOfCode:** 34

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **examId** | `"e1"` | `"nonexistent"` | `"e1"` | `"e1"` |
| **problemId** | `"p1"` | `"p1"` | `"p1"` | `"p1"` |
| **IExaminationRepository.GetByIdAsync returns Exam** | O | — | O | O |
| **IExaminationRepository.GetByIdAsync returns null** | — | O | — | — |
| **IProblemRepository.GetByIdAsync returns Problem** | O | — | — | O |
| **IProblemRepository.GetByIdAsync returns null** | — | — | O | — |
| **IProgrammingLanguageRepository.GetByIdAsync available** | O | — | — | — |
| **Exam contains problemId in Problems list** | O | — | — | — |
| **Exam does not contain problemId** | — | — | O | — |
| **Problem has public TestCases** | O | — | — | — |
| **Problem has no public TestCases** | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ExaminationSpecProblemResponse | TestCases.Count == 1 (only IsPublic=true) | — |
| **UTCD-02** | — | Exception | Exception: Examination with id not found. |
| **UTCD-03** | — | Exception | Exception: Problem with id not found in the examination. |
| **UTCD-04** | — | Exception | Exception: Problem with id not found. |

---

### StudentExamSessionQuery

**File:** `AcasService/Application/Queries/StudentExamSession/StudentExamSessionQuery.cs`

#### `Task<List<StudentExamSessionResponse>> GetSessionsByExamIdAsync(string examId)`

**LineOfCode:** 41

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **examId** | `"e1"` | `"e1"` | `"e1"` |
| **IStudentExamSessionRepository.GetByExamIdAsync available** | O | O | O |
| **UserRequestProducer.GetUsersByIdsAsync available** | O | O | O |
| **Sessions found** | O | — | O |
| **No sessions found** | — | O | — |
| **User profiles found for students** | O | — | — |
| **User profiles not found** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<StudentExamSessionResponse> | Count == 2, StudentName populated | — |
| **UTCD-02** | Returns List<StudentExamSessionResponse> | Count == 0 | — |
| **UTCD-03** | Returns List<StudentExamSessionResponse> | StudentName == "" (profile not found) | — |

---

### SubjectQuery

**File:** `AcasService/Application/Queries/Subject/SubjectQuery.cs`

#### `Task<SubjectResponse> GetSubjectByIdAsync(string subjectId)`

**LineOfCode:** 20

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **subjectId** | `"sub1"` | `"nonexistent"` |
| **ISubjectRepository.FindByIdAsync returns Subject** | O | — |
| **ISubjectRepository.FindByIdAsync returns null** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns SubjectResponse | — | — |
| **UTCD-02** | Returns null | — | — |

---

#### `Task<List<SubjectResponse>> GetAllSubjectsAsync()`

**LineOfCode:** 14

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **ISubjectRepository.FindAllAsync returns list** | O | — |
| **ISubjectRepository.FindAllAsync returns empty list** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<SubjectResponse> | Count == 2 | — |
| **UTCD-02** | Returns List<SubjectResponse> | Count == 0 | — |

---

#### `Task<List<SubjectResponse>> SearchSubjectsAsync(string? searchTerm, bool? isDeleted, string? createdBy)`

**LineOfCode:** 15

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **searchTerm** | `"Programming"` | `null` | `null` | `"Math"` |
| **isDeleted** | `null` | `false` | `null` | `true` |
| **createdBy** | `null` | `null` | `"u1"` | `"u1"` |
| **ISubjectRepository.SearchAsync available** | O | O | O | O |
| **searchTerm is null or empty** | — | O | O | — |
| **searchTerm contains text** | O | — | — | O |
| **isDeleted is null** | O | — | O | — |
| **isDeleted is true or false** | — | O | — | O |
| **createdBy is non-null** | — | — | O | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<SubjectResponse> | — | — |
| **UTCD-02** | Returns List<SubjectResponse> | — | — |
| **UTCD-03** | Returns List<SubjectResponse> | — | — |
| **UTCD-04** | Returns List<SubjectResponse> | — | — |

---

#### `Task<PagedSubjectResponse> GetPagedSubjectsAsync(int page, int pageSize, string? sortBy, bool ascending, bool? includeDeleted)`

**LineOfCode:** 33

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **page** | `1` | `1` | `1` | `1` | `0` | `3` |
| **pageSize** | `10` | `10` | `10` | `200` | `10` | `10` |
| **sortBy** | `null` | `"Name"` | `"Name"` | `null` | `null` | `null` |
| **ascending** | `true` | `true` | `false` | `true` | `true` | `true` |
| **includeDeleted** | `false` | `null` | `null` | `null` | `null` | `true` |
| **ISubjectRepository.GetPagedAsync available** | O | O | O | O | O | O |
| **page is valid (>0)** | O | O | O | O | — | O |
| **page is 0 or less** | — | — | — | — | O | — |
| **pageSize is valid (<=100)** | O | O | O | — | O | O |
| **pageSize exceeds 100** | — | — | — | O | — | — |
| **sortBy is null or empty** | O | — | — | O | O | O |
| **sortBy is "Name"** | — | O | O | — | — | — |
| **ascending is true** | O | O | — | O | O | O |
| **ascending is false** | — | — | O | — | — | — |
| **includeDeleted is null** | — | O | O | O | O | — |
| **includeDeleted is true** | O | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedSubjectResponse | Items.Count == 10, TotalCount == 50, TotalPages == 5 | — |
| **UTCD-02** | Returns PagedSubjectResponse | Sorted by Name ascending | — |
| **UTCD-03** | Returns PagedSubjectResponse | Sorted by Name descending | — |
| **UTCD-04** | Returns PagedSubjectResponse | pageSize corrected to 100 | — |
| **UTCD-05** | Returns PagedSubjectResponse | page corrected to 1 | — |
| **UTCD-06** | Returns PagedSubjectResponse | Page == 3 | — |

---

### NotificationQuery

**File:** `AcasService/Application/Queries/Notification/NotificationQuery.cs`

#### `Task<PagedResult<NotificationResponse>> GetNotificationsByUserIdAsync(string userId, int pageIndex, int pageSize)`

**LineOfCode:** 37

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **userId** | `"u1"` | `"u1"` | `""` | `"u1"` | `"u1"` |
| **pageIndex** | `1` | `1` | `1` | `1` | `1` |
| **pageSize** | `10` | `10` | `10` | `200` | `0` |
| **INotificationRepository.FindByTargetUserIdAsync available** | O | O | O | O | O |
| **NotificationMapper available** | O | O | O | O | O |
| **userId is non-empty string** | O | O | — | O | O |
| **userId is empty string** | — | — | O | — | — |
| **Notifications found** | O | — | — | O | O |
| **No notifications found** | — | O | — | — | — |
| **pageSize is valid (>0, <=100)** | O | O | O | — | — |
| **pageSize exceeds 100** | — | — | — | O | — |
| **pageSize is 0** | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult<NotificationResponse> | Sorted by IsRead then SentDate desc | — |
| **UTCD-02** | Returns PagedResult<NotificationResponse> | Items == [], TotalCount == 0 | — |
| **UTCD-03** | — | ArgumentException | ArgumentException: userId is required |
| **UTCD-04** | Returns PagedResult<NotificationResponse> | pageSize corrected to 100 | — |
| **UTCD-05** | Returns PagedResult<NotificationResponse> | pageSize corrected to 1 | — |

---

#### `Task<List<NotificationResponse>> GetByTargetUserIdAsync(string targetUserId)`

**LineOfCode:** 12

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **targetUserId** | `"u1"` | `""` |
| **INotificationRepository.FindByTargetUserIdAsync available** | O | O |
| **NotificationMapper available** | O | O |
| **targetUserId is non-empty** | O | — |
| **targetUserId is empty** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<NotificationResponse> | Sorted by SentDate desc | — |
| **UTCD-02** | — | ArgumentException | ArgumentException: targetUserId is required |

---

#### `Task<PagedResult<NotificationResponse>> GetAllNotificationsAsync(int pageIndex, int pageSize, string? searchTerm)`

**LineOfCode:** 25

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **pageIndex** | `1` | `1` | `1` |
| **pageSize** | `10` | `10` | `10` |
| **searchTerm** | `null` | `"grade"` | `null` |
| **INotificationRepository.SearchAsync available** | O | O | O |
| **NotificationMapper available** | O | O | O |
| **Notifications found** | O | O | — |
| **No notifications found** | — | — | O |
| **searchTerm is null or empty** | O | — | O |
| **searchTerm contains text** | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedResult<NotificationResponse> | — | — |
| **UTCD-02** | Returns PagedResult<NotificationResponse> | Filtered by search term | — |
| **UTCD-03** | Returns PagedResult<NotificationResponse> | Items == [], TotalCount == 0 | — |

---

### ProgrammingLanguageQuery

**File:** `AcasService/Application/Queries/ProgrammingLanguage/ProgrammingLanguageQuery.cs`

#### `Task<ProgrammingLanguageResponse?> GetByIdAsync(string id)`

**LineOfCode:** 18

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **id** | `"python"` | `"nonexistent"` |
| **IProgrammingLanguageRepository.GetByIdAsync returns Language** | O | — |
| **IProgrammingLanguageRepository.GetByIdAsync returns null** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns ProgrammingLanguageResponse? | — | — |
| **UTCD-02** | — | Exception | Exception: Programming language with id not found. |

---

#### `Task<List<ProgrammingLanguageResponse>> GetAllAsync()`

**LineOfCode:** 23

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **IProgrammingLanguageRepository.GetAllAsync returns list** | O | — |
| **IProgrammingLanguageRepository.GetAllAsync returns empty list** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ProgrammingLanguageResponse> | Count == 3 | — |
| **UTCD-02** | — | Exception | Exception: No programming languages found. |

---

#### `Task<List<ProgrammingLanguageResponse>> GetEnabledAsync()`

**LineOfCode:** 18

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **IProgrammingLanguageRepository.GetAllAsync returns list** | O | O |
| **Languages with Status == ENABLE exist** | O | — |
| **No languages with Status == ENABLE** | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<ProgrammingLanguageResponse> | Count == 1, Status == ENABLE | — |
| **UTCD-02** | Returns List<ProgrammingLanguageResponse> | Count == 0 | — |

---

#### `Task<PagedProgrammingLanguageResponse> GetPagedAsync(int page, int pageSize, string? sortBy, bool ascending)`

**LineOfCode:** 28

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 |
|---|---------|---------|---------|---------|
| **page** | `1` | `1` | `1` | `0` |
| **pageSize** | `10` | `200` | `10` | `10` |
| **sortBy** | `null` | `null` | `"Name"` | `null` |
| **ascending** | `true` | `true` | `false` | `true` |
| **IProgrammingLanguageRepository.GetPagedAsync available** | O | O | O | O |
| **page is valid (>0)** | O | O | O | — |
| **page is 0 or less** | — | — | — | O |
| **pageSize is valid (<=100)** | O | — | O | O |
| **pageSize exceeds 100** | — | O | — | — |
| **sortBy is null or empty** | O | O | — | O |
| **sortBy is "Name"** | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns PagedProgrammingLanguageResponse | Items.Count == 10, TotalCount == 25 | — |
| **UTCD-02** | Returns PagedProgrammingLanguageResponse | pageSize corrected to 100 | — |
| **UTCD-03** | Returns PagedProgrammingLanguageResponse | Sorted by Name descending | — |
| **UTCD-04** | Returns PagedProgrammingLanguageResponse | page corrected to 1 | — |

---

### StudentDashboardQuery

**File:** `AcasService/Application/Queries/ClassroomDashboard/StudentDashboardQuery.cs`

#### `Task<StudentDashboardOverviewItem?> GetOverviewAsync(string classroomId, string studentId)`

**LineOfCode:** 119

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 |
|---|---------|---------|---------|---------|---------|
| **classroomId** | `"c1"` | `"c1"` | `"c1"` | `"nonexistent"` | `"c1"` |
| **studentId** | `"s1"` | `"s1"` | `"s1"` | `"s1"` | `"s1"` |
| **IClassroomRepository.FindByIdAsync available** | O | O | O | O | O |
| **IExaminationRepository.GetByClassIdAsync available** | O | O | O | O | O |
| **ISubmissionRepository.GetByExamIdsAsync available** | O | O | O | O | O |
| **IAcademicWarningRepository.FindByStudentIdAsync available** | O | O | O | O | O |
| **Classroom found** | O | O | O | — | O |
| **Classroom not found** | — | — | — | O | — |
| **Examinations found** | O | O | — | — | O |
| **No examinations found** | — | — | O | — | — |
| **Submissions found** | O | — | — | — | O |
| **No submissions found** | — | O | — | — | — |
| **Warnings found** | O | — | — | — | O |
| **Warnings not found** | — | O | — | — | — |
| **Some warnings are unread** | — | — | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns StudentDashboardOverviewItem? | — | — |
| **UTCD-02** | Returns StudentDashboardOverviewItem? | AverageScore == 0, SubmittedExams == 0 | — |
| **UTCD-03** | Returns StudentDashboardOverviewItem? | TotalExams == 0, AverageScore == 0 | — |
| **UTCD-04** | Returns StudentDashboardOverviewItem? | ClassName == "Unknown" | — |
| **UTCD-05** | Returns StudentDashboardOverviewItem? | TotalWarnings == 2, UnreadWarnings == 1 | — |

---

#### `Task<List<StudentExamScoreItem>> GetExamScoresAsync(string classroomId, string studentId)`

**LineOfCode:** 68

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **classroomId** | `"c1"` | `"c1"` | `"c1"` |
| **studentId** | `"s1"` | `"s1"` | `"s1"` |
| **IExaminationRepository.GetByClassIdAsync available** | O | O | O |
| **ISubmissionRepository.GetByExamIdsAsync available** | O | O | O |
| **Examinations found** | O | — | O |
| **No examinations found** | — | O | — |
| **Submissions found for student** | O | — | — |
| **No submissions found for student** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<StudentExamScoreItem> | Count > 0 | — |
| **UTCD-02** | Returns List<StudentExamScoreItem> | empty list | — |
| **UTCD-03** | Returns List<StudentExamScoreItem> | Score == 0, Status == "NOT_SUBMITTED" | — |

---

#### `Task<List<StudentWarningItem>> GetWarningsAsync(string studentId, int limit)`

**LineOfCode:** 26

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **studentId** | `"s1"` | `"s1"` | `"s1"` |
| **limit** | `10` | `5` | `10` |
| **IAcademicWarningRepository.FindByStudentIdAsync available** | O | O | O |
| **Warnings found** | O | O | — |
| **No warnings found** | — | — | O |
| **Warning count exceeds limit** | — | O | — |
| **Warning count less than or equal to limit** | O | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<StudentWarningItem> | Count <= 10, ordered by SentDate desc | — |
| **UTCD-02** | Returns List<StudentWarningItem> | Count == 5 | — |
| **UTCD-03** | Returns List<StudentWarningItem> | empty list | — |

---

#### `Task<List<StudentScoreTrendItem>> GetScoreTrendAsync(string classroomId, string studentId)`

**LineOfCode:** 39

**Input / Precondition:**

| | UTCD-01 | UTCD-02 |
|---|---------|---------|
| **classroomId** | `"c1"` | `"c1"` |
| **studentId** | `"s1"` | `"s1"` |
| **IExaminationRepository.GetByClassIdAsync available** | O | O |
| **ISubmissionRepository.GetByExamIdsAsync available** | O | O |
| **Examinations found** | O | — |
| **No examinations found** | — | O |
| **Graded submissions found** | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns List<StudentScoreTrendItem> | Count == 2, ordered by SubmittedDate | — |
| **UTCD-02** | Returns List<StudentScoreTrendItem> | empty list | — |

---

#### `Task<StudentSubmissionStatsItem?> GetSubmissionStatsAsync(string classroomId, string studentId)`

**LineOfCode:** 69

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 |
|---|---------|---------|---------|
| **classroomId** | `"c1"` | `"c1"` | `"c1"` |
| **studentId** | `"s1"` | `"s1"` | `"s1"` |
| **IClassroomRepository.FindByIdAsync available** | O | O | O |
| **IExaminationRepository.GetByClassIdAsync available** | O | O | O |
| **ISubmissionRepository.GetByExamIdsAsync available** | O | O | O |
| **Classroom found** | O | O | O |
| **Examinations found** | O | — | O |
| **No examinations found** | — | O | — |
| **Submissions found for student** | O | — | O |
| **No submissions found** | — | — | — |
| **Submission is on time** | O | — | — |
| **Submission is late** | — | — | O |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns StudentSubmissionStatsItem? | SubmittedExams == 1, SubmissionRate == 50.0 | — |
| **UTCD-02** | Returns StudentSubmissionStatsItem? | TotalExams == 0, SubmittedExams == 0, SubmissionRate == 0 | — |
| **UTCD-03** | Returns StudentSubmissionStatsItem? | IsLate == true | — |

---

## 9. ACASSERVICE — CODERUNNER

---

### CompilationApi

**File:** `AcasService/Application/CodeRunner/CompilationApi.cs`

#### `Task<CompilationResult> CompileAsync(string compilerId, CompileRequest compileRequest, string? lang)`

**LineOfCode:** 78

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 | UTCD-07 |
|---|---------|---------|---------|---------|---------|---------|---------|
| **compilerId** | `"python3"` | `"python3"` | `"nonexistent-compiler"` | `"python3"` | `"python3"` | `"python3"` | `"python3"` |
| **compileRequest.Code** | `"print('hello')"` | `"print('hello'"` | `"print('hello')"` | `"print('hello')"` | `"print('hello')"` | `"print('hello')"` | `"x"*100000` |
| **compileRequest.Lang** | `"python"` | `null` | `null` | `null` | `"python"` | `"python"` | `null` |
| **lang** | `null` | `null` | `null` | `""` | `null` | `"python"` | `"python"` |
| **HttpClient available** | O | O | O | O | O | O | O |
| **CodeRunner service at _baseUrl accessible** | O | O | O | O | O | O | O |
| **compilerId is a valid compiler** | O | O | — | O | O | O | O |
| **compilerId is an invalid/non-existent compiler** | — | — | O | — | — | — | — |
| **compileRequest.Lang is not null** | O | — | — | — | O | O | — |
| **lang (query parameter) is not null/empty** | — | — | — | — | — | O | O |
| **lang (query parameter) is null/empty** | O | O | O | O | O | — | — |
| **HttpClient returns 200 OK** | O | O | — | O | O | O | O |
| **HttpClient returns 404 Not Found** | — | — | O | — | — | — | — |
| **Compilation succeeds** | O | — | — | — | — | — | — |
| **Compilation fails (syntax error)** | — | O | — | — | — | — | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns CompilationResult | Compiled == true, Token != null | — |
| **UTCD-02** | Returns CompilationResult | Compiled == false, Error != null | — |
| **UTCD-03** | — | HttpRequestException | HttpRequestException |
| **UTCD-04** | — | ArgumentException | ArgumentException: Language is required |
| **UTCD-05** | Returns CompilationResult | lang from body used as fallback | — |
| **UTCD-06** | Returns CompilationResult | lang from query param used | — |
| **UTCD-07** | Returns CompilationResult | Response deserialized successfully | — |

---

#### `Task<RunBatchResponse> RunBatchAsync(string compilerId, RumBatchRequest runBatchRequest, string? lang)`

**LineOfCode:** 71

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **compilerId** | `"python3"` | `"python3"` | `"python3"` | `"python3"` | `"python3"` | `"python3"` |
| **runBatchRequest.StdinList** | `["1 2"]` | `["1 2"]` | `[]` | `["1 2"]` | `["1 2"]` | `["a"]` |
| **runBatchRequest.Code** | `"print(sum(map(int,input().split())))"` | `null` | `null` | `null` | `"print('test')"` | `"x"*100000` |
| **lang** | `null` | `null` | `null` | `""` | `"python"` | `"python"` |
| **HttpClient available** | O | O | O | O | O | O |
| **CodeRunner service accessible** | O | O | O | O | O | O |
| **stdinList is not empty** | O | O | — | O | O | O |
| **stdinList is empty** | — | — | O | — | — | — |
| **lang is not null/empty** | — | — | — | — | O | O |
| **lang is null/empty** | O | O | O | O | — | — |
| **HttpClient returns 200 OK** | O | — | — | — | O | O |
| **HttpClient returns 404 Not Found** | — | O | — | — | — | — |
| **Execution times out** | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns RunBatchResponse | Results != null | — |
| **UTCD-02** | — | HttpRequestException | HttpRequestException |
| **UTCD-03** | — | ArgumentException | ArgumentException: stdinList must contain at least one input |
| **UTCD-04** | — | ArgumentException | ArgumentException: Language is required |
| **UTCD-05** | Returns RunBatchResponse | TimedOut == true | — |
| **UTCD-06** | Returns RunBatchResponse | Large code handled | — |

---

### CodeFormatterApi

**File:** `AcasService/Application/CodeRunner/CodeFormatterApi.cs`

#### `Task<FormatCodeResponse> FormatCodeAsync(string lang, FormatCodeRequest request)`

**LineOfCode:** 56

**Input / Precondition:**

| | UTCD-01 | UTCD-02 | UTCD-03 | UTCD-04 | UTCD-05 | UTCD-06 |
|---|---------|---------|---------|---------|---------|---------|
| **lang** | `"python"` | `"nonexistent-lang"` | `""` | `"python"` | `"python"` | `"python"` |
| **request.Source** | `"print('hello')"` | `"print('hello')"` | `"print('hello')"` | `""` | `"print('hello')"` | `"# comment\nprint('hello')"` |
| **HttpClient available** | O | O | O | O | O | O |
| **Formatter service at _baseUrl accessible** | O | O | O | O | O | O |
| **lang is not null/empty** | O | — | — | O | O | O |
| **lang is null/empty** | — | — | O | — | — | — |
| **lang is a valid language** | O | — | — | O | O | O |
| **lang is an invalid language** | — | O | — | — | — | — |
| **request.Source is not null/empty** | O | O | O | — | O | O |
| **request.Source is null/empty** | — | — | — | O | — | — |
| **HttpClient returns 200 OK** | O | — | — | — | O | O |
| **HttpClient returns 400 Bad Request** | — | O | — | — | — | — |
| **Formatter returns null Formatted** | — | — | — | — | O | — |

---

**Expected Output:**

| | Expected | Exceptions | Log Messages |
|---|----------|------------|-------------|
| **UTCD-01** | Returns FormatCodeResponse | Formatted != null | — |
| **UTCD-02** | — | HttpRequestException | HttpRequestException |
| **UTCD-03** | — | ArgumentException | ArgumentException: Language is required for code formatting. |
| **UTCD-04** | — | ArgumentException | ArgumentException: Source code is required for formatting. |
| **UTCD-05** | Returns FormatCodeResponse | Formatted == null (handled gracefully) | — |
| **UTCD-06** | Returns FormatCodeResponse | Formatted source returned | — |
