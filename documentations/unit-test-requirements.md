# BÁO CÁO YÊU CẦU UNIT TEST — DỰ ÁN EDUACAS

> Phiên bản: 2.0
> Ngày: 19/04/2026
> Mục đích: Tài liệu mô tả toàn bộ unit test (test từng HÀM) cho backend .NET
> Quy tắc: Mỗi hàm có nhiều test case bao quát preconditions, expected outputs, exceptions, và log messages

---

## MỤC LỤC

1. [Quy tắc viết Unit Test](#quy-tắc-viết-unit-test)
2. [AuthService — Utils](#2-authservice--utils)
3. [AuthService — Commands](#3-authservice--commands)
4. [AuthService — Queries](#4-authservice--queries)
5. [AcasService — Utils](#5-acaservice--utils)
6. [AcasService — Jobs](#6-acaservice--jobs)
7. [AcasService — Commands](#7-acaservice--commands)
8. [AcasService — Queries](#8-acaservice--queries)
9. [AcasService — CodeRunner](#9-acaservice--coderunner)

---

## QUY TẮC VIẾT UNIT TEST

### Cấu trúc test case

Mỗi test case bao gồm:

| Trường | Mô tả |
|--------|--------|
| **Precondition** | Điều kiện đầu vào cụ thể cho hàm |
| **Input Data** | Dữ liệu đầu vào thực tế |
| **Expected Output** | Kết quả mong đợi (return value) |
| **Expected Exception** | Exception cụ thể + message |
| **Log Messages** | Các log được ghi ra |
| **Status** | Pending / Done |

### Format test case

```csharp
// Happy path: input hợp lệ → return đúng
[Fact]
public void MethodName_ValidInput_ReturnsExpectedResult()
{
    // Arrange: mock dependencies, setup input
    // Act: gọi hàm
    // Assert: kiểm tra return value và mocks
}

// Error case: input không hợp lệ → throw exception
[Fact]
public void MethodName_InvalidInput_ThrowsSpecificException()
{
    // Arrange
    // Act & Assert
    await Assert.ThrowsAsync<SpecificException>(() => sut.Method(params));
}
```

---

## 2. AUTHSERVICE — UTILS

---

### 2.1. JwtUtil

**File:** `Application/Utils/JwtUtil.cs`

#### `string GenerateAccessToken(JwtPayload payload)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| JWT-GAT-01 | Valid payload returns non-empty token | Valid JwtPayload với Id, Email, Role | payload = { Id="u1", Email="a@b.com", Role="User" } | Returns non-empty string, split('.') == 3 | - | - | Pending |
| JWT-GAT-02 | Different payloads produce different tokens | 2 JwtPayload khác nhau | payload1={Id:"1"}, payload2={Id:"2"} | token1 != token2 | - | - | Pending |
| JWT-GAT-03 | Token with 7h expiration | JwtPayload valid | accessExpiration="7h" | token.ValidTo ~ now+7h | - | - | Pending |
| JWT-GAT-04 | Token with 30m expiration | JwtPayload valid | accessExpiration="30m" | token.ValidTo ~ now+30min | - | - | Pending |
| JWT-GAT-05 | Token with invalid expiration format defaults to 1d | JwtPayload valid | accessExpiration="invalid" | token.ValidTo ~ now+1d | - | - | Pending |
| JWT-GAT-06 | Token contains correct claims | JwtPayload valid | payload={Id:"u1",Email:"a@b.com",Role:"Admin"} | token.Claims chứa "id"=u1, "email"=a@b.com, "role"=Admin | - | - | Pending |
| JWT-GAT-07 | Token with special characters in payload | JwtPayload với unicode/special chars | payload={Id:"u-1_2",Email:"üser@example.com",Role:"Super-Admin"} | Returns valid token | - | - | Pending |

#### `string GenerateRefreshToken(JwtPayload payload)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| JWT-GRT-01 | Valid payload returns non-empty token | Valid JwtPayload | payload={Id:"u1"} | Returns non-empty string, 3 parts | - | - | Pending |
| JWT-GRT-02 | Refresh token expires later than access token | Valid JwtPayload | payload={Id:"u1"} | refreshToken.ValidTo > accessToken.ValidTo | - | - | Pending |
| JWT-GRT-03 | Token contains correct claims | Valid JwtPayload | payload={Id:"u1",Email:"a@b.com",Role:"User"} | token.Claims chứa id, email, role | - | - | Pending |

#### `Task<JwtPayload> VerifyAsync(string token)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| JWT-V-01 | Valid token returns correct payload | Token được tạo bởi GenerateAccessToken | token = validJWT | Returns JwtPayload với Id, Email, Role đúng | - | - | Pending |
| JWT-V-02 | Invalid token throws SecurityTokenException | Token không phải JWT hợp lệ | token = "invalid.token.here" | - | SecurityTokenException, message chứa "Invalid token" | - | Pending |
| JWT-V-03 | Tampered token throws SecurityTokenException | Valid token bị sửa signature | token = validToken + "tampered" | - | SecurityTokenException | - | Pending |
| JWT-V-04 | Expired token throws SecurityTokenException | Token có expiration=0s | token = expiredToken | - | SecurityTokenException | - | Pending |
| JWT-V-05 | Token signed with different secret throws | Token tạo bởi secret A, verify bằng secret B | token = tokenFromSecretA | - | SecurityTokenException | - | Pending |
| JWT-V-06 | Empty token throws SecurityTokenException | Token rỗng | token = "" | - | SecurityTokenException | - | Pending |
| JWT-V-07 | Null token throws SecurityTokenException | Token null | token = null | - | SecurityTokenException | - | Pending |

#### `Constructor`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| JWT-CTOR-01 | Null secret throws InvalidOperationException | IConfiguration không có JwtSecret | config["Jwt:JwtSecret"] = null | - | InvalidOperationException, "JWT_SECRET is not configured" | - | Pending |
| JWT-CTOR-02 | Empty secret throws InvalidOperationException | IConfiguration có JwtSecret = "" | config["Jwt:JwtSecret"] = "" | - | InvalidOperationException, "JWT_SECRET is not configured" | - | Pending |

---

### 2.2. HashingUtil (Static)

**File:** `Application/Utils/HashingUtil.cs`

#### `string HashString(string input, IConfiguration configuration)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| HASH-HS-01 | Valid input returns non-empty 64-char hash | Input string, valid config | input="test-password" | Returns 64-char lowercase hex string | - | - | Pending |
| HASH-HS-02 | Same input produces same hash (deterministic) | Input string, valid config | input="consistent" | hash1 == hash2 == hash3 | - | - | Pending |
| HASH-HS-03 | Different inputs produce different hashes | Input strings | input1="one", input2="two" | hash1 != hash2 | - | - | Pending |
| HASH-HS-04 | Hash is lowercase hex | Input string | input="test" | hash matches ^[0-9a-f]{64}$ | - | - | Pending |
| HASH-HS-05 | Hash differs from input | Input string | input="mypassword123" | hash != input | - | - | Pending |
| HASH-HS-06 | Unicode input returns valid hash | Input với unicode | input="中文测试 français" | Returns 64-char hash | - | - | Pending |
| HASH-HS-07 | Empty string input returns valid hash | Input = "" | input="" | Returns 64-char hash (khác hash của "a") | - | - | Pending |
| HASH-HS-08 | Whitespace-only input returns valid hash | Input chỉ có khoảng trắng | input="   " | Returns 64-char hash | - | - | Pending |
| HASH-HS-09 | Null secret key config throws | config["HashingSecretKey"] = null | input="test" | - | InvalidOperationException, "HASHING_SECRET_KEY is not configured" | - | Pending |
| HASH-HS-10 | Empty secret key config throws | config["HashingSecretKey"] = "" | input="test" | - | InvalidOperationException, "HASHING_SECRET_KEY is not configured" | - | Pending |
| HASH-HS-11 | Different secrets produce different hashes for same input | 2 config với secret khác nhau | input="same" | hash1 != hash2 | - | - | Pending |

#### `bool VerifyHash(string input, string hash, IConfiguration configuration)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| HASH-VH-01 | Correct input and hash returns true | Input đúng, hash đúng | input="password", hash=HashString("password") | true | - | - | Pending |
| HASH-VH-02 | Wrong input returns false | Input sai, hash đúng | input="wrong", hash=HashString("correct") | false | - | - | Pending |
| HASH-VH-03 | Tampered hash returns false | Input đúng, hash bị sửa | input="test", hash=tamperedHash | false | - | - | Pending |
| HASH-VH-04 | Different secret returns false | Hash tạo bằng secret A, verify bằng secret B | input="test", hash=hashA | false | - | - | Pending |
| HASH-VH-05 | Case sensitive - uppercase fails | Hash của lowercase | input="PASSWORD", hash=HashString("password") | false | - | - | Pending |
| HASH-VH-06 | Empty hash returns false | Hash = "" | input="test", hash="" | false | - | - | Pending |
| HASH-VH-07 | Malformed hash returns false | Hash không phải hex | input="test", hash="not-a-valid-hex-hash" | false | - | - | Pending |
| HASH-VH-08 | Whitespace difference returns false | Input có/không có trailing space | input="pass ", hash=HashString("pass") | false | - | - | Pending |

---

### 2.3. OptGenerator (Static)

**File:** `Application/Utils/OptGenerator.cs`

#### `string GenerateOpt(int length = 6)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| OTP-G-01 | Default length 6 returns 6-digit string | length=6 (default) | (gọi không tham số) | Returns string length=6 | - | - | Pending |
| OTP-G-02 | Length 4 returns 4-digit string | length=4 | length=4 | Returns string length=4 | - | - | Pending |
| OTP-G-03 | Length 10 returns 10-digit string | length=10 | length=10 | Returns string length=10 | - | - | Pending |
| OTP-G-04 | Length 1 returns 1-digit string | length=1 | length=1 | Returns string length=1 | - | - | Pending |
| OTP-G-05 | Length 0 returns empty string | length=0 | length=0 | Returns "" | - | - | Pending |
| OTP-G-06 | Length 100 returns 100-digit string | length=100 | length=100 | Returns string length=100 | - | - | Pending |
| OTP-G-07 | Result contains only digits | any length | length=6, gọi nhiều lần | result.All(char.IsDigit) == true | - | - | Pending |
| OTP-G-08 | Multiple calls produce different results (randomness) | gọi nhiều lần | length=6, gọi 100 lần | Có ít nhất 90 kết quả khác nhau | - | - | Pending |
| OTP-G-09 | All digits 0-9 are possible | gọi đủ nhiều lần | length=6, gọi 10000 lần | Mỗi digit 0-9 xuất hiện ít nhất 1 lần | - | - | Pending |

---

### 2.4. GoogleTokenVerifier

**File:** `Application/Utils/GoogleTokenVerifier.cs`

#### `Task<GoogleTokenPayload> VerifyTokenAsync(string idToken)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| GTV-V-01 | Valid Google ID token returns payload with Email | Valid token từ Google OAuth | idToken = validGoogleToken | Returns GoogleTokenPayload với Email != null | - | - | Pending |
| GTV-V-02 | Valid token returns payload with GoogleId | Valid token | idToken = validGoogleToken | Returns payload.GoogleId != null | - | - | Pending |
| GTV-V-03 | Valid token returns payload with Name and Picture | Valid token | idToken = validGoogleToken | Returns payload.Name != null, payload.Picture != null | - | - | Pending |
| GTV-V-04 | Null token throws InvalidOperationException | token = null | idToken = null | - | InvalidOperationException, message chứa "Google token" | - | Pending |
| GTV-V-05 | Empty token throws InvalidOperationException | token = "" | idToken = "" | - | InvalidOperationException | - | Pending |
| GTV-V-06 | Whitespace-only token throws | token = "   " | idToken = "   " | - | InvalidOperationException | - | Pending |
| GTV-V-07 | Malformed token throws | token không đúng format | idToken = "not.a.valid.jwt" | - | InvalidOperationException | - | Pending |
| GTV-V-08 | Token with wrong audience throws | Token tạo cho client ID khác | idToken = tokenForDifferentClientId | - | InvalidOperationException | - | Pending |
| GTV-V-09 | Expired token throws | Token đã hết hạn | idToken = expiredToken | - | InvalidOperationException | - | Pending |
| GTV-V-10 | Token missing parts throws | Token chỉ có 2 phần | idToken = "only.two.parts" | - | InvalidOperationException | - | Pending |

#### `Constructor`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| GTV-CTOR-01 | Missing ClientId throws | config["Google:ClientId"] = null | IConfiguration mock | - | InvalidOperationException, "Google:ClientId is not configured" | - | Pending |
| GTV-CTOR-02 | Empty ClientId throws | config["Google:ClientId"] = "" | IConfiguration mock | - | InvalidOperationException, "Google:ClientId is not configured" | - | Pending |

---

### 2.5. ResponseUtil (Static)

**File:** `Application/Utils/ResponseUtil.cs`

#### `ActionResult Success<T>(T dataResponse, string message = "Success", int statusCode = 200)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RU-S-01 | With data returns 200 status | T = object | data={Id:1,Name:"Test"} | result.StatusCode==200 | - | - | Pending |
| RU-S-02 | With data returns ApiResponse with Success=true | T = string | data="test" | response.Success==true, response.DataResponse=="test" | - | - | Pending |
| RU-S-03 | With default message returns "Success" | T = object | (không truyền message) | response.Message=="Success" | - | - | Pending |
| RU-S-04 | With custom message returns custom message | T = string | data="ok", message="Created successfully" | response.Message=="Created successfully" | - | - | Pending |
| RU-S-05 | With custom status code returns 201 | T = object | data={Id:1}, statusCode=201 | result.StatusCode==201 | - | - | Pending |
| RU-S-06 | With null data returns null in response | T = string | data=null | response.DataResponse==null | - | - | Pending |
| RU-S-07 | With complex object returns correct data | T = nested object | data={Nested:{Value:"x"},List:[1,2,3]} | response.DataResponse != null | - | - | Pending |

#### `ActionResult<ApiResponse<T>> Error<T>(string message = "Internal Server Error", int statusCode = 500, string? error = null, string? stack = null)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RU-E-01 | Default returns 500 status | T = string | (gọi không tham số) | result.StatusCode==500 | - | - | Pending |
| RU-E-02 | Default message is "Internal Server Error" | T = string | (không truyền message) | response.Message=="Internal Server Error" | - | - | Pending |
| RU-E-03 | With custom message returns custom message | T = int | message="Not Found" | response.Message=="Not Found" | - | - | Pending |
| RU-E-04 | With custom status code returns correct code | T = object | statusCode=400 | result.StatusCode==400 | - | - | Pending |
| RU-E-05 | With 404 returns NotFound response | T = string | message="Resource not found", statusCode=404 | result.StatusCode==404, response.Success==false | - | - | Pending |
| RU-E-06 | With error detail includes error in response | T = string | error="Detailed error info" | response.Error=="Detailed error info" | - | - | Pending |
| RU-E-07 | Without error detail has null error | T = string | (không truyền error) | response.Error==null | - | - | Pending |
| RU-E-08 | With stack trace includes stack in response | T = string | stack="at SomeMethod() in File.cs:line 42" | response.Stack=="at SomeMethod()..." | - | - | Pending |
| RU-E-09 | Generic type returns correct response type | T = List<int> | T=List<int> | result.Value is ApiResponse<List<int>> | - | - | Pending |

---

## 3. AUTHSERVICE — COMMANDS

---

### 3.1. UserCommand

**File:** `Application/Commands/UserCommand.cs`
**Dependencies:** IUserRepository, IUserOptCacheRepository, IUserCacheRepository, JwtUtil, UserMapper, IEmailService, IConfiguration

#### `Task<AuthResponse> CreateUserAsync(RegisterData registerData)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-CU-01 | New user creates successfully and returns AuthResponse | User chưa tồn tại | RegisterData {Email:"new@test.com",Password:"pass123",Fullname:"New User",Role:STUDENT} | Returns AuthResponse với AccessToken != null, RefreshToken != null, UserProfile.Email=="new@test.com" | - | LogInformation("User created: {Email}", email) | Pending |
| UC-CU-02 | Duplicate email throws InvalidOperationException | User đã tồn tại | RegisterData {Email:"existing@test.com"} | - | InvalidOperationException, "User with this email already exists." | - | Pending |
| UC-CU-03 | Repository returns null throws | Repo.CreateAsync returns null | RegisterData valid | - | InvalidOperationException, "An error occurred while creating the account" | LogError | Pending |
| UC-CU-04 | Email sending failure is logged but doesn't throw | EmailService.SendEmailAsync throws | RegisterData valid, email fails | Returns AuthResponse (email error is non-critical) | - | LogWarning("Failed to send welcome email") | Pending |

#### `Task<string> RegisterWithEmailVerificationAsync(RegisterData registerData)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-RE-01 | New email saves to cache and returns session string | User chưa tồn tại | RegisterData {Email:"new@test.com"} | Returns non-empty string (registerSession) | - | - | Pending |
| UC-RE-02 | Duplicate email throws | User đã tồn tại | RegisterData {Email:"existing@test.com"} | - | InvalidOperationException, "User with this email already exists." | - | Pending |
| UC-RE-03 | Cache save failure throws | Cache.SaveAsync returns false | RegisterData valid | - | InvalidOperationException, "Failed to save user to cache" | LogError | Pending |

#### `Task<bool> VerifyEmailAsync(VerifyEmailRequest verifyEmailRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-VE-01 | Valid session + correct OTP saves user to DB and returns true | Session tồn tại trong cache với OTP đúng | VerifyEmailRequest {RegisterSession:"valid-session", Opt:"123456"} | Returns true, User tạo trong DB | - | LogInformation("Email verified") | Pending |
| UC-VE-02 | Invalid register session throws | Session không tồn tại trong cache | VerifyEmailRequest {RegisterSession:"invalid-session", Opt:"123456"} | - | InvalidOperationException, "Invalid register session" | - | Pending |
| UC-VE-03 | Wrong OTP throws | Session tồn tại nhưng OTP sai | VerifyEmailRequest {RegisterSession:"valid-session", Opt:"999999"} | - | InvalidOperationException, "Invalid register session" | - | Pending |
| UC-VE-04 | Save to DB fails throws | Repo.CreateAsync returns null | VerifyEmailRequest valid | - | InvalidOperationException, "Failed to save user to database" | LogError | Pending |

#### `Task<bool> SendForgotPasswordLinkAsync(ForgotPasswordRequest forgotPasswordRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-FP-01 | Existing user saves to cache and sends email returns true | User tồn tại | ForgotPasswordRequest {Email:"user@test.com"} | Returns true | - | LogInformation | Pending |
| UC-FP-02 | User not found throws | User không tồn tại | ForgotPasswordRequest {Email:"nonexistent@test.com"} | - | InvalidOperationException, "User not found" | - | Pending |
| UC-FP-03 | Cache save fails throws | Cache.SaveAsync returns false | ForgotPasswordRequest {Email:"user@test.com"} | - | InvalidOperationException, "Failed to save user to cache" | LogError | Pending |

#### `Task<bool> ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-RP-01 | Valid token updates password returns true | Token tồn tại trong cache | ResetPasswordRequest {Token:"valid-token",NewPassword:"newpass123"} | Returns true | - | LogInformation | Pending |
| UC-RP-02 | Invalid token throws | Token không tồn tại trong cache | ResetPasswordRequest {Token:"invalid-token"} | - | InvalidOperationException, "Invalid token" | - | Pending |
| UC-RP-03 | Update fails throws | Repo.UpdatePasswordAsync returns null | ResetPasswordRequest valid | - | InvalidOperationException, "Failed to update user password" | LogError | Pending |

#### `Task<GrantAccountResponse> GrantAccountAsync(GrantAccountRequest grantAccountRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-GA-01 | Valid LECTURER creates with temp password | Role=LECTURER, email chưa tồn tại | GrantAccountRequest {Email:"lec@test.com",Role:"LECTURER"} | Returns GrantAccountResponse với TempPassword != null | - | LogInformation | Pending |
| UC-GA-02 | Valid STUDENT creates with temp password | Role=STUDENT, email chưa tồn tại | GrantAccountRequest {Email:"stu@test.com",Role:"STUDENT"} | Returns GrantAccountResponse với TempPassword != null | - | LogInformation | Pending |
| UC-GA-03 | ADMIN role throws | Role=ADMIN | GrantAccountRequest {Role:"ADMIN"} | - | InvalidOperationException, "Admin can only grant accounts to Lecturer or Student" | - | Pending |
| UC-GA-04 | Duplicate email throws | Email đã tồn tại | GrantAccountRequest {Email:"existing@test.com"} | - | InvalidOperationException, "User with this email already exists" | - | Pending |
| UC-GA-05 | Create fails throws | Repo.CreateAsync returns null | GrantAccountRequest valid | - | InvalidOperationException, "Failed to create user account" | LogError | Pending |

#### `Task<bool> ResetFirstLoginPasswordAsync(ResetFirstLoginPasswordRequest resetFirstLoginRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-RFL-01 | First login user resets password successfully | User.FirstLogin=true, user tồn tại | ResetFirstLoginPasswordRequest {Email:"user@test.com",NewPassword:"newpass"} | Returns true | - | LogInformation | Pending |
| UC-RFL-02 | User not found throws | User không tồn tại | ResetFirstLoginPasswordRequest {Email:"nonexistent@test.com"} | - | InvalidOperationException, "User not found" | - | Pending |
| UC-RFL-03 | Not first login user throws | User.FirstLogin=false | ResetFirstLoginPasswordRequest {Email:"user@test.com"} | - | InvalidOperationException, "This endpoint is only for users on first login" | - | Pending |
| UC-RFL-04 | Update fails throws | Repo returns null | ResetFirstLoginPasswordRequest valid | - | InvalidOperationException, "Failed to reset password" | LogError | Pending |

#### `Task<bool> ChangePasswordAsync(string accessToken, ChangePasswordRequest changePasswordRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-CP-01 | Correct current password updates successfully | CurrentPassword đúng, user tồn tại | accessToken=valid, ChangePasswordRequest {CurrentPassword:"old",NewPassword:"new",ConfirmPassword:"new"} | Returns true | - | LogInformation | Pending |
| UC-CP-02 | User not found (invalid token) throws | Token không decode được hoặc user không tồn tại | accessToken=invalid | - | InvalidOperationException, "User not found" | - | Pending |
| UC-CP-03 | Wrong current password throws | CurrentPassword sai | accessToken=valid, ChangePasswordRequest {CurrentPassword:"wrong"} | - | InvalidOperationException, "Current password is incorrect" | - | Pending |
| UC-CP-04 | New password != confirm password throws | NewPassword != ConfirmPassword | accessToken=valid, ChangePasswordRequest {NewPassword:"new1",ConfirmPassword:"new2"} | - | InvalidOperationException, "New password and confirm password do not match" | - | Pending |
| UC-CP-05 | New password too short (< 5 chars) throws | NewPassword.Length < 5 | accessToken=valid, ChangePasswordRequest {NewPassword:"1234"} | - | InvalidOperationException, "New password must be between 5 and 64 characters" | - | Pending |
| UC-CP-06 | New password too long (> 64 chars) throws | NewPassword.Length > 64 | accessToken=valid, NewPassword=65-char string | - | InvalidOperationException, "New password must be between 5 and 64 characters" | - | Pending |
| UC-CP-07 | Update fails throws | Repo.UpdatePasswordAsync returns null | accessToken=valid, valid request | - | InvalidOperationException, "Failed to update password" | LogError | Pending |

#### `Task<UserProfileResponse> UpdateUserAsync(string userId, string? fullname, string? roleNumber, Role? role, bool? isEnable)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-UU-01 | Valid userId updates fields returns UserProfileResponse | User tồn tại | userId="u1", fullname="Updated", role=LECTURER | Returns UserProfileResponse với fullname="Updated" | - | LogInformation | Pending |
| UC-UU-02 | FindByIdAsync returns null throws | User không tồn tại | userId="nonexistent" | - | InvalidOperationException, "Failed to update user" | LogError | Pending |
| UC-UU-03 | Update fails throws | Repo.UpdateUserAsync returns null | userId="u1", valid params | - | InvalidOperationException, "Failed to update user" | LogError | Pending |

#### `Task<UserProfileResponse> UpdateProfileAsync(string accessToken, string? fullname, DateTime? birthday, string? avatarUrl)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UC-UP-01 | Valid token updates own profile returns UserProfileResponse | Token hợp lệ, user tồn tại | accessToken=valid, fullname="New Name" | Returns UserProfileResponse với fullname="New Name" | - | LogInformation | Pending |
| UC-UP-02 | User not found (invalid token) throws | Token decode fails | accessToken=invalid | - | SecurityTokenException -> wrapped as InvalidOperationException | - | Pending |
| UC-UP-03 | Update fails throws | Repo.UpdateProfileAsync returns null | accessToken=valid, valid params | - | InvalidOperationException, "Failed to update profile" | LogError | Pending |

---

## 4. AUTHSERVICE — QUERIES

---

### 4.1. UserQuery

**File:** `Application/Queries/UserQuery.cs`
**Dependencies:** IUserRepository, IConfiguration, JwtUtil, UserMapper, GoogleTokenVerifier

#### `Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UQ-A-01 | Valid email/password returns AuthResponse with tokens | credentials hợp lệ, user.IsEnable=true | LoginCredentials {Email:"user@test.com",Password:"correctpass"} | Returns AuthResponse với AccessToken != null, RefreshToken != null | - | - | Pending |
| UQ-A-02 | Wrong password throws | User tồn tại, password sai | LoginCredentials {Password:"wrongpass"} | - | InvalidOperationException, "Invalid email or password" | - | Pending |
| UQ-A-03 | User not found throws | Email không tồn tại | LoginCredentials {Email:"nonexistent@test.com"} | - | InvalidOperationException, "Invalid email or password" | - | Pending |
| UQ-A-04 | Disabled user throws | User.IsEnable=false | LoginCredentials valid, user.IsEnable=false | - | InvalidOperationException, "User is forbidden" | - | Pending |

#### `Task<AuthResponse> AuthenticateWithGoogleAsync(string idToken)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UQ-AG-01 | Valid token + existing user with GoogleId returns AuthResponse | Token valid, user tồn tại với đúng GoogleId | idToken="valid-google-token" | Returns AuthResponse với tokens | - | - | Pending |
| UQ-AG-02 | Valid token + existing user without GoogleId links account | Token valid, user tồn tại nhưng GoogleId empty | idToken="valid-google-token" | Calls UpdateGoogleIdAsync, returns AuthResponse | - | LogInformation("Google ID linked") | Pending |
| UQ-AG-03 | Valid token + new user creates and returns AuthResponse | Token valid, user không tồn tại | idToken="valid-google-token" | Calls CreateAsync, returns AuthResponse | - | LogInformation | Pending |
| UQ-AG-04 | Invalid Google token throws | Token không hợp lệ | idToken="invalid-token" | - | InvalidOperationException, "Invalid Google token" | - | Pending |
| UQ-AG-05 | Existing user with different GoogleId throws | User tồn tại nhưng GoogleId khác | idToken="valid-google-token", user.GoogleId="different-id" | - | InvalidOperationException, "Google ID does not match this account" | - | Pending |
| UQ-AG-06 | Disabled user throws | User tồn tại nhưng IsEnable=false | idToken="valid-google-token", user.IsEnable=false | - | InvalidOperationException, "User is forbidden" | - | Pending |
| UQ-AG-07 | User not found and can't create throws | Token valid nhưng user not found và CreateAsync fails | idToken="valid-google-token" | - | InvalidOperationException, "User not found with this email" | LogError | Pending |

#### `Task<UserProfileResponse> GetProfileAsync(string accessToken)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UQ-GP-01 | Valid token returns correct UserProfileResponse | Token hợp lệ, user tồn tại, IsEnable=true | accessToken=validJWT | Returns UserProfileResponse với đúng Id, Email, Role | - | - | Pending |
| UQ-GP-02 | Invalid token throws SecurityTokenException | Token không hợp lệ | accessToken="invalid.jwt.token" | - | SecurityTokenException | - | Pending |
| UQ-GP-03 | User not found throws | Token hợp lệ nhưng user không tồn tại | accessToken=validJWT, userId không tồn tại | - | InvalidOperationException, "User not found or inactive" | - | Pending |
| UQ-GP-04 | Disabled user throws | User tồn tại nhưng IsEnable=false | accessToken=validJWT, user.IsEnable=false | - | InvalidOperationException, "User not found or inactive" | - | Pending |

#### `Task<List<UserProfileResponse>> GetAllUsersAsync()`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UQ-GAU-01 | Users exist returns list with correct count | Repo trả về list | (không có input) | Returns list với đúng số lượng và emails | - | - | Pending |
| UQ-GAU-02 | No users returns empty list | Repo trả về empty list | (không có input) | Returns empty list | - | - | Pending |
| UQ-GAU-03 | Repository throws exception re-thrown | Repo throws | (không có input) | - | Exception("Database error") được rethrow | LogError | Pending |

#### `Task<PagedResult<UserProfileResponse>> GetPagedUsersAsync(int pageIndex, int pageSize, string? searchTerm = null, string? role = null, bool? isEnable = null)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UQ-GPU-01 | Valid params returns correct PagedResult | Repo trả về items + totalCount | pageIndex=0, pageSize=10 | Returns PagedResult với Items.Count, TotalCount, TotalPages đúng | - | - | Pending |
| UQ-GPU-02 | Empty results returns empty PagedResult | Repo trả về empty | pageIndex=0, pageSize=10 | Items empty, TotalCount=0, TotalPages=0 | - | - | Pending |
| UQ-GPU-03 | With searchTerm delegates to repository | searchTerm được truyền | searchTerm="john" | Repo.FindPagedAsync được gọi với searchTerm | - | - | Pending |
| UQ-GPU-04 | With role filter delegates to repository | role được truyền | role="STUDENT" | Repo.FindPagedAsync được gọi với role | - | - | Pending |
| UQ-GPU-05 | With isEnable filter delegates to repository | isEnable được truyền | isEnable=true | Repo.FindPagedAsync được gọi với isEnable | - | - | Pending |
| UQ-GPU-06 | Combined filters delegates with all params | tất cả filters | searchTerm="j", role="LECTURER", isEnable=true | Repo.FindPagedAsync được gọi với tất cả params | - | - | Pending |
| UQ-GPU-07 | PagedResult has correct pagination metadata | pageIndex=0, pageSize=10, total=25 | pageIndex=0, pageSize=10 | TotalPages=3, HasNextPage=true, HasPreviousPage=false | - | - | Pending |
| UQ-GPU-08 | Last page has correct metadata | pageIndex=2, pageSize=10, total=25 | pageIndex=2, pageSize=10 | HasNextPage=false, HasPreviousPage=true | - | - | Pending |
| UQ-GPU-09 | Repository throws exception re-thrown | Repo throws | pageIndex=0, pageSize=10 | - | Exception re-thrown | LogError | Pending |

#### `Task<CheckEmailExistsResponse> CheckEmailExistsAsync(string email)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UQ-CE-01 | Email exists returns Exists=true | User tồn tại | email="existing@test.com" | CheckEmailExistsResponse {Exists=true} | - | - | Pending |
| UQ-CE-02 | Email does not exist returns Exists=false | User không tồn tại | email="nonexistent@test.com" | CheckEmailExistsResponse {Exists=false, Message="Email not found in the system"} | - | - | Pending |
| UQ-CE-03 | Repository throws exception re-thrown | Repo throws | email="test@test.com" | - | Exception re-thrown | LogError | Pending |

---

## 5. ACASSERVICE — UTILS

---

### 5.1. ResultComparator

**File:** `Application/Commands/Submission/ResultComparator.cs`

#### `TestcaseStatus Compare(string expectedOutput, string output, TestcaseOption option)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RC-C-01 | Exact match returns SUCCESS | expected="Hello World", actual="Hello World", exact mode | expectedOutput="Hello World", actual="Hello World", option={exact} | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-02 | Exact mismatch returns FAIL | expected="Hello", actual="World", exact mode | expectedOutput="Hello", actual="World" | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-03 | Case insensitive match returns SUCCESS | expected="HELLO", actual="hello", case-insensitive | expectedOutput="HELLO", actual="hello", option.IsCaseInsensitive=true | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-04 | Case insensitive mismatch returns FAIL | expected="HELLO", actual="WORLD", case-insensitive | expectedOutput="HELLO", actual="WORLD", option.IsCaseInsensitive=true | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-05 | Floating point within tolerance returns SUCCESS | tolerance=0.0001, diff<0.0001 | expected="3.14159", actual="3.14160", option.IsFloatingPoint=true, FloatingPointTolerance=0.0001 | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-06 | Floating point outside tolerance returns FAIL | tolerance=0.01, diff=0.06 > 0.01 | expected="3.14", actual="3.20", option.IsFloatingPoint=true, FloatingPointTolerance=0.01 | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-07 | Floating point exact match returns SUCCESS | exact match với floating mode | expected="3.14", actual="3.14", option.IsFloatingPoint=true, FloatingPointTolerance=0.01 | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-08 | Token comparison exact returns SUCCESS | tokens identical | expected="foo bar baz", actual="foo bar baz", option.IsTokenComparision=true | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-09 | Token comparison different order returns FAIL | tokens cùng nhưng thứ tự khác, ordered mode | expected="foo bar baz", actual="foo baz bar", option.IsTokenComparision=true, IsNotOrderedComparision=false | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-10 | Token comparison extra token returns FAIL | token count khác nhau | expected="foo bar", actual="foo bar baz", option.IsTokenComparision=true | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-11 | Unordered token comparison exact returns SUCCESS | tokens giống nhưng khác thứ tự | expected="cat dog bird", actual="dog bird cat", option.IsTokenComparision=true, IsNotOrderedComparision=true | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-12 | Unordered token comparison missing token returns FAIL | token count khác nhau trong unordered mode | expected="cat dog bird", actual="cat dog", option.IsTokenComparision=true, IsNotOrderedComparision=true | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-13 | Empty expected, empty actual returns SUCCESS | boundary null/empty | expectedOutput="", actual="" | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-14 | Empty expected, non-empty actual returns FAIL | | expectedOutput="", actual="result" | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-15 | Whitespace normalization returns SUCCESS | whitespace collapsed to single space | expected="Hello   World", actual="Hello World", option.IsTokenComparision=true | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-16 | Floating point with decimal places rounding | decimalPlaces=2 | expected="3.14", actual="3.14159", option.IsFloatingPoint=true, DecimalPlaces=2 | TestcaseStatus.SUCCESS | - | - | Pending |
| RC-C-17 | Floating point NaN comparison returns FAIL | actual output is NaN | expected="0.0", actual="NaN", option.IsFloatingPoint=true | TestcaseStatus.FAIL | - | - | Pending |
| RC-C-18 | Token comparison with special characters | special chars preserved | expected="a@b#c$d", actual="a@b#c$d", option.IsTokenComparision=true | TestcaseStatus.SUCCESS | - | - | Pending |

---

### 5.2. TextAnswerComparer (Static)

**File:** `Application/Utils/TextAnswerComparer.cs`

#### `string NormalizeSingleChoice(string? answer)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TAC-NS-01 | Null input returns empty string | answer=null | NormalizeSingleChoice(null) | Returns "" | - | - | Pending |
| TAC-NS-02 | Empty input returns empty string | answer="" | NormalizeSingleChoice("") | Returns "" | - | - | Pending |
| TAC-NS-03 | Valid input returns ToUpperInvariant | answer="a" | NormalizeSingleChoice("a") | Returns "A" | - | - | Pending |
| TAC-NS-04 | Mixed case returns uppercase | answer="AbC" | NormalizeSingleChoice("AbC") | Returns "ABC" | - | - | Pending |

#### `string NormalizeMultipleChoice(string? answer)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TAC-NM-01 | Null input returns empty string | answer=null | NormalizeMultipleChoice(null) | Returns "" | - | - | Pending |
| TAC-NM-02 | Empty input returns empty string | answer="" | NormalizeMultipleChoice("") | Returns "" | - | - | Pending |
| TAC-NM-03 | Valid input returns ToUpperInvariant | answer="a" | NormalizeMultipleChoice("a") | Returns "A" | - | - | Pending |
| TAC-NM-04 | Multiple letters separated by space returns uppercase | answer="a b c" | NormalizeMultipleChoice("a b c") | Returns "A B C" | - | - | Pending |

#### `bool CompareSingleChoice(string? expectedAnswer, string? submittedAnswer)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TAC-CS-01 | Both null returns true | expected=null, submitted=null | CompareSingleChoice(null, null) | true | - | - | Pending |
| TAC-CS-02 | Both empty returns true | expected="", submitted="" | CompareSingleChoice("", "") | true | - | - | Pending |
| TAC-CS-03 | Exact match returns true | normalized giống nhau | CompareSingleChoice("A", "A") | true | - | - | Pending |
| TAC-CS-04 | Case difference returns true | normalized giống nhau | CompareSingleChoice("A", "a") | true | - | - | Pending |
| TAC-CS-05 | Mismatch returns false | normalized khác nhau | CompareSingleChoice("A", "B") | false | - | - | Pending |
| TAC-CS-06 | One null, one empty returns true | | CompareSingleChoice(null, "") | true | - | - | Pending |

#### `bool CompareMultipleChoice(string? expectedAnswer, string? submittedAnswer)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TAC-CM-01 | Both null returns true | | CompareMultipleChoice(null, null) | true | - | - | Pending |
| TAC-CM-02 | Exact match returns true | | CompareMultipleChoice("A B C", "A B C") | true | - | - | Pending |
| TAC-CM-03 | Case difference returns true | | CompareMultipleChoice("a b", "A B") | true | - | - | Pending |
| TAC-CM-04 | Order difference returns true | | CompareMultipleChoice("A B", "B A") | true | - | - | Pending |
| TAC-CM-05 | Missing option returns false | | CompareMultipleChoice("A B C", "A B") | false | - | - | Pending |
| TAC-CM-06 | Extra option returns false | | CompareMultipleChoice("A B", "A B C") | false | - | - | Pending |

#### `bool CompareByQuestionType(QuestionType questionType, string? expectedAnswer, string? submittedAnswer)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TAC-CQ-01 | SINGLE_CHOICE calls CompareSingleChoice | questionType=SINGLE_CHOICE | expected="A", submitted="a" | true | - | - | Pending |
| TAC-CQ-02 | MULTIPLE_CHOICE calls CompareMultipleChoice | questionType=MULTIPLE_CHOICE | expected="A B", submitted="a b" | true | - | - | Pending |
| TAC-CQ-03 | ESSAY always returns true | questionType=ESSAY | expected="any", submitted="different" | true | - | - | Pending |
| TAC-CQ-04 | ESSAY with both null returns true | questionType=ESSAY | expected=null, submitted=null | true | - | - | Pending |

---

## 6. ACASSERVICE — JOBS

---

### 6.1. ExaminationJobScheduling

**File:** `Application/Jobs/ExaminationJobScheduling.cs`

#### `void MarkExamAsOpenAsync(string examId)` (private method - test via public interface)

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EJS-01 | Exam exists updates status to ONGOING | Examination tồn tại | examId="exam-1" | Exam.Status == ONGOING | - | LogInformation("Exam {Id} marked as open") | Pending |
| EJS-02 | Exam not found logs warning and returns | Examination không tồn tại | examId="nonexistent" | Không throw, logged warning | - | LogWarning("Exam not found") | Pending |

#### `void MarkExamAsCompletedAsync(string examId)` (private method)

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EJS-03 | Exam exists updates status to COMPLETED | Examination tồn tại | examId="exam-1" | Exam.Status == COMPLETED | - | LogInformation("Exam {Id} marked as completed") | Pending |
| EJS-04 | Exam not found logs warning | Examination không tồn tại | examId="nonexistent" | Không throw | - | LogWarning("Exam not found") | Pending |

---

## 7. ACASSERVICE — COMMANDS

---

### 7.1. ExaminationCommand

**File:** `Application/Commands/Examination/ExaminationCommand.cs`
**Dependencies:** IExaminationRepository, ExaminationMapper

#### `Task<ExaminationResponse?> CreateAsync(ExaminationRequestDTO exam)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EXM-C-01 | Valid request creates examination | DTO hợp lệ | ExaminationRequestDTO {ExamName:"Midterm",Mode:"PRACTICAL"} | Returns ExaminationResponse != null, ExamName="Midterm" | - | LogInformation("Created examination") | Pending |
| EXM-C-02 | Repository returns null returns null | Repo.CreateAsync returns null | Valid DTO | Returns null | - | LogError | Pending |
| EXM-C-03 | ExamName empty string throws | ExamName="" | ExaminationRequestDTO {ExamName:""} | - | ArgumentException (model validation) | - | Pending |
| EXM-C-04 | Invalid mode throws | mode không phải PRACTICAL/EXAMINATION | ExaminationRequestDTO {Mode:"INVALID"} | - | ArgumentException, "Invalid mode: INVALID. Must be PRACTICAL or EXAMINATION" | - | Pending |

#### `Task<ExaminationResponse?> UpdateAsync(string id, ExaminationRequestDTO exam)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EXM-U-01 | Exam exists updates successfully | Exam tồn tại | id="exam-1", valid DTO | Returns updated ExaminationResponse | - | LogInformation("Updated examination") | Pending |
| EXM-U-02 | Exam not found returns null | Exam không tồn tại | id="nonexistent" | Returns null | - | LogWarning | Pending |
| EXM-U-03 | Invalid mode throws | mode không hợp lệ | DTO {Mode:"BAD"} | - | ArgumentException, "Invalid mode" | - | Pending |
| EXM-U-04 | StartDatetime > EndDatetime throws | Start > End | DTO {StartDatetime:t+2h,EndDatetime:t+1h} | - | ArgumentException | - | Pending |

#### `Task DeleteAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EXM-D-01 | Exam exists deletes successfully | Exam tồn tại | id="exam-1" | Returns void, no exception | - | LogInformation("Deleted examination") | Pending |
| EXM-D-02 | Repository throws exception propagated | Repo throws | id="exam-1" | - | Exception propagated | LogError | Pending |

---

### 7.2. SubmissionCommand

**File:** `Application/Commands/Submission/SubmissionCommand.cs`
**Dependencies:** ISubmissionRepository, ISubmissionCache, IProblemRepository, ITestcaseEvaluator, IExaminationRepository, TestResultMapper, IBusinessNotificationService, IStudentExamSessionRepository

#### `Task<SubmissionResponse?> SubmitProblemAsync(SubmitProblemRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUB-01 | PRACTICAL mode creates submission successfully | Mode=PRACTICAL, no session check | request={ExamId:"e1",ProblemId:"p1",StudentId:"s1",Source:"code",LanguageId:"java"} | Returns SubmissionResponse != null, Version=1 | - | LogInformation | Pending |
| SUB-02 | EXAMINATION mode with active session creates submission | Mode=EXAMINATION, session.Phase=Active | request={ExamId:"e1",ProblemId:"p1",StudentId:"s1"} | Returns SubmissionResponse != null | - | LogInformation | Pending |
| SUB-03 | EXAMINATION mode with no session throws | Mode=EXAMINATION, session=null | request={ExamId:"e1",ProblemId:"p1",StudentId:"s1"} | - | InvalidOperationException, "Exam session is not active. Start the exam from the exam page before submitting." | - | Pending |
| SUB-04 | EXAMINATION mode with session.Phase!=Active throws | Mode=EXAMINATION, session.Phase=Completed | request={ExamId:"e1",ProblemId:"p1",StudentId:"s1"} | - | InvalidOperationException, "Exam session is not active" | - | Pending |
| SUB-05 | Second submission increments version | submission đã tồn tại trong cache | request={ExamId:"e1",ProblemId:"p1",StudentId:"s1"} | Returns SubmissionResponse với Version=2 | - | LogInformation | Pending |
| SUB-06 | Cache miss falls back to repository | Redis cache miss | request={ExamId:"e1",ProblemId:"p1",StudentId:"s1"} | Calls GetByStudentIdAsync fallback | - | - | Pending |
| SUB-07 | Repository returns null for CreateAsync returns null | Repo.CreateAsync returns null | request valid | Returns null | - | LogWarning | Pending |
| SUB-08 | New submission appended to cache | submission mới tạo | request valid | Cache chứa submission mới | - | LogInformation | Pending |

#### `Task<AutoGradeProblemResponse> AutoGradeAllSubmissionsOfProblemAysnc(BulkSubmissionGradingRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUB-09 | Problem not found returns empty response | Problem không tồn tại | request={ProblemId:"nonexistent"} | Returns AutoGradeProblemResponse với Results=empty | - | LogWarning | Pending |
| SUB-10 | No hidden testcases returns empty response | Problem.TestCases toàn public | request={ProblemId:"p1"} | Returns empty Results, TotalSubmissions=0 | - | LogInformation | Pending |
| SUB-11 | All submissions graded correctly | submissions với test cases | request={ProblemId:"p1",Submissions:[{Id:"s1",Source:"code"}]} | Results.Count>0, GradedCount incremented | - | LogInformation | Pending |
| SUB-12 | Execution error caught and added to results | TestcaseEvaluator throws | request valid | ErrorMessage populated in result | - | LogError | Pending |
| SUB-13 | Notification failure logged but not thrown | NotifyUsersAsync throws | request valid | Continues processing, doesn't fail test | - | LogWarning | Pending |
| SUB-14 | Score calculation: all SUCCESS → full mark | all test results SUCCESS | testResults=[SUCCESS,SUCCESS,SUCCESS], problemMark=10 | FinalScore=10 | - | - | Pending |
| SUB-15 | Score calculation: 2/3 SUCCESS → 6.67 | 2 SUCCESS, 1 FAIL | testResults=[SUCCESS,SUCCESS,FAIL], problemMark=10 | FinalScore≈6.67 | - | - | Pending |
| SUB-16 | Score calculation: 0 SUCCESS → 0 | all test results FAIL | testResults=[FAIL,FAIL,FAIL], problemMark=10 | FinalScore=0 | - | - | Pending |
| SUB-17 | Score calculation: empty test results → 0 | no test results | testResults=[] | FinalScore=0 | - | - | Pending |
| SUB-18 | Score calculation: problemMark=0 → 0 | mark=0 | problemMark=0 | FinalScore=0 | - | - | Pending |
| SUB-19 | Submission not found skips to next | submission null | request với submission Id không tồn tại | Continues to next submission | - | LogWarning | Pending |
| SUB-20 | Existing submissions not modified after grading | previous submissions | submissions exist | Status updated to GRADED, GradedDate set | - | LogInformation | Pending |

#### `Task<AutoGradeSubmissionResult> RegradeSingleSubmissionAsync(string submissionId, SingleSubmissionRegradeRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUB-21 | Submission not found returns error result | submission=null | submissionId="nonexistent" | ErrorMessage="Submission not found" | - | LogWarning | Pending |
| SUB-22 | Problem not found returns error result | problem=null | submissionId="s1", problem deleted | ErrorMessage="Problem not found" | - | LogWarning | Pending |
| SUB-23 | No hidden testcases returns error result | hiddenCount=0 | request valid | ErrorMessage="No hidden test cases", TotalTestCases=0 | - | LogInformation | Pending |
| SUB-24 | Successful regrade updates submission and returns result | all valid | submissionId="s1", request valid | Returns AutoGradeSubmissionResult với Status="GRADED" | - | LogInformation | Pending |
| SUB-25 | Execution exception returns error result | TestcaseEvaluator throws | request valid | ErrorMessage=ex.Message | - | LogError | Pending |
| SUB-26 | Notification failure logged but not thrown | NotifyUsersAsync throws | request valid | Continues, returns result | - | LogWarning | Pending |

#### `Task<bool> OverrideSubmissionScoreAsync(string submissionId, float newScore, float maxMark)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUB-27 | Submission not found returns false | submission=null | submissionId="nonexistent", newScore=8, maxMark=10 | Returns false | - | LogWarning | Pending |
| SUB-28 | newScore equals maxMark succeeds | submission tồn tại | newScore=10, maxMark=10 | Returns true, FinalScore=10 | - | LogInformation | Pending |
| SUB-29 | newScore < maxMark succeeds | submission tồn tại | newScore=5, maxMark=10 | Returns true, FinalScore=5 | - | LogInformation | Pending |
| SUB-30 | newScore > maxMark throws | | newScore=11, maxMark=10 | - | InvalidOperationException, "Score (11) cannot exceed max mark (10)." | - | Pending |
| SUB-31 | newScore = 0 succeeds | | newScore=0, maxMark=10 | Returns true, FinalScore=0 | - | LogInformation | Pending |
| SUB-32 | newScore = -1 throws | | newScore=-1, maxMark=10 | - | InvalidOperationException | - | Pending |
| SUB-33 | Update returns null returns false | Repo.UpdateAsync returns null | submissionId valid | Returns false | - | LogError | Pending |

---

### 7.3. ProblemCommand

**File:** `Application/Commands/Problem/ProblemCommand.cs`
**Dependencies:** IProblemRepository, ProblemMapper

#### `Task<ProblemResponse> CreateProblemAsync(CreateProblemRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-01 | MANUAL mode with valid Content creates problem | Mode=MANUAL, Content length 10-50000 | request={Mode:"MANUAL",Content:"valid content here"} | Returns ProblemResponse != null | - | LogInformation("Creating problem in MANUAL mode") | Pending |
| PRO-02 | MANUAL mode with Content < 10 chars throws | Mode=MANUAL, Content="short" | request={Mode:"MANUAL",Content:"short"} | - | ValidationException, "Content must be between 10 and 50000 characters" | - | Pending |
| PRO-03 | MANUAL mode with Content > 50000 chars throws | Mode=MANUAL, Content too long | request={Mode:"MANUAL",Content:50001-char string} | - | ValidationException | - | Pending |
| PRO-04 | FROM_FILE mode with WantsToEdit=true validates Content | Mode=FROM_FILE, WantsToEdit=true | request={Mode:"FROM_FILE",WantsToEdit:true,Content:"short"} | - | ValidationException | - | Pending |
| PRO-05 | FROM_FILE mode without edit validates FileName | Mode=FROM_FILE, WantsToEdit=false | request={Mode:"FROM_FILE",WantsToEdit:false,FileName:"valid_name.c"} | Returns ProblemResponse != null | - | LogInformation | Pending |
| PRO-06 | FROM_FILE mode with FileName > 255 chars throws | FileName too long | request={FileName:256-char string} | - | ValidationException, "FileName must be between 1 and 255 characters" | - | Pending |
| PRO-07 | FROM_FILE mode with invalid FileName regex throws | FileName có ký tự đặc biệt | request={FileName:"file with spaces.c"} | - | ValidationException, "FileName can only contain letters, numbers, underscores, hyphens, and dots" | - | Pending |
| PRO-08 | FROM_FILE mode with FileName containing spaces throws | FileName="bad file.c" | request={FileName:"bad file.c"} | - | ValidationException | - | Pending |
| PRO-09 | Invalid mode throws ArgumentException | mode không hợp lệ | request={Mode:"INVALID"} | - | ArgumentException, "Invalid mode: INVALID. Must be MANUAL or FROM_FILE" | - | Pending |
| PRO-10 | Valid mode with TestCases creates problem with test cases | TestCases provided | request={TestCases:[{InputData:"1",ExpectedOutput:"2"}]} | ProblemResponse.TestCases.Count=1 | - | LogInformation | Pending |
| PRO-11 | Repository throws exception propagated | Repo throws | valid request | - | Exception propagated | LogError | Pending |

#### `Task UpdateProblemAsync(string problemId, UpdateProblemRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-12 | Problem not found throws KeyNotFoundException | problem=null | problemId="nonexistent" | - | KeyNotFoundException, "Problem nonexistent not found" | - | Pending |
| PRO-13 | With FileName validates regex | FileName provided | request={FileName:"valid.c"} | No exception | - | LogInformation | Pending |
| PRO-14 | With FileName invalid regex throws | FileName="bad file.c" | request={FileName:"bad file.c"} | - | ValidationException | - | Pending |
| PRO-15 | Without FileName validates Content length | Content provided, FileName=null | request={Content:"short"} | - | ValidationException, "Content must be between 10 and 50000 characters" | - | Pending |

#### `Task DeleteProblemAsync(string problemId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-16 | Problem exists deletes successfully | problem tồn tại | problemId="p1" | Returns void | - | LogInformation | Pending |
| PRO-17 | Repository throws exception propagated | Repo throws | problemId="p1" | - | Exception | LogError | Pending |

#### `Task AddTestCaseAsync(string problemId, CreateTestCaseRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-18 | Problem exists adds test case | problemExists=true | problemId="p1", request valid | Returns void | - | LogInformation | Pending |
| PRO-19 | Problem not found throws KeyNotFoundException | problemExists=false | problemId="nonexistent" | - | KeyNotFoundException, "Problem nonexistent not found" | - | Pending |

#### `Task AddBulkTestCasesAsync(string problemId, List<CreateTestCaseRequest> requests)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-20 | Problem exists adds all test cases | problemExists=true, count=3 | problemId="p1", requests=[3 items] | Returns void, AddTestCaseAsync called 3 times | - | LogInformation | Pending |
| PRO-21 | Problem not found throws on first call | problemExists=false | problemId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task UpdateTestCaseAsync(string problemId, string testCaseId, UpdateTestCaseRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-22 | Test case exists updates successfully | testCase tồn tại | testCaseId="tc1", request valid | Returns void | - | LogInformation | Pending |
| PRO-23 | Test case not found throws KeyNotFoundException | testCase=null | testCaseId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task DeleteTestCaseAsync(string problemId, string testCaseId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PRO-24 | Deletes successfully | testCase tồn tại | testCaseId="tc1" | Returns void | - | LogInformation | Pending |
| PRO-25 | Repository throws exception propagated | Repo throws | testCaseId="tc1" | - | Exception | LogError | Pending |

---

### 7.4. ClassroomCommand

**File:** `Application/Commands/Classroom/ClassroomCommand.cs`

#### `Task<ClassroomResponse> CreateClassroomAsync(CreateClassroomRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CLA-C-01 | Valid request creates classroom | DTO hợp lệ | request={ClassCode:"SE1701",ClassName:"SE17.01",LecturerId:"l1"} | Returns ClassroomResponse != null, ClassCode="SE1701" | - | LogInformation | Pending |
| CLA-C-02 | ClassCode empty throws | ClassCode="" | request={ClassCode:""} | - | ValidationException, "ClassCode is required" | - | Pending |
| CLA-C-03 | ClassCode too long throws | ClassCode.Length > 50 | request={ClassCode:51-char string} | - | ValidationException, "ClassCode must be between 1 and 50" | - | Pending |
| CLA-C-04 | ClassName empty throws | ClassName="" | request={ClassName:""} | - | ValidationException, "ClassName is required" | - | Pending |
| CLA-C-05 | ClassName too long throws | ClassName.Length > 200 | request={ClassName:201-char string} | - | ValidationException | - | Pending |
| CLA-C-06 | EnrolKey empty generates random key | EnrolKey not provided | request={} | Returns response với EnrolKey != null, length=8 | - | LogInformation | Pending |
| CLA-C-07 | EnrolKey provided uses provided key | EnrolKey provided | request={EnrolKey:"MYKEY123"} | Returns response.EnrolKey="MYKEY123" | - | LogInformation | Pending |
| CLA-C-08 | MaxSlot = 0 defaults to 40 | MaxSlot not provided | request={} | response.MaxSlot=40 | - | - | Pending |
| CLA-C-09 | MaxSlot > 40 throws | MaxSlot=50 | request={MaxSlot:50} | - | ValidationException, "MaxSlot cannot exceed 40" | - | Pending |
| CLA-C-10 | MaxSlot < 1 throws | MaxSlot=0 | request={MaxSlot:0} | - | ValidationException, "MaxSlot must be at least 1" | - | Pending |

#### `Task<ClassroomResponse> UpdateClassroomAsync(string classroomId, UpdateClassroomRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CLA-U-01 | Classroom exists updates successfully | classroom tồn tại | classroomId="c1", request valid | Returns updated ClassroomResponse | - | LogInformation | Pending |
| CLA-U-02 | Classroom not found throws | classroom=null | classroomId="nonexistent" | - | KeyNotFoundException | - | Pending |
| CLA-U-03 | Invalid ClassCode format throws | ClassCode="bad code!" | request={ClassCode:"bad code!"} | - | ValidationException | - | Pending |
| CLA-U-04 | EnrolKey regeneration succeeds | EnrolKey regeneration requested | request={RegenerateEnrolKey:true} | Returns new EnrolKey != old key | - | LogInformation | Pending |
| CLA-U-05 | Update fails throws | Repo returns null | classroomId="c1" | - | Exception, "Failed to update classroom" | LogError | Pending |

#### `Task<ClassroomResponse> DeleteClassroomAsync(string classroomId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CLA-D-01 | Classroom with no enrolled students deletes | enrolledCount=0 | classroomId="c1" | Returns ClassroomResponse | - | LogInformation | Pending |
| CLA-D-02 | Classroom with enrolled students throws | enrolledCount>0 | classroomId="c1" | - | InvalidOperationException, "Cannot delete classroom with enrolled students" | - | Pending |
| CLA-D-03 | Classroom not found throws | classroom=null | classroomId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<ClassroomResponse> SoftDeleteClassroomAsync(string classroomId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CLA-SD-01 | Soft deletes successfully | classroom tồn tại | classroomId="c1" | Returns ClassroomResponse.IsDeleted=true | - | LogInformation | Pending |
| CLA-SD-02 | Classroom not found throws | classroom=null | classroomId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<ClassroomResponse> RegenerateEnrolKeyAsync(string classroomId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CLA-RK-01 | Generates new 8-char alphanumeric key | classroom tồn tại | classroomId="c1" | Returns ClassroomResponse với EnrolKey length=8, alphanumeric | - | LogInformation | Pending |
| CLA-RK-02 | New key different from old key | | classroomId="c1" | newKey != oldKey | - | - | Pending |
| CLA-RK-03 | Classroom not found throws | classroom=null | classroomId="nonexistent" | - | KeyNotFoundException | - | Pending |

---

### 7.5. SlotCommand

**File:** `Application/Commands/Slot/SlotCommand.cs`

#### `Task<SlotResponse?> CreateAnsync(SlotRequest slotRequest)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SL-C-01 | Valid request creates slot | Classroom tồn tại, slot count < 8 | slotRequest={ClassroomId:"c1",SlotNumber:1} | Returns SlotResponse != null | - | LogInformation | Pending |
| SL-C-02 | Classroom not found returns null | classroom=null | slotRequest={ClassroomId:"nonexistent"} | Returns null | - | LogWarning | Pending |
| SL-C-03 | Slot number > 8 returns null | slotNumber=9 | slotRequest={SlotNumber:9} | Returns null | - | LogWarning | Pending |
| SL-C-04 | Slot number < 1 returns null | slotNumber=0 | slotRequest={SlotNumber:0} | Returns null | - | LogWarning | Pending |
| SL-C-05 | Duplicate slot number returns null | slot đã tồn tại | slotRequest={SlotNumber:1} | Returns null | - | LogWarning | Pending |
| SL-C-06 | Slot with same day/slot combination returns null | combination tồn tại | slotRequest={DayOfWeek:1,SlotNumber:1} | Returns null | - | LogWarning | Pending |

#### `Task<SlotResponse?> UpdateAnsync(SlotRequest slotRequest, string slotId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SL-U-01 | Slot exists updates successfully | slot tồn tại | slotId="sl1", valid request | Returns updated SlotResponse | - | LogInformation | Pending |
| SL-U-02 | Slot not found returns null | slot=null | slotId="nonexistent" | Returns null | - | LogWarning | Pending |
| SL-U-03 | Duplicate on update returns null | slot combination conflict | slotId="sl1", slotRequest valid | Returns null | - | LogWarning | Pending |

#### `Task<List<SlotResponse>?> CreateMultiAnsync(string classroomId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SL-CM-01 | Creates 8 slots (1-8) for classroom | classroom tồn tại, no existing slots | classroomId="c1" | Returns list of 8 SlotResponse | - | LogInformation | Pending |
| SL-CM-02 | Classroom not found returns null | classroom=null | classroomId="nonexistent" | Returns null | - | LogWarning | Pending |

#### `Task DeleteAsync(string slotId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SL-D-01 | Deletes successfully | slot tồn tại | slotId="sl1" | Returns void | - | LogInformation | Pending |
| SL-D-02 | Repository throws exception propagated | Repo throws | slotId="sl1" | - | Exception | LogError | Pending |

---

### 7.6. StudentExamSessionCommand

**File:** `Application/Commands/StudentExamSession/StudentExamSessionCommand.cs`

#### `Task<StudentExamSessionResponse?> StartAsync(string studentId, string examId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SES-ST-01 | Exam not found returns null | exam=null | studentId="s1", examId="nonexistent" | Returns null | - | LogWarning | Pending |
| SES-ST-02 | Exam not started (Pending) returns null | exam.Status=PENDING | studentId="s1", examId="e1" | Returns null | - | LogWarning | Pending |
| SES-ST-03 | Exam completed returns null | exam.Status=COMPLETED | studentId="s1", examId="e1" | Returns null | - | LogWarning | Pending |
| SES-ST-04 | Valid start creates session with Phase=Active | exam.Status=ONGOING | studentId="s1", examId="e1" | Returns StudentExamSessionResponse với Phase=Active | - | LogInformation | Pending |
| SES-ST-05 | Session already exists returns null | session đã tồn tại | studentId="s1", examId="e1" | Returns null | - | LogWarning | Pending |

#### `Task<StudentExamSessionResponse?> CompleteAsync(string studentId, string examId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SES-CO-01 | Session exists completes successfully | session tồn tại, Phase=Active | studentId="s1", examId="e1" | Returns response với Phase=Completed | - | LogInformation | Pending |
| SES-CO-02 | Session not found returns null | session=null | studentId="s1", examId="nonexistent" | Returns null | - | LogWarning | Pending |

#### `Task<StudentExamSessionResponse?> LockAsync(string studentId, string examId, string? lockReason)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SES-LK-01 | Session exists locks with reason | session tồn tại | studentId="s1", examId="e1", lockReason="cheating" | Returns response với Phase=Locked, LockReason="cheating" | - | LogInformation | Pending |
| SES-LK-02 | Session exists locks without reason | session tồn tại | studentId="s1", examId="e1", lockReason=null | Returns response với Phase=Locked | - | LogInformation | Pending |
| SES-LK-03 | Session not found returns null | session=null | studentId="s1", examId="nonexistent" | Returns null | - | LogWarning | Pending |

---

### 7.7. QuizAttemptCommand

**File:** `Application/Commands/QuizAttempt/QuizAttemptCommand.cs`

#### `Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| QA-ST-01 | Within attempt limit creates attempt | attemptCount < MaxOfAttempts | request={ClassroomQuizId:"cq1",StudentId:"s1"} | Returns QuizAttemptResponse với AttemptNumber=1 | - | LogInformation | Pending |
| QA-ST-02 | At attempt limit returns null | attemptCount == MaxOfAttempts | request={ClassroomQuizId:"cq1",StudentId:"s1"} | Returns null | - | LogWarning | Pending |
| QA-ST-03 | ClassroomQuiz not found returns null | cq=null | request={ClassroomQuizId:"nonexistent"} | Returns null | - | LogWarning | Pending |
| QA-ST-04 | Student not enrolled returns null | enrollment=null | request={ClassroomQuizId:"cq1",StudentId:"notenrolled"} | Returns null | - | LogWarning | Pending |
| QA-ST-05 | Quiz not published returns null | cq.Status=DRAFT | request={ClassroomQuizId:"cq1"} | Returns null | - | LogWarning | Pending |
| QA-ST-06 | Quiz expired returns null | now > EndTime | request={ClassroomQuizId:"cq1"} | Returns null | - | LogWarning | Pending |
| QA-ST-07 | Correct attempt number increments | 1 attempt exists | request={ClassroomQuizId:"cq1"} | Returns AttemptNumber=2 | - | LogInformation | Pending |

#### `Task UpdateAnswerAsync(string attemptId, UpdateQuizAnswerRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| QA-UA-01 | Attempt exists updates answers | attempt tồn tại | attemptId="at1", request valid | Returns void | - | LogInformation | Pending |
| QA-UA-02 | Attempt not found throws | attempt=null | attemptId="nonexistent" | - | KeyNotFoundException | - | Pending |
| QA-UA-03 | Attempt already submitted throws | attempt.Status=SUBMITTED | attemptId="at1" | - | InvalidOperationException, "Cannot update answers for submitted attempt" | - | Pending |

#### `Task<QuizAttemptResponse> SubmitAttemptAsync(string attemptId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| QA-SU-01 | Attempt exists submits and calculates score | attempt tồn tại, Status=IN_PROGRESS | attemptId="at1" | Returns response với Status=SUBMITTED, Score calculated | - | LogInformation | Pending |
| QA-SU-02 | Attempt not found throws | attempt=null | attemptId="nonexistent" | - | KeyNotFoundException | - | Pending |
| QA-SU-03 | Already submitted throws | attempt.Status=SUBMITTED | attemptId="at1" | - | InvalidOperationException, "Attempt already submitted" | - | Pending |

---

### 7.8. DiscussionIssueCommand

**File:** `Application/Commands/DiscussionIssue/DiscussionIssueCommand.cs`

#### `Task<DiscussionIssueDetailResponse?> CreateIssueAsync(CreateDiscussionIssueRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| DI-CI-01 | Valid request creates issue | DTO hợp lệ | request={Content:"How to solve this?",ClassroomId:"c1"} | Returns DiscussionIssueDetailResponse != null | - | LogInformation | Pending |
| DI-CI-02 | Classroom not found returns null | classroom=null | request={ClassroomId:"nonexistent"} | Returns null | - | LogWarning | Pending |
| DI-CI-03 | Content empty throws | Content="" | request={Content:""} | - | ValidationException, "Content is required" | - | Pending |

#### `Task<DiscussionIssueDetailResponse?> WriteCommentAsync(WriteCommentRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| DI-WC-01 | Valid request writes comment | DTO hợp lệ | request={DiscussionId:"d1",Content:"Great question!"} | Returns response với comment mới | - | LogInformation | Pending |
| DI-WC-02 | Discussion not found returns null | discussion=null | request={DiscussionId:"nonexistent"} | Returns null | - | LogWarning | Pending |
| DI-WC-03 | Content empty throws | Content="" | request={Content:""} | - | ValidationException | - | Pending |

#### `Task<DiscussionIssueDetailResponse?> ChangeStatusAsync(ChangeDiscussionStatusRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| DI-CS-01 | Issue exists changes status | issue tồn tại | request={DiscussionId:"d1",Status:RESOLVED} | Returns response với Status=RESOLVED | - | LogInformation | Pending |
| DI-CS-02 | Issue not found returns null | issue=null | request={DiscussionId:"nonexistent"} | Returns null | - | LogWarning | Pending |

#### `Task<bool> SoftDeleteAsync(string issueId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| DI-SD-01 | Issue exists soft deletes | issue tồn tại | issueId="d1" | Returns true | - | LogInformation | Pending |
| DI-SD-02 | Issue not found returns false | issue=null | issueId="nonexistent" | Returns false | - | LogWarning | Pending |

---

### 7.9. NotificationCommand

**File:** `Application/Commands/Notification/NotificationCommand.cs`

#### `Task<bool> MarkAsReadAsync(string notificationId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| NTF-MR-01 | Notification exists marks as read | notification tồn tại | notificationId="n1" | Returns true | - | LogInformation | Pending |
| NTF-MR-02 | Notification not found returns false | notification=null | notificationId="nonexistent" | Returns false | - | LogWarning | Pending |
| NTF-MR-03 | Empty notificationId throws ArgumentException | notificationId="" | notificationId="" | - | ArgumentException, "notificationId is required" | - | Pending |

#### `Task<bool> SoftDeleteAsync(string notificationId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| NTF-SD-01 | Notification exists soft deletes | notification tồn tại | notificationId="n1" | Returns true | - | LogInformation | Pending |
| NTF-SD-02 | Notification not found returns false | notification=null | notificationId="nonexistent" | Returns false | - | LogWarning | Pending |

#### `Task<NotificationDispatchResponse> CreateAndSendAsync(CreateNotificationRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| NTF-CS-01 | Valid request creates and sends | request hợp lệ | request={Title:"Test",Body:"Msg",TargetUserIds:["u1"]} | Returns NotificationDispatchResponse != null | - | LogInformation | Pending |
| NTF-CS-02 | Invalid notification type throws | type không hợp lệ | request={Type:"INVALID"} | - | ArgumentException, "Invalid notification type" | - | Pending |
| NTF-CS-03 | Create fails returns null | Repo returns null | request valid | Returns null | - | LogError | Pending |

---

### 7.10. ExamLogCommand

**File:** `Application/Commands/ExamLog/ExamLogCommand.cs`

#### `Task<ExamLogResponse?> CreateAsync(CreateExamLogRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EL-C-01 | Valid request without suspicious flag creates log | suspicious=false | request={StudentId:"s1",ExamId:"e1"} | Returns ExamLogResponse với Suspicious=false | - | LogInformation | Pending |
| EL-C-02 | Valid request with suspicious flag creates log | suspicious=true | request={StudentId:"s1",ExamId:"e1",Suspicious:true} | Returns ExamLogResponse với Suspicious=true | - | LogWarning("Suspicious exam activity") | Pending |
| EL-C-03 | Repository returns null returns null | Repo returns null | request valid | Returns null | - | LogError | Pending |

#### `Task<int> CacheAsync(CacheExamLogsRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EL-CH-01 | Valid request caches logs | request hợp lệ | request={ExamId:"e1",StudentId:"s1",Logs:[{...}]} | Returns count of cached logs | - | LogInformation | Pending |
| EL-CH-02 | Empty logs list caches 0 | logs=empty | request={Logs:[]} | Returns 0 | - | LogInformation | Pending |

#### `Task<int> FlushCachedAsync(FlushCachedExamLogsRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EL-FL-01 | Valid request flushes to repository | request hợp lệ | request={ExamId:"e1",StudentId:"s1"} | Returns count of flushed logs | - | LogInformation | Pending |
| EL-FL-02 | No cached logs flushes 0 | cache empty | request={ExamId:"e1",StudentId:"s1"} | Returns 0 | - | LogInformation | Pending |

---

### 7.11. MaterialCommand

**File:** `Application/Commands/Material/MaterialCommand.cs`

#### `Task<MaterialResponse> CreateMaterialAsync(CreateMaterialRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| MAT-C-01 | Valid request creates material | DTO hợp lệ | request={Title:"Lecture 1",ClassroomId:"c1",FileUrl:"https://..."} | Returns MaterialResponse != null | - | LogInformation | Pending |
| MAT-C-02 | Classroom not found throws | classroom=null | request={ClassroomId:"nonexistent"} | - | KeyNotFoundException, "Classroom not found" | - | Pending |
| MAT-C-03 | Title empty throws | Title="" | request={Title:""} | - | ValidationException, "Title is required" | - | Pending |
| MAT-C-04 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to create material" | LogError | Pending |

#### `Task<MaterialResponse> DeleteMaterialAsync(string materialId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| MAT-D-01 | Material exists deletes | material tồn tại | materialId="m1" | Returns MaterialResponse | - | LogInformation | Pending |
| MAT-D-02 | Material not found throws | material=null | materialId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<MaterialResponse> SoftDeleteMaterialAsync(string materialId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| MAT-SD-01 | Soft deletes successfully | material tồn tại | materialId="m1" | Returns MaterialResponse với IsDeleted=true | - | LogInformation | Pending |
| MAT-SD-02 | Material not found throws | material=null | materialId="nonexistent" | - | KeyNotFoundException | - | Pending |

---

### 7.12. KeystrokeLogsCommand

**File:** `Application/Commands/KeystrokeLogs/KeystrokeLogsCommand.cs`

#### `Task<CacheKeystrokeLogsResponse> CacheKeystrokeLogsAsync(CacheKeystrokeLogsRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| KSL-C-01 | Valid request caches keystrokes | request hợp lệ | request={SubmissionId:"s1",KeystrokeData:[...]}| Returns CacheKeystrokeLogsResponse với KeystrokeData.Count>0 | - | LogInformation | Pending |
| KSL-C-02 | Null keystroke data caches empty | keystrokeData=null | request={KeystrokeData:null} | Returns response với KeystrokeData empty | - | LogInformation | Pending |
| KSL-C-03 | Null metadata handled gracefully | metadata=null | request={Metadata:null} | Returns response không throw | - | LogInformation | Pending |

#### `Task<FlushKeystrokeLogsResponse> FlushKeystrokeLogsAsync(FlushKeystrokeLogsRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| KSL-F-01 | Submission not found throws | submission=null | request={SubmissionId:"nonexistent"} | - | ArgumentException, "Submission does not exist" | - | Pending |
| KSL-F-02 | Submission ID mismatch throws | submissionId != request.SubmissionId | request={SubmissionId:"s1",SubmissionId:"different"} | - | ArgumentException, "Submission ID mismatch" | - | Pending |
| KSL-F-03 | Valid request flushes keystrokes | submission tồn tại | request={SubmissionId:"s1"} | Returns FlushKeystrokeLogsResponse != null | - | LogInformation | Pending |
| KSL-F-04 | Flush fails throws | Repo throws | request={SubmissionId:"s1"} | - | InvalidOperationException, "Failed to persist keystroke log" | LogError | Pending |

---

### 7.13. ProgrammingLanguageCommand

**File:** `Application/Commands/ProgrammingLanguage/ProgrammingLanguageCommand.cs`

#### `Task<List<ProgrammingLanguageResponse>> SyncProgrammingLanguagesAsync()`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PL-SYNC-01 | Syncs all languages successfully | languages exist | (no params) | Returns list of ProgrammingLanguageResponse | - | LogInformation | Pending |
| PL-SYNC-02 | CodeRunnerService returns empty returns empty list | CodeRunnerService empty | (no params) | Returns empty list | - | LogWarning | Pending |
| PL-SYNC-03 | Creates new language in DB | language chưa tồn tại | (no params) | Calls CreateAsync | - | LogInformation | Pending |
| PL-SYNC-04 | Updates existing language in DB | language đã tồn tại | (no params) | Calls UpdateAsync | - | LogInformation | Pending |

#### `Task<ProgrammingLanguageResponse> UpdateStatusAsync(string id, string status)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PL-US-01 | Language exists updates status | language tồn tại | id="lang-java", status="DISABLED" | Returns response với Status="DISABLED" | - | LogInformation | Pending |
| PL-US-02 | Language not found returns null | language=null | id="nonexistent" | Returns null | - | LogWarning | Pending |

#### `Task<ProgrammingLanguageResponse> UpdateLogoUrlAsync(string id, string logoFileUrl)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PL-UL-01 | Language exists updates logo | language tồn tại | id="lang-java", logoFileUrl="https://..." | Returns response với LogoUrl updated | - | LogInformation | Pending |
| PL-UL-02 | Language not found returns null | language=null | id="nonexistent" | Returns null | - | LogWarning | Pending |

#### `Task<ProgrammingLanguageResponse> UpdateCompilerNameAsync(string languageId, string compilerId, string name)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PL-UC-01 | Compiler found updates name | compiler tồn tại | languageId="lang-java", compilerId="javac", name="Java Compiler" | Returns response với Compiler.Name updated | - | LogInformation | Pending |
| PL-UC-02 | Language not found returns null | language=null | languageId="nonexistent" | Returns null | - | LogWarning | Pending |
| PL-UC-03 | Compiler not found returns null | compiler không tồn tại | compilerId="nonexistent" | Returns null | - | LogWarning | Pending |

---

### 7.14. UserDeviceCommand

**File:** `Application/Commands/UserDevice/UserDeviceCommand.cs`

#### `Task<UserDeviceTokenResponse> RegisterAsync(string userId, RegisterUserDeviceRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| UD-R-01 | Valid request registers device | DTO hợp lệ | userId="u1", request={DeviceToken:"token123"} | Returns UserDeviceTokenResponse != null | - | LogInformation | Pending |
| UD-R-02 | Existing device updates token | device đã tồn tại | userId="u1", request={DeviceToken:"new-token"} | Updates existing, returns response | - | LogInformation | Pending |
| UD-R-03 | Repository returns null throws | Repo returns null | userId="u1", request valid | - | Exception, "Failed to register device" | LogError | Pending |

---

### 7.15. ErrorGroupCommand

**File:** `Application/Commands/ErrorGroup/ErrorGroupCommand.cs`

#### `Task<int> GroupSubmissionsByErrorsAsync(string examId, string problemId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EG-GS-01 | Groups submissions successfully | submissions tồn tại | examId="e1", problemId="p1" | Returns count > 0 | - | LogInformation | Pending |
| EG-GS-02 | No submissions returns 0 | no submissions | examId="e1", problemId="p1" | Returns 0 | - | LogInformation | Pending |
| EG-GS-03 | Repository throws exception propagated | Repo throws | examId="e1", problemId="p1" | - | Exception | LogError | Pending |

#### `Task CheckSimilarityForProblemAsync(string examId, string problemId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EG-CS-01 | Exam not found returns | exam=null | examId="nonexistent", problemId="p1" | Returns void | - | LogWarning | Pending |
| EG-CS-02 | Groups exist runs JPlag check | groups tồn tại, count>=2 | examId="e1", problemId="p1" | Updates groups với JPlagStatus.RUNNING | - | LogInformation | Pending |
| EG-CS-03 | Groups count < 2 skips JPlag | groups count < 2 | examId="e1", problemId="p1" | Skips, no JPlag call | - | LogInformation | Pending |

#### `Task CheckSimilarityForGroupsAsync(List<string> groupIds)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| EG-CSG-01 | Groups with submissions calls JPlag | groups with submissions | groupIds=["g1","g2"] | Calls RunSimilarityCheckAsync | - | LogInformation | Pending |
| EG-CSG-02 | Updates first group to RUNNING then COMPLETED | groups valid | groupIds=["g1","g2"] | g1.JPlagStatus=RUNNING, g2.JPlagStatus=COMPLETED | - | LogInformation | Pending |
| EG-CSG-03 | No groups returns | groupIds empty | groupIds=[] | Returns void | - | LogInformation | Pending |
| EG-CSG-04 | Group not found skips | group=null | groupIds=["nonexistent"] | Continues to next group | - | LogWarning | Pending |

---

### 7.16. ExaminationTemplateCommand

**File:** `Application/Commands/ExaminationTemplate/ExaminationTemplateCommand.cs`

#### `Task<ExaminationTemplateResponse?> CreateAsync(ExaminationTemplateRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| ET-C-01 | Valid request creates template | DTO hợp lệ | request={TemplateName:"Template A"} | Returns ExaminationTemplateResponse != null | - | LogInformation | Pending |
| ET-C-02 | TemplateName empty throws | TemplateName="" | request={TemplateName:""} | - | ValidationException | - | Pending |
| ET-C-03 | Total mark != 10 throws | totalMark=15 | request={TotalMark:15} | - | ArgumentException, "Total mark must be 10" | - | Pending |
| ET-C-04 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to create examination template" | LogError | Pending |

#### `Task UpdateAsync(string id, UpdateExaminationTemplateRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| ET-U-01 | Template exists updates | template tồn tại | id="t1", request valid | Returns updated response | - | LogInformation | Pending |
| ET-U-02 | Template not found throws | template=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |
| ET-U-03 | Total mark != 10 throws | totalMark=8 | request={TotalMark:8} | - | ArgumentException | - | Pending |

#### `Task DeleteAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| ET-D-01 | Deletes successfully | template tồn tại | id="t1" | Returns void | - | LogInformation | Pending |
| ET-D-02 | Template not found throws | template=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<ExaminationTemplateResponse?> SoftDeleteAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| ET-SD-01 | Soft deletes | template tồn tại | id="t1" | Returns response với IsDeleted=true | - | LogInformation | Pending |
| ET-SD-02 | Not found throws | template=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<ExaminationTemplateResponse?> RestoreAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| ET-R-01 | Restores successfully | template tồn tại | id="t1" | Returns response với IsDeleted=false | - | LogInformation | Pending |
| ET-R-02 | Not found throws | template=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |

---

### 7.17. RegradingRequestCommand

**File:** `Application/Commands/RegradingRequests/RegradingRequestCommand.cs`

#### `Task<RegradingRequestResponse> CreateAsync(CreateRegradingRequest request, string studentId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RG-C-01 | Valid request creates regrading request | submission tồn tại | request={SubmissionId:"s1"}, studentId="s1" | Returns RegradingRequestResponse != null, Status=PENDING | - | LogInformation | Pending |
| RG-C-02 | Submission not found throws | submission=null | request={SubmissionId:"nonexistent"} | - | KeyNotFoundException, "Submission with ID nonexistent not found" | - | Pending |
| RG-C-03 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to create regrading request" | LogError | Pending |
| RG-C-04 | Submission update fails is logged but continues | UpdateAsync throws | request valid | Still returns response (non-critical) | - | LogWarning | Pending |
| RG-C-05 | Notification fails is logged but doesn't throw | NotifyUsersAsync throws | request valid | Still returns response (non-critical) | - | LogWarning | Pending |

#### `Task<RegradingRequestResponse> ApproveAsync(string id, string lecturerNote)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RG-A-01 | Request exists approves | request tồn tại | id="r1", lecturerNote="Approved" | Returns response với Status=APPROVED | - | LogInformation | Pending |
| RG-A-02 | Request not found throws | request=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |
| RG-A-03 | Notification fails is logged but doesn't throw | NotifyUsersAsync throws | id="r1" | Still returns response | - | LogWarning | Pending |

#### `Task<RegradingRequestResponse> RejectAsync(string id, string lecturerNote)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RG-RJ-01 | Request exists rejects | request tồn tại | id="r1", lecturerNote="Rejected" | Returns response với Status=REJECTED | - | LogInformation | Pending |
| RG-RJ-02 | Request not found throws | request=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |
| RG-RJ-03 | Notification fails is logged but doesn't throw | NotifyUsersAsync throws | id="r1" | Still returns response | - | LogWarning | Pending |

#### `Task<RegradingRequestResponse> CancelAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| RG-CA-01 | Request exists cancels | request tồn tại | id="r1" | Returns response với Status=CANCELLED | - | LogInformation | Pending |
| RG-CA-02 | Request not found throws | request=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |

---

### 7.18. SubjectCommand

**File:** `Application/Commands/Subject/SubjectCommand.cs`

#### `Task<SubjectResponse> CreateSubjectAsync(CreateSubjectRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-C-01 | Valid request creates subject | SubjectCode unique | request={SubjectCode:"SE1701",SubjectName:"Software Engineering"} | Returns SubjectResponse != null | - | LogInformation | Pending |
| SUBJ-C-02 | Duplicate SubjectCode throws | SubjectCode đã tồn tại | request={SubjectCode:"SE1701"} | - | InvalidOperationException, "Subject with code 'SE1701' already exists" | - | Pending |
| SUBJ-C-03 | SubjectCode empty throws | SubjectCode="" | request={SubjectCode:""} | - | ValidationException | - | Pending |
| SUBJ-C-04 | SubjectCode > 20 chars throws | SubjectCode=21 chars | request={SubjectCode:21-char string} | - | ValidationException, "Subject code must be between 1 and 20" | - | Pending |
| SUBJ-C-05 | SubjectName empty throws | SubjectName="" | request={SubjectName:""} | - | ValidationException | - | Pending |
| SUBJ-C-06 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to create subject" | LogError | Pending |

#### `Task<SubjectResponse> UpdateSubjectAsync(string subjectId, UpdateSubjectRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-U-01 | Subject exists updates | subject tồn tại | subjectId="s1", request valid | Returns updated SubjectResponse | - | LogInformation | Pending |
| SUBJ-U-02 | Subject not found throws | subject=null | subjectId="nonexistent" | - | KeyNotFoundException, "Subject with id nonexistent not found" | - | Pending |
| SUBJ-U-03 | Duplicate SubjectCode throws | code tồn tại ở subject khác | subjectId="s1", request={SubjectCode:"SE1702"} | - | InvalidOperationException, "Subject with code 'SE1702' already exists" | - | Pending |

#### `Task<SubjectResponse> DeleteSubjectAsync(string subjectId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-D-01 | Deletes successfully | subject tồn tại | subjectId="s1" | Returns SubjectResponse | - | LogInformation | Pending |
| SUBJ-D-02 | Not found throws | subject=null | subjectId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<SubjectResponse> SoftDeleteSubjectAsync(string subjectId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-SD-01 | Soft deletes | subject tồn tại | subjectId="s1" | Returns SubjectResponse với IsDeleted=true | - | LogInformation | Pending |
| SUBJ-SD-02 | Not found throws | subject=null | subjectId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<SubjectResponse> RestoreSubjectAsync(string subjectId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-R-01 | Restores successfully | subject tồn tại, IsDeleted=true | subjectId="s1" | Returns SubjectResponse với IsDeleted=false | - | LogInformation | Pending |
| SUBJ-R-02 | Not found throws | subject=null | subjectId="nonexistent" | - | KeyNotFoundException | - | Pending |
| SUBJ-R-03 | Not deleted (IsDeleted=false) returns same | subject.IsDeleted=false | subjectId="s1" | Returns SubjectResponse, IsDeleted=false | - | LogInformation | Pending |

#### `Task<BulkOperationResult> BulkSoftDeleteAsync(List<string> subjectIds)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-BSD-01 | All subjects deleted | all tồn tại, count=5 | subjectIds=["s1","s2","s3","s4","s5"] | Result.TotalRequested=5, SuccessCount=5, FailedCount=0 | - | LogInformation | Pending |
| SUBJ-BSD-02 | Some fail | 3 tồn tại, 2 không | subjectIds=["s1","s2","s3","nonexistent1","nonexistent2"] | Result.SuccessCount=3, FailedCount=2 | - | LogInformation | Pending |

#### `Task<BulkOperationResult> BulkRestoreAsync(List<string> subjectIds)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SUBJ-BR-01 | All subjects restored | all tồn tại, count=3 | subjectIds=["s1","s2","s3"] | Result.TotalRequested=3, SuccessCount=3 | - | LogInformation | Pending |
| SUBJ-BR-02 | Some fail | 2 tồn tại, 1 không | subjectIds=["s1","s2","nonexistent"] | Result.SuccessCount=2, FailedCount=1 | - | LogInformation | Pending |

---

### 7.19. ClassEnrollmentsCommand

**File:** `Application/Commands/ClassEnrollments/ClassEnrollmentsCommand.cs`

#### `Task<ClassEnrollmentsResponse> EnrollClass(ClassEnrollmentsRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CE-E-01 | Valid enrollment creates enrollment | classroom tồn tại, key đúng, chưa enroll | request={ClassId:"c1",StudentId:"s1",EnrolKey:"ABC123"} | Returns ClassEnrollmentsResponse != null, IsJoining=true | - | LogInformation | Pending |
| CE-E-02 | Classroom not found throws | classroom=null | request={ClassId:"nonexistent"} | - | InvalidOperationException, "Class not found" | - | Pending |
| CE-E-03 | Wrong enrollment key throws | enrolKey sai | request={EnrolKey:"WRONG"} | - | InvalidOperationException, "Invalid enrollment key" | - | Pending |
| CE-E-04 | Already enrolled throws | enrollment đã tồn tại | request={ClassId:"c1",StudentId:"s1"} | - | InvalidOperationException, "Student is already enrolled in this class" | - | Pending |
| CE-E-05 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to enroll in class" | LogError | Pending |

#### `Task<ClassEnrollmentsResponse> LeaveClass(ClassEnrollmentsRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CE-L-01 | Enrolled student leaves | enrollment tồn tại, IsJoining=true | request={ClassId:"c1",StudentId:"s1"} | Returns response với IsJoining=false, MovedOutDate!=null | - | LogInformation | Pending |
| CE-L-02 | Not enrolled throws | enrollment=null | request={ClassId:"c1",StudentId:"s1"} | - | InvalidOperationException, "Student is not enrolled in this class" | - | Pending |
| CE-L-03 | Already left throws | IsJoining=false | request={ClassId:"c1",StudentId:"s1"} | - | InvalidOperationException, "Student is not enrolled" | - | Pending |
| CE-L-04 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to leave class" | LogError | Pending |

#### `Task<ClassEnrollmentsResponse> ForceLeaveClass(string classId, string studentId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CE-FL-01 | Force removes student | enrollment tồn tại | classId="c1", studentId="s1" | Returns response với IsJoining=false | - | LogInformation | Pending |
| CE-FL-02 | Not enrolled throws | enrollment=null | classId="c1", studentId="s1" | - | InvalidOperationException, "Student is not enrolled in this class" | - | Pending |
| CE-FL-03 | Repository returns null throws | Repo returns null | classId="c1", studentId="s1" | - | Exception, "Failed to remove student from class" | LogError | Pending |

---

### 7.20. ClassroomQuizCommand

**File:** `Application/Commands/ClassroomQuiz/ClassroomQuizCommand.cs`

#### `Task<ClassroomQuizResponse> CreateClassroomQuizAsync(CreateClassroomQuizRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-C-01 | Valid request creates quiz | request hợp lệ | request={ClassroomId:"c1",QuizId:"q1",StartTime:future,EndTime:future+60m} | Returns ClassroomQuizResponse != null, Status=DRAFT | - | LogInformation | Pending |
| CQ-C-02 | StartTime in past throws | StartTime < now-1min | request={StartTime:past} | - | ArgumentException, "Start time must be in the future." | - | Pending |
| CQ-C-03 | EndTime <= StartTime throws | EndTime <= StartTime | request={StartTime:t+1h,EndTime:t+30m} | - | ArgumentException, "End time must be after start time." | - | Pending |
| CQ-C-04 | Time window < quiz duration throws | windowMinutes < quiz.Duration | request với short window | - | ArgumentException, "time window must be at least equal to quiz duration" | - | Pending |
| CQ-C-05 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to create classroom quiz assignment" | LogError | Pending |

#### `Task<ClassroomQuizResponse> UpdateClassroomQuizAsync(string id, UpdateClassroomQuizRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-U-01 | Quiz exists updates successfully | cq tồn tại | id="cq1", request valid | Returns updated response | - | LogInformation | Pending |
| CQ-U-02 | Quiz not found throws | cq=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |
| CQ-U-03 | Change start time on ONGOING throws | cq.Status=ONGOING | request={StartTime:newTime} | - | InvalidOperationException, "Cannot change start time once the quiz has started or ended." | - | Pending |
| CQ-U-04 | Change start time on CLOSED throws | cq.Status=CLOSED | request={StartTime:newTime} | - | InvalidOperationException | - | Pending |
| CQ-U-05 | Change past start time on DRAFT throws | cq.Status=DRAFT, StartTime < now-5min | request={StartTime:past} | - | ArgumentException, "Start time cannot be in the past." | - | Pending |
| CQ-U-06 | Reduce end time on ONGOING throws | cq.Status=ONGOING | request={EndTime:earlierTime} | - | InvalidOperationException, "Cannot reduce end time while quiz is ongoing." | - | Pending |
| CQ-U-07 | DRAFT->PUBLISHED with future start succeeds | cq.Status=DRAFT | request={Status:PUBLISHED} | Status=PUBLISHED | - | LogInformation | Pending |
| CQ-U-08 | DRAFT->PUBLISHED with past start throws | cq.Status=DRAFT, StartTime <= now | request={Status:PUBLISHED} | - | InvalidOperationException, "Cannot publish to the past." | - | Pending |
| CQ-U-09 | DRAFT->ONGOING sets StartTime=now | cq.Status=DRAFT | request={Status:ONGOING} | response.StartTime ~ now | - | LogInformation | Pending |
| CQ-U-10 | PUBLISHED->ONGOING sets StartTime=now | cq.Status=PUBLISHED | request={Status:ONGOING} | response.StartTime ~ now | - | LogInformation | Pending |
| CQ-U-11 | ONGOING->CLOSED sets EndTime=now | cq.Status=ONGOING | request={Status:CLOSED} | response.EndTime ~ now | - | LogInformation | Pending |
| CQ-U-12 | PUBLISHED->CLOSED throws | cq.Status=PUBLISHED | request={Status:CLOSED} | - | InvalidOperationException, "Cannot transition PUBLISHED directly to CLOSED" | - | Pending |
| CQ-U-14 | Change passcode on CLOSED throws | cq.Status=CLOSED | request={Passcode:"newpass"} | - | InvalidOperationException, "Cannot change passcode of a closed quiz." | - | Pending |

#### `Task SoftDeleteClassroomQuizAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-SD-01 | Non-ongoing quiz soft deletes | cq tồn tại, Status!=ONGOING | id="cq1" | Returns void, Jobs cancelled | - | LogInformation | Pending |
| CQ-SD-02 | ONGOING quiz throws | cq.Status=ONGOING | id="cq1" | - | InvalidOperationException, "Cannot delete an ongoing quiz. Please close it first." | - | Pending |
| CQ-SD-03 | Quiz not found throws | cq=null | id="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task DeleteClassroomQuizAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-D-01 | Non-ongoing quiz hard deletes | cq tồn tại, Status!=ONGOING | id="cq1" | Returns void | - | LogInformation | Pending |
| CQ-D-02 | ONGOING quiz throws | cq.Status=ONGOING | id="cq1" | - | InvalidOperationException, "Cannot delete an ongoing quiz." | - | Pending |

---

### 7.21. QuestionCommand

**File:** `Application/Commands/Question/QuestionCommand.cs`

#### `Task<QuestionResponse> CreateQuestionAsync(CreateQuestionRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| Q-C-01 | MULTIPLE_CHOICE with answer options creates | Type=MULTIPLE_CHOICE | request={Content:"Q1",Type:MULTIPLE_CHOICE,AnswerOptions:[{Content:"A",IsCorrect:true}]} | Returns QuestionResponse != null | - | LogInformation | Pending |
| Q-C-02 | ESSAY type with TextAnswer creates | Type=ESSAY | request={Content:"Essay Q",Type:ESSAY,TextAnswer:"Sample answer"} | Returns QuestionResponse != null, AnswerOptions=empty | - | LogInformation | Pending |
| Q-C-03 | ESSAY type clears AnswerOptions | Type=ESSAY với AnswerOptions provided | request={Type:ESSAY,AnswerOptions:[...]} | AnswerOptions cleared in model | - | - | Pending |
| Q-C-04 | Repository returns null throws | Repo returns null | request valid | - | Exception, "Failed to create question" | LogError | Pending |

#### `Task<QuestionResponse> UpdateQuestionAsync(string questionId, UpdateQuestionRequest request)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| Q-U-01 | Question exists updates | question tồn tại | questionId="q1", request valid | Returns updated QuestionResponse | - | LogInformation | Pending |
| Q-U-02 | Question not found or deleted throws | question=null hoặc IsDeleted=true | questionId="nonexistent" | - | KeyNotFoundException, "Question with id nonexistent not found" | - | Pending |
| Q-U-03 | Repository returns null throws | Repo returns null | questionId="q1" | - | Exception, "Failed to update question" | LogError | Pending |

#### `Task<QuestionResponse> SoftDeleteQuestionAsync(string questionId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| Q-SD-01 | Soft deletes | question tồn tại | questionId="q1" | Returns QuestionResponse với IsDeleted=true | - | LogInformation | Pending |
| Q-SD-02 | Not found throws | question=null | questionId="nonexistent" | - | KeyNotFoundException | - | Pending |

#### `Task<QuestionResponse> RestoreQuestionAsync(string questionId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| Q-R-01 | Restores successfully | question tồn tại | questionId="q1" | Returns QuestionResponse với IsDeleted=false | - | LogInformation | Pending |
| Q-R-02 | Not found throws | question=null | questionId="nonexistent" | - | KeyNotFoundException | - | Pending |
| Q-R-03 | Repository returns null throws | Repo returns null | questionId="q1" | - | Exception, "Failed to restore question" | LogError | Pending |

#### `Task<QuestionResponse> DeleteQuestionAsync(string questionId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| Q-D-01 | Hard deletes | question tồn tại | questionId="q1" | Returns QuestionResponse, calls Delete on repo | - | LogInformation | Pending |
| Q-D-02 | Not found throws | question=null | questionId="nonexistent" | - | KeyNotFoundException | - | Pending |

---

## 8. ACASSERVICE — QUERIES

---

### 8.1. SubmissionQuery

**File:** `Application/Queries/Submission/SubmissionQuery.cs`

#### `Task<Models.Submission?> GetSubmissionByIdAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SQ-G-01 | Submission exists returns submission | submission tồn tại | id="s1" | Returns Submission != null | - | - | Pending |
| SQ-G-02 | Submission not found returns null | submission=null | id="nonexistent" | Returns null | - | - | Pending |

#### `Task<(Models.Submission?, ProblemResponse?, UserProfileResponse?)> GetSubmissionDetailByIdAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SQ-GD-01 | All exist returns tuple with all data | submission, problem, student tồn tại | id="s1" | Returns (Submission, Problem, StudentProfile) all non-null | - | - | Pending |
| SQ-GD-02 | Submission not found returns null for submission | submission=null | id="nonexistent" | Returns (null, null, null) | - | - | Pending |
| SQ-GD-03 | Problem not found returns null for problem | problem=null | id="s1" | Returns (Submission, null, StudentProfile) | - | - | Pending |

#### `Task<List<Models.Submission>> GetVersionsBySubmissionKey(string studentId, string examId, string problemId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| SQ-V-01 | Returns all versions sorted by version | versions tồn tại | studentId="s1", examId="e1", problemId="p1" | Returns list sorted by Version ASC | - | - | Pending |
| SQ-V-02 | No submissions returns empty list | no submissions | studentId="s1", examId="e1", problemId="p1" | Returns empty list | - | - | Pending |

---

### 8.2. ProblemQuery

**File:** `Application/Queries/Problem/ProblemQuery.cs`

#### `Task<ProblemResponse?> GetProblemByIdAsync(string problemId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PQ-G-01 | Problem exists returns ProblemResponse | problem tồn tại | problemId="p1" | Returns ProblemResponse != null | - | - | Pending |
| PQ-G-02 | Problem not found returns null | problem=null | problemId="nonexistent" | Returns null | - | - | Pending |

#### `Task<List<ProblemResponse>> GetProblemsByIdsAsync(IEnumerable<string> problemIds)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PQ-GI-01 | All problems exist returns all | 3 problems | problemIds=["p1","p2","p3"] | Returns list of 3 | - | - | Pending |
| PQ-GI-02 | Some not found returns found only | p1 tồn tại, p2 không | problemIds=["p1","nonexistent"] | Returns list of 1 | - | - | Pending |
| PQ-GI-03 | Empty input returns empty list | problemIds empty | problemIds=[] | Returns empty list | - | - | Pending |

#### `Task<List<TestCaseResponse>> GetTestCasesByProblemIdAsync(string problemId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| PQ-TC-01 | Returns non-deleted test cases | test cases tồn tại | problemId="p1" | TestCases all have IsDeleted=false | - | - | Pending |
| PQ-TC-02 | Filters deleted test cases | some deleted | problemId="p1" | Returns only non-deleted | - | - | Pending |

---

### 8.3. ClassroomQuery

**File:** `Application/Queries/Classroom/ClassroomQuery.cs`

#### `Task<ClassroomResponse> GetClassroomByIdAsync(string id)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-G-01 | Classroom exists returns ClassroomResponse | classroom tồn tại | id="c1" | Returns ClassroomResponse != null | - | - | Pending |
| CQ-G-02 | Classroom not found returns null | classroom=null | id="nonexistent" | Returns null | - | - | Pending |

#### `Task<PagedResult<ClassroomResponse>> GetAllClassroomsAsync(string? userId, string? search, string? status, int pageIndex, int pageSize)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-GA-01 | Returns paginated results | repo returns items | pageIndex=0, pageSize=10 | PagedResult with correct Items and TotalCount | - | - | Pending |
| CQ-GA-02 | Empty results returns empty PagedResult | repo returns empty | pageIndex=0, pageSize=10 | Items empty, TotalCount=0 | - | - | Pending |

#### `Task<List<ClassroomResponse>> FindByStudentIdAsync(string studentId)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| CQ-FS-01 | Student has enrollments returns classrooms | student đã enroll | studentId="s1" | Returns list of enrolled classrooms | - | - | Pending |
| CQ-FS-02 | Student has no enrollments returns empty | no enrollments | studentId="s1" | Returns empty list | - | - | Pending |

---

### 8.4. NotificationQuery

**File:** `Application/Queries/Notification/NotificationQuery.cs`

#### `Task<PagedResult<NotificationResponse>> GetNotificationsByUserIdAsync(string userId, int pageIndex = 1, int pageSize = 10)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| NQ-GN-01 | User has notifications returns paginated | notifications tồn tại | userId="u1" | Returns PagedResult với Items | - | - | Pending |
| NQ-GN-02 | User has no notifications returns empty | no notifications | userId="u1" | Returns empty PagedResult | - | - | Pending |
| NQ-GN-03 | Pagination works correctly | multiple pages | pageIndex=2, pageSize=5 | Returns correct page | - | - | Pending |

---

## 9. ACASSERVICE — CODERUNNER

---

### 9.1. CompilationApi

**File:** `Application/CodeRunner/CompilationApi.cs`

#### `Task<CompilationResult> CompileAsync(string compilerId, CompileRequest compileRequest, string lang)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| COMP-C-01 | Valid request returns CompilationResult | request hợp lệ | compilerId="java", lang="java" | Returns CompilationResult != null | - | - | Pending |
| COMP-C-02 | Null language throws ArgumentException | lang=null | lang=null | - | ArgumentException, "Language cannot be null or empty" | - | Pending |
| COMP-C-03 | Empty language throws ArgumentException | lang="" | lang="" | - | ArgumentException | - | Pending |
| COMP-C-04 | Deserialization returns null throws InvalidOperationException | result=null | valid request | - | InvalidOperationException, "Failed to deserialize compilation result" | - | Pending |
| COMP-C-05 | Build succeeded with errors returns result with BuildError | BuildResult.Code != 0 | compileRequest với syntax error | Returns CompilationResult với BuildResult != null | - | - | Pending |

#### `Task<RunBatchResponse> RunBatchAsync(string compilerId, RumBatchRequest runBatchRequest, string lang)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| COMP-R-01 | Valid request returns RunBatchResponse | request hợp lệ | compilerId="java", lang="java" | Returns RunBatchResponse != null | - | - | Pending |
| COMP-R-02 | Null language throws ArgumentException | lang=null | lang=null | - | ArgumentException | - | Pending |
| COMP-R-03 | Empty stdinList throws ArgumentException | stdinList empty | runBatchRequest.TestCases=[] | - | ArgumentException, "stdinList cannot be empty" | - | Pending |
| COMP-R-04 | Deserialization returns null throws InvalidOperationException | result=null | valid request | - | InvalidOperationException | - | Pending |

---

### 9.2. TestcaseEvaluator

**File:** `Application/Commands/Submission/TestcaseEvaluator.cs`

#### `Task<CompilationResult> ExecuteCustomTestcaseAsync(string compilerId, CompileRequest compileRequest, string lang)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TE-E-01 | Compilation succeeds returns result | compile success | compilerId="java", lang="java" | Returns CompilationResult với ExecResult | - | - | Pending |
| TE-E-02 | Compilation fails returns result with compile error | compile failed | compileRequest với syntax error | Returns CompilationResult với Status=COMPILE_ERROR | - | - | Pending |
| TE-E-03 | Null compile request throws | compileRequest=null | compilerId="java" | - | ArgumentNullException | - | Pending |

#### `Task<List<TestResultResponse>> ExecuteTestcasesAsync(string compilerId, RumBatchRequest runBatchRequest, string lang)`

| ID | Test Case Name | Precondition | Input Data | Expected Output | Exceptions | Log Messages | Status |
|----|---------------|-------------|------------|----------------|-----------|-------------|--------|
| TE-ET-01 | All test cases pass returns SUCCESS results | all pass | runBatchRequest với 3 test cases | Returns list of 3 với Status=SUCCESS | - | - | Pending |
| TE-ET-02 | Some test cases fail returns FAIL results | 2 pass, 1 fail | runBatchRequest với mixed results | Returns list với correct FAIL count | - | - | Pending |
| TE-ET-03 | Compilation error returns COMPILE_ERROR for each | compile failed | runBatchRequest với compile error | Returns list với Status=COMPILE_ERROR for each | - | - | Pending |
| TE-ET-04 | Timeout returns TIMEOUT result | exec timed out | runBatchRequest | Returns result với Status=TIMEOUT | - | - | Pending |
| TE-ET-05 | Runtime error returns RUNTIME_ERROR | exitCode != 0 | runBatchRequest | Returns result với Status=RUNTIME_ERROR | - | - | Pending |
| TE-ET-06 | Result count mismatch throws Exception | resultCount != testCaseCount | runBatchRequest với mismatch | - | Exception, "Failed to execute public testcases" | - | Pending |

---

## TỔNG KẾT SỐ LƯỢNG TEST CASES

| Module | File | Số Test Cases |
|--------|------|--------------|
| AuthService Utils | JwtUtil, HashingUtil, OptGenerator, GoogleTokenVerifier, ResponseUtil | ~70 |
| AuthService Commands | UserCommand | ~38 |
| AuthService Queries | UserQuery | ~27 |
| AcasService Utils | ResultComparator, TextAnswerComparer | ~30 |
| AcasService Jobs | ExaminationJobScheduling | ~4 |
| AcasService Commands | SubmissionCommand | ~33 |
| AcasService Commands | ProblemCommand | ~25 |
| AcasService Commands | ClassroomCommand | ~14 |
| AcasService Commands | SlotCommand | ~11 |
| AcasService Commands | StudentExamSessionCommand | ~9 |
| AcasService Commands | QuizAttemptCommand | ~10 |
| AcasService Commands | DiscussionIssueCommand | ~6 |
| AcasService Commands | NotificationCommand | ~6 |
| AcasService Commands | ExamLogCommand | ~5 |
| AcasService Commands | MaterialCommand | ~6 |
| AcasService Commands | KeystrokeLogsCommand | ~5 |
| AcasService Commands | ProgrammingLanguageCommand | ~9 |
| AcasService Commands | UserDeviceCommand | ~3 |
| AcasService Commands | ErrorGroupCommand | ~8 |
| AcasService Commands | ExaminationTemplateCommand | ~10 |
| AcasService Commands | RegradingRequestCommand | ~11 |
| AcasService Commands | SubjectCommand | ~16 |
| AcasService Commands | ClassEnrollmentsCommand | ~9 |
| AcasService Commands | ClassroomQuizCommand | ~14 |
| AcasService Commands | QuestionCommand | ~10 |
| AcasService Commands | ExaminationCommand | ~7 |
| AcasService Queries | SubmissionQuery, ProblemQuery, ClassroomQuery, NotificationQuery | ~15 |
| AcasService CodeRunner | CompilationApi, TestcaseEvaluator | ~12 |
| **TỔNG** | | **~423** |

---

**Ghi chú:**
- Mỗi hàm được test với: happy path, error cases, edge cases, boundary conditions
- Exceptions được test với message cụ thể
- Log messages được verify cho các trường hợp quan trọng
- Tất cả test cases có Status = Pending, cần implement và đánh dấu Done khi hoàn thành
