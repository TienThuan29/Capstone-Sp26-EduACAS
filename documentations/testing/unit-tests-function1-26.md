# Unit Test Document — EDUACAS Backend

| Property | Value |
|---|---|
| **Project Name** | EDUACAS Backend |
| **Project Code** | EDUACAS |
| **Creator** | QA Team |
| **Issue Date** | 2026-04-23 |

---

## Table of Contents

- [F001 — JwtUtil](#f001---jwtutil)
- [F002 — GenerateAccessToken](#f002---generateaccesstoken)
- [F003 — GenerateRefreshToken](#f003---generaterefreshtoken)
- [F004 — VerifyAsync](#f004---verifyasync)
- [F005 — HashString](#f005---hashstring)
- [F006 — VerifyHash](#f006---verifyhash)
- [F007 — GenerateOpt](#f007---generateopt)
- [F008 — GoogleTokenVerifier](#f008---googletokenverifier)
- [F009 — VerifyTokenAsync](#f009---verifytokenasync)
- [F010 — ActionResult Success<T>(T dataResponse, string? message = null, int statusCode =](#f010---actionresult-success-t--t-dataresponse--string--message---null--int-statuscode)
- [F011 — ActionResult Error<T>(string? message = null, int statusCode = 500, string? erro](#f011---actionresult-error-t--string--message---null--int-statuscode---500--string--erro)
- [F012 — CreateUserAsync](#f012---createuserasync)
- [F013 — RegisterWithEmailVerificationAsync](#f013---registerwithemailverificationasync)
- [F014 — VerifyEmailAsync](#f014---verifyemailasync)
- [F015 — SendForgotPasswordLinkAsync](#f015---sendforgotpasswordlinkasync)
- [F016 — ResetPasswordAsync](#f016---resetpasswordasync)
- [F017 — GrantAccountAsync](#f017---grantaccountasync)
- [F018 — ResetFirstLoginPasswordAsync](#f018---resetfirstloginpasswordasync)
- [F019 — ChangePasswordAsync](#f019---changepasswordasync)
- [F020 — UpdateUserAsync](#f020---updateuserasync)
- [F021 — UpdateProfileAsync](#f021---updateprofileasync)
- [F022 — AuthenticateAsync](#f022---authenticateasync)
- [F023 — AuthenticateWithGoogleAsync](#f023---authenticatewithgoogleasync)
- [F024 — GetProfileAsync](#f024---getprofileasync)
- [F025 — GetAllUsersAsync](#f025---getallusersasync)
- [F026 — GetPagedUsersAsync](#f026---getpagedusersasync)

---

## F001 — JwtUtil

**Function Code:** `F001`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 8  

**Test Requirement:** Unit test for JwtUtil(IConfiguration configuration)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `IConfiguration service available`<br>**config["Jwt:JwtSecret"]:** `"Acas"` | **Exception:** InvalidOperationException<br>**Log:** JWT_SECRET is not configured |
| `UTCD-02` | A | **Precondition:** `IConfiguration service available`<br>**config["Jwt:JwtSecret"]:** `"Acas"` | **Exception:** InvalidOperationException<br>**Log:** JWT_SECRET is not configured |
| `UTCD-03` | A | **Precondition:** `Configuration key Jwt:Audience is present`<br>**config["Jwt:JwtSecret"]:** `"Acas"` | **Confirm:** JwtUtil instance created<br>**Exception:** Instance created successfully, _secret != null |


## F002 — GenerateAccessToken

**Function Code:** `F002`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 4  

**Test Requirement:** Unit test for string GenerateAccessToken(JwtPayload payload)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `payload.Role is non-null string`<br>**payload.Id:** `"u1"`<br>**payload.Email:** `"a@b.com"`<br>**payload.Role:** `"User"` | **Confirm:** Returns non-empty string<br>**Exception:** Returns JWT string (split('.') length == 3) |
| `UTCD-02` | A | **Precondition:** `payload.Role is non-null string`<br>**payload.Id:** `"u2"`<br>**payload.Email:** `"b@c.com"`<br>**payload.Role:** `"Admin"` | **Confirm:** Returns non-empty string<br>**Exception:** token2 != token1 (different payload) |
| `UTCD-03` | A | **Precondition:** `payload.Role is non-null string`<br>**payload.Id:** `"u1"`<br>**payload.Email:** `"a@b.com"`<br>**payload.Role:** `"User"` | **Confirm:** Returns non-empty string<br>**Exception:** Token contains id=u1, email=a@b.com, role=User claims |
| `UTCD-04` | A | **Precondition:** `payload.Role is non-null string`<br>**payload.Id:** `"u1"`<br>**payload.Email:** `"special!#$%@test.com"`<br>**payload.Role:** `"Super-Admin"` | **Confirm:** Returns non-empty string<br>**Exception:** split('.') == 3 |
| `UTCD-05` | A | **Precondition:** `payload.Role is non-null string`<br>**payload.Id:** `"u1"`<br>**payload.Email:** `"test@unicode.com"`<br>**payload.Role:** `"User"` | **Confirm:** Returns non-empty string<br>**Exception:** split('.') == 3 |


## F003 — GenerateRefreshToken

**Function Code:** `F003`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 4  

**Test Requirement:** Unit test for string GenerateRefreshToken(JwtPayload payload)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `"u1"`<br>**payload.Email:** `"a@b.com"`<br>**payload.Role:** `"User"` | **Confirm:** Returns non-empty string<br>**Exception:** split('.') == 3 |
| `UTCD-02` | A | **Precondition:** `"u1"`<br>**payload.Email:** `"a@b.com"`<br>**payload.Role:** `"User"` | **Confirm:** Returns non-empty string<br>**Exception:** refreshToken.ValidTo > accessToken.ValidTo (default 7d vs 1d) |
| `UTCD-03` | A | **Precondition:** `"u1"`<br>**payload.Email:** `"b@c.com"`<br>**payload.Role:** `"Admin"` | **Confirm:** Returns non-empty string<br>**Exception:** claims contain id=u1, role=Admin |


## F004 — VerifyAsync

**Function Code:** `F004`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 31  

**Test Requirement:** Unit test for Task<JwtPayload> VerifyAsync(string token)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `Token is not expired`<br>**token:** `validJWT (signed with _secret)` | **Confirm:** Returns JwtPayload<br>**Exception:** JwtPayload.Id != null, Email != null, Role != null |
| `UTCD-02` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `"invalid.token.here"` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-03` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `validJWT_modified_at_end` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-04` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `expiredJWT (expiration=0s)` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-05` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `tokenSignedWithDifferentSecret` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-06` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `""` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-07` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `null` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-08` | A | **Precondition:** `JwtUtil instantiated with valid secret key`<br>**token:** `"only.two.parts"` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |


## F005 — HashString

**Function Code:** `F005`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 12  

**Test Requirement:** Unit test for string HashString(string input, IConfiguration configuration)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"test-password"`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** Returns 64-char lowercase hex (matches ^[0-9a-f]{64}$) |
| `UTCD-02` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"test-password"`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** hash1 == hash2 (deterministic for same input) |
| `UTCD-03` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"password_a"`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** hash_a != hash_b (different inputs) |
| `UTCD-04` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"mypassword123"`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** hash != input |
| `UTCD-05` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"Unicode: 中文测试 français €"`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** Returns 64-char hash |
| `UTCD-06` | A | **Precondition:** `input is a string (can be empty)`<br>**input:** `""`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** Returns 64-char hash (empty string hashed) |
| `UTCD-07` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"   "`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** Returns 64-char hash (whitespace hashed) |
| `UTCD-08` | B | **Precondition:** `input is a string (can be empty)`<br>**input:** `"test-password"`<br>**configuration["HashingSecretKey"]:** `"secret-key-64chars-minimum-64chars-0123456789abcdef"` | **Return:** Returns string<br>**Exception:** hash == UTCD-02.hash (same input = same output) |
| `UTCD-09` | A | **Precondition:** `input is a string (can be empty)`<br>**input:** `"test-password"`<br>**configuration["HashingSecretKey"]:** `null` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: HASHING_SECRET_KEY is not configured |
| `UTCD-10` | A | **Precondition:** `input is a string (can be empty)`<br>**input:** `"test-password"`<br>**configuration["HashingSecretKey"]:** `""` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: HASHING_SECRET_KEY is not configured |


## F006 — VerifyHash

**Function Code:** `F006`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 8  

**Test Requirement:** Unit test for bool VerifyHash(string input, string hash, IConfiguration configuration)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `input is a string`<br>**input:** `"correctpassword"`<br>**hash:** `HashString("correctpassword", config)`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns true |
| `UTCD-02` | A | **Precondition:** `input is a string`<br>**input:** `"wrongpassword"`<br>**hash:** `HashString("correctpassword", config)`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns false |
| `UTCD-03` | N | **Precondition:** `input is a string`<br>**input:** `"password"`<br>**hash:** `"aaa" + "b"*61`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns false |
| `UTCD-04` | N | **Precondition:** `input is a string`<br>**input:** `"password"`<br>**hash:** `HashString("password", config_with_secretA)`<br>**configuration["HashingSecretKey"]:** `different secret key` | **Return:** Returns false<br>**Exception:** hash verified with different secret than hash was created |
| `UTCD-05` | N | **Precondition:** `input is a string`<br>**input:** `"PASSWORD"`<br>**hash:** `HashString("password", config)`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns false<br>**Exception:** case-sensitive comparison |
| `UTCD-06` | N | **Precondition:** `input is a string`<br>**input:** `"password"`<br>**hash:** `""`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns false |
| `UTCD-07` | B | **Precondition:** `input is a string`<br>**input:** `"password"`<br>**hash:** `"not-hex-string" + "0"*52`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns false |
| `UTCD-08` | N | **Precondition:** `input is a string`<br>**input:** `"pass "`<br>**hash:** `HashString("pass", config)`<br>**configuration["HashingSecretKey"]:** `valid secret key` | **Return:** Returns false<br>**Exception:** trailing space vs no space |
| `UTCD-09` | A | **Precondition:** `input is a string`<br>**input:** `"test"`<br>**hash:** `HashString("test", config)`<br>**configuration["HashingSecretKey"]:** `null` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException |


## F007 — GenerateOpt

**Function Code:** `F007`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 4  

**Test Requirement:** Unit test for string GenerateOpt(int length = 6)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `6 (default, not passed)` | **Return:** Returns string<br>**Exception:** length == 6 |
| `UTCD-02` | N | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `4` | **Return:** Returns string<br>**Exception:** length == 4 |
| `UTCD-03` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `10` | **Return:** Returns string<br>**Exception:** length == 10 |
| `UTCD-04` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `1` | **Return:** Returns string<br>**Exception:** length == 1 |
| `UTCD-05` | A | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `0` | **Return:** Returns string<br>**Exception:** length == 0 (empty string) |
| `UTCD-06` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `100` | **Return:** Returns string<br>**Exception:** length == 100 |
| `UTCD-07` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `6` | **Return:** Returns string<br>**Exception:** All characters are digits (0-9) |
| `UTCD-08` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `6` | **Return:** Returns string<br>**Exception:** 100 calls produce >= 90 distinct OTPs (randomness) |
| `UTCD-09` | B | **Precondition:** `None (pure function, no external dependencies)`<br>**length:** `20` | **Return:** Returns string<br>**Exception:** All digits, length=20 |


## F008 — GoogleTokenVerifier

**Function Code:** `F008`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 5  

**Test Requirement:** Unit test for Constructor GoogleTokenVerifier(IConfiguration configuration, ILogger<GoogleTokenVerifier> logger)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `ILogger<GoogleTokenVerifier> injected`<br>**configuration["Google:ClientId"]:** `mock` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Google:ClientId is not configured |
| `UTCD-02` | A | **Precondition:** `ILogger<GoogleTokenVerifier> injected`<br>**configuration["Google:ClientId"]:** `mock` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Google:ClientId is not configured |
| `UTCD-03` | A | **Precondition:** `Configuration key Google:ClientId is present and non-empty`<br>**configuration["Google:ClientId"]:** `mock` | **Confirm:** Instance created<br>**Exception:** Instance created, _clientId != null |


## F009 — VerifyTokenAsync

**Function Code:** `F009`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 30  

**Test Requirement:** Unit test for Task<GoogleTokenPayload> VerifyTokenAsync(string idToken)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `Token is signed for the configured ClientId`<br>**idToken:** `validGoogleIdToken` | **Confirm:** Returns GoogleTokenPayload<br>**Exception:** Email != null, Email is valid format |
| `UTCD-02` | A | **Precondition:** `Token is signed for the configured ClientId`<br>**idToken:** `validGoogleIdToken` | **Confirm:** Returns GoogleTokenPayload<br>**Exception:** GoogleId != null |
| `UTCD-03` | A | **Precondition:** `Token is signed for the configured ClientId`<br>**idToken:** `validGoogleIdToken` | **Confirm:** Returns GoogleTokenPayload<br>**Exception:** Name != null, Picture != null |
| `UTCD-04` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `null` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |
| `UTCD-05` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `""` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |
| `UTCD-06` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `"   "` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |
| `UTCD-07` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `"not.a.valid.jwt"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |
| `UTCD-08` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `tokenForDifferentClientId` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |
| `UTCD-09` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `expiredGoogleToken` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |
| `UTCD-10` | A | **Precondition:** `GoogleTokenVerifier instantiated with valid ClientId`<br>**idToken:** `"only.two.parts"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |


## F010 — ActionResult Success<T>(T dataResponse, string? message = null, int statusCode =

**Function Code:** `F010`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 17  

**Test Requirement:** Unit test for ActionResult Success<T>(T dataResponse, string? message = null, int statusCode = 200)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `ASP.NET Core ObjectResult/ApiResponse pipeline available`<br>**dataResponse:** `{Id:1, Name:"Test"}`<br>**message:** `null`<br>**statusCode:** `200` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 200, Success == true |
| `UTCD-02` | B | **Precondition:** `ASP.NET Core ObjectResult/ApiResponse pipeline available`<br>**dataResponse:** `"simple string"`<br>**message:** `null`<br>**statusCode:** `200` | **Return:** Returns ObjectResult<br>**Exception:** DataResponse == "simple string" |
| `UTCD-03` | A | **Precondition:** `ASP.NET Core ObjectResult/ApiResponse pipeline available`<br>**dataResponse:** `null`<br>**message:** `null`<br>**statusCode:** `200` | **Return:** Returns ObjectResult<br>**Exception:** DataResponse == null, Success == true |
| `UTCD-04` | B | **Precondition:** `ASP.NET Core ObjectResult/ApiResponse pipeline available`<br>**dataResponse:** `{Value:42}`<br>**message:** `"Created successfully"`<br>**statusCode:** `201` | **Return:** Returns ObjectResult<br>**Exception:** Message == "Created successfully", StatusCode == 201 |
| `UTCD-05` | B | **Precondition:** `ASP.NET Core ObjectResult/ApiResponse pipeline available`<br>**dataResponse:** `{Nested:{Value:"x"}, List:[1,2,3]}`<br>**message:** `null`<br>**statusCode:** `200` | **Return:** Returns ObjectResult<br>**Exception:** Nested data preserved in response |
| `UTCD-06` | B | **Precondition:** `ASP.NET Core ObjectResult/ApiResponse pipeline available`<br>**dataResponse:** `"ok"`<br>**message:** `"Success"`<br>**statusCode:** `204` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 204 |


## F011 — ActionResult Error<T>(string? message = null, int statusCode = 500, string? erro

**Function Code:** `F011`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 26  

**Test Requirement:** Unit test for ActionResult Error<T>(string? message = null, int statusCode = 500, string? error = null, string? stack = null)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `Environment.GetEnvironmentVariable accessible for stack trace in Development`<br>**message:** `null`<br>**statusCode:** `500`<br>**error:** `null`<br>**stack:** `null` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 500, Message == "Internal Server Error", Success == false |
| `UTCD-02` | A | **Precondition:** `None (static utility)`<br>**message:** `"Not Found"`<br>**statusCode:** `404`<br>**error:** `null`<br>**stack:** `null` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 404, Message == "Not Found" |
| `UTCD-03` | B | **Precondition:** `None (static utility)`<br>**message:** `"Bad Request"`<br>**statusCode:** `400`<br>**error:** `null`<br>**stack:** `null` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 400, Message == "Bad Request" |
| `UTCD-04` | A | **Precondition:** `None (static utility)`<br>**message:** `"Custom Error"`<br>**statusCode:** `422`<br>**error:** `"Detailed validation error"`<br>**stack:** `null` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 422, Error == "Detailed validation error" |
| `UTCD-05` | A | **Precondition:** `ASP.NET_ENV == Development`<br>**message:** `"Error"`<br>**statusCode:** `500`<br>**error:** `null`<br>**stack:** `"at Method()" (ASP.NET_ENV=Development)` | **Return:** Returns ObjectResult<br>**Exception:** Stack == "at Method()" |
| `UTCD-06` | A | **Precondition:** `ASP.NET_ENV != Development`<br>**message:** `"Error"`<br>**statusCode:** `500`<br>**error:** `null`<br>**stack:** `null (ASP.NET_ENV!=Development)` | **Return:** Returns ObjectResult<br>**Exception:** Stack == null in non-Development |
| `UTCD-07` | A | **Precondition:** `None (static utility)`<br>**message:** `"Forbidden"`<br>**statusCode:** `403`<br>**error:** `null`<br>**stack:** `null` | **Return:** Returns ObjectResult<br>**Exception:** StatusCode == 403 |


## F012 — CreateUserAsync

**Function Code:** `F012`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 41  

**Test Requirement:** Unit test for Task<AuthResponse> CreateUserAsync(RegisterData registerData)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `registerData.Role is a valid Role enum value`<br>**registerData.Email:** `"new@test.com"`<br>**registerData.Password:** `"pass123"`<br>**registerData.Fullname:** `"New User"`<br>**registerData.Role:** `"STUDENT"`<br>**registerData.RoleNumber:** `"SE123456"` | **Return:** Returns AuthResponse<br>**Exception:** AccessToken != null, RefreshToken != null, UserProfile.Email == new@test.com |
| `UTCD-02` | A | **Precondition:** `IUserRepository.FindByEmailAsync returns existing User`<br>**registerData.Email:** `"existing@test.com"`<br>**registerData.Password:** `"pass123"`<br>**registerData.Fullname:** `"Existing User"`<br>**registerData.Role:** `"STUDENT"`<br>**registerData.RoleNumber:** `"SE999999"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User with this email already exists. |
| `UTCD-03` | A | **Precondition:** `registerData.Role is a valid Role enum value`<br>**registerData.Email:** `"new@test.com"`<br>**registerData.Password:** `"pass123"`<br>**registerData.Fullname:** `"New User"`<br>**registerData.Role:** `"STUDENT"`<br>**registerData.RoleNumber:** `"SE000000"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: An error occurred while creating the account |
| `UTCD-04` | B | **Precondition:** `registerData.Role is a valid Role enum value`<br>**registerData.Email:** `"new@test.com"`<br>**registerData.Password:** `"pass123"`<br>**registerData.Fullname:** `"New User"`<br>**registerData.Role:** `"STUDENT"`<br>**registerData.RoleNumber:** `"SE000000"` | **Return:** Returns AuthResponse (email non-critical)<br>**Exception:** AuthResponse returned despite email failure |
| `UTCD-05` | A | **Precondition:** `registerData.Role is an invalid Role enum value`<br>**registerData.Email:** `"new@test.com"`<br>**registerData.Password:** `"pass"`<br>**registerData.Fullname:** `"Test"`<br>**registerData.Role:** `"INVALID_ROLE"`<br>**registerData.RoleNumber:** `"SE000000"` | **Exception:** ArgumentException<br>**Log:** ArgumentException |
| `UTCD-06` | B | **Precondition:** `registerData.Role is a valid Role enum value`<br>**registerData.Email:** `"a@b.com"`<br>**registerData.Password:** `"pass123"`<br>**registerData.Fullname:** `"User"`<br>**registerData.Role:** `"LECTURER"`<br>**registerData.RoleNumber:** `"GV000001"` | **Return:** Returns AuthResponse<br>**Exception:** UserRole == LECTURER |
| `UTCD-07` | B | **Precondition:** `registerData.Role is a valid Role enum value`<br>**registerData.Email:** `"a@b.com"`<br>**registerData.Password:** `"pass123"`<br>**registerData.Fullname:** `"User"`<br>**registerData.Role:** `"ADMIN"`<br>**registerData.RoleNumber:** `"AD000000"` | **Return:** Returns AuthResponse<br>**Exception:** UserRole == ADMIN |


## F013 — RegisterWithEmailVerificationAsync

**Function Code:** `F013`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 30  

**Test Requirement:** Unit test for Task<string> RegisterWithEmailVerificationAsync(RegisterData registerData)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `IEmailService.SendEmailAsync succeeds`<br>**registerData.Email:** `"SE000000"` | **Confirm:** Returns string<br>**Exception:** Returns non-empty registerSession GUID |
| `UTCD-02` | A | **registerData.Email:** `"SE000000"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User with this email already exists. |
| `UTCD-03` | A | **Precondition:** `IUserOptCacheRepository.SaveAsync returns false`<br>**registerData.Email:** `"SE000000"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to save user to cache |
| `UTCD-04` | B | **Precondition:** `IEmailService.SendEmailAsync throws Exception`<br>**registerData.Email:** `"SE000000"` | **Confirm:** Returns string<br>**Exception:** registerSession GUID returned despite email failure |


## F014 — VerifyEmailAsync

**Function Code:** `F014`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 20  

**Test Requirement:** Unit test for Task<bool> VerifyEmailAsync(VerifyEmailRequest verifyEmailRequest)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `IUserRepository.CreateAsync succeeds`<br>**verifyEmailRequest.RegisterSession:** `"valid-guid-xxxx"`<br>**verifyEmailRequest.Otp:** `"123456"` | **Confirm:** Returns true<br>**Exception:** User saved to DB, session deleted from cache |
| `UTCD-02` | A | **Precondition:** `IUserOptCacheRepository.GetAsync returns null`<br>**verifyEmailRequest.RegisterSession:** `"invalid-guid-xxxx"`<br>**verifyEmailRequest.Otp:** `"123456"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid register session |
| `UTCD-03` | A | **Precondition:** `IUserOptCacheRepository.GetAsync returns UserWithOpt with mismatched OTP`<br>**verifyEmailRequest.RegisterSession:** `"valid-guid-xxxx"`<br>**verifyEmailRequest.Otp:** `"999999"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid register session |
| `UTCD-04` | A | **Precondition:** `IUserRepository.CreateAsync returns null`<br>**verifyEmailRequest.RegisterSession:** `"valid-guid-xxxx"`<br>**verifyEmailRequest.Otp:** `"123456"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to save user to database |
| `UTCD-05` | A | **Precondition:** `IUserOptCacheRepository.GetAsync returns UserWithOpt with mismatched OTP`<br>**verifyEmailRequest.RegisterSession:** `"valid-guid-xxxx"`<br>**verifyEmailRequest.Otp:** `"654321 (wrong)"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid register session |


## F015 — SendForgotPasswordLinkAsync

**Function Code:** `F015`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 19  

**Test Requirement:** Unit test for Task<bool> SendForgotPasswordLinkAsync(ForgotPasswordRequest forgotPasswordRequest)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `IEmailService.SendEmailAsync succeeds`<br>**forgotPasswordRequest.Email:** `"user@test.com"` | **Confirm:** Returns true<br>**Exception:** Token saved to cache, email sent |
| `UTCD-02` | A | **Precondition:** `IUserRepository.FindByEmailAsync returns null`<br>**forgotPasswordRequest.Email:** `"nonexistent@test.com"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found |
| `UTCD-03` | A | **Precondition:** `IUserCacheRepository.SaveAsync returns false`<br>**forgotPasswordRequest.Email:** `"user@test.com"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to save user to cache |
| `UTCD-04` | N | **Precondition:** `IEmailService.SendEmailAsync throws Exception`<br>**forgotPasswordRequest.Email:** `"user@test.com"` | **Confirm:** Returns true (email non-critical)<br>**Exception:** Token saved to cache despite email failure |


## F016 — ResetPasswordAsync

**Function Code:** `F016`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 15  

**Test Requirement:** Unit test for Task<bool> ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `IUserRepository.UpdatePasswordAsync succeeds`<br>**resetPasswordRequest.Token:** `"newpass123"` | **Confirm:** Returns true<br>**Exception:** Password updated in DB |
| `UTCD-02` | A | **Precondition:** `IUserCacheRepository.GetAsync returns null`<br>**resetPasswordRequest.Token:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid token |
| `UTCD-03` | A | **Precondition:** `IUserRepository.UpdatePasswordAsync returns null`<br>**resetPasswordRequest.Token:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to update user password |


## F017 — GrantAccountAsync

**Function Code:** `F017`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 63  

**Test Requirement:** Unit test for Task<GrantAccountResponse> GrantAccountAsync(GrantAccountRequest grantAccountRequest)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `grantAccountRequest.Role is STUDENT or LECTURER`<br>**grantAccountRequest.Email:** `"student@fpt.edu.vn"`<br>**grantAccountRequest.Fullname:** `"Student Name"`<br>**grantAccountRequest.Role:** `"STUDENT"`<br>**grantAccountRequest.RoleNumber:** `"SE123456"` | **Return:** Returns GrantAccountResponse<br>**Exception:** TemporaryPassword != null (length=10, mixed chars), FirstLogin == true |
| `UTCD-02` | A | **Precondition:** `grantAccountRequest.Role is STUDENT or LECTURER`<br>**grantAccountRequest.Email:** `"lecturer@fpt.edu.vn"`<br>**grantAccountRequest.Fullname:** `"Lecturer"`<br>**grantAccountRequest.Role:** `"LECTURER"`<br>**grantAccountRequest.RoleNumber:** `"GV999999"` | **Return:** Returns GrantAccountResponse<br>**Exception:** TemporaryPassword != null, FirstLogin == true, Email sent |
| `UTCD-03` | A | **Precondition:** `grantAccountRequest.Role is ADMIN`<br>**grantAccountRequest.Email:** `"admin@test.com"`<br>**grantAccountRequest.Fullname:** `"Admin"`<br>**grantAccountRequest.Role:** `"ADMIN"`<br>**grantAccountRequest.RoleNumber:** `"AD000000"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Admin can only grant accounts to Lecturer or Student |
| `UTCD-04` | A | **Precondition:** `grantAccountRequest.Role is STUDENT or LECTURER`<br>**grantAccountRequest.Email:** `"existing@test.com"`<br>**grantAccountRequest.Fullname:** `"Existing"`<br>**grantAccountRequest.Role:** `"STUDENT"`<br>**grantAccountRequest.RoleNumber:** `"SE000000"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User with this email already exists |
| `UTCD-05` | A | **Precondition:** `grantAccountRequest.Role is STUDENT or LECTURER`<br>**grantAccountRequest.Email:** `"student@fpt.edu.vn"`<br>**grantAccountRequest.Fullname:** `"Student"`<br>**grantAccountRequest.Role:** `"STUDENT"`<br>**grantAccountRequest.RoleNumber:** `"SE000000"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to create user account |
| `UTCD-06` | B | **Precondition:** `grantAccountRequest.Role is STUDENT or LECTURER`<br>**grantAccountRequest.Email:** `"student@fpt.edu.vn"`<br>**grantAccountRequest.Fullname:** `"Student"`<br>**grantAccountRequest.Role:** `"STUDENT"`<br>**grantAccountRequest.RoleNumber:** `"SE000000"` | **Return:** Returns GrantAccountResponse (email non-critical)<br>**Exception:** TemporaryPassword returned despite email failure |
| `UTCD-07` | A | **Precondition:** `grantAccountRequest.Role is an invalid Role enum value`<br>**grantAccountRequest.Email:** `"student@fpt.edu.vn"`<br>**grantAccountRequest.Fullname:** `"Student"`<br>**grantAccountRequest.Role:** `"INVALID_ROLE"`<br>**grantAccountRequest.RoleNumber:** `"SE000000"` | **Exception:** ArgumentException<br>**Log:** ArgumentException (Role enum parse fail) |


## F018 — ResetFirstLoginPasswordAsync

**Function Code:** `F018`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 29  

**Test Requirement:** Unit test for Task<bool> ResetFirstLoginPasswordAsync(ResetFirstLoginPasswordRequest resetFirstLoginRequest)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `IUserRepository.UpdatePasswordAndFirstLoginAsync succeeds`<br>**resetFirstLoginRequest.Email:** `"newpass123"` | **Confirm:** Returns true<br>**Exception:** Password updated, FirstLogin set to false |
| `UTCD-02` | A | **Precondition:** `IUserRepository.FindByEmailAsync returns null`<br>**resetFirstLoginRequest.Email:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found |
| `UTCD-03` | A | **Precondition:** `user.FirstLogin == false`<br>**resetFirstLoginRequest.Email:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: This endpoint is only for users on first login |
| `UTCD-04` | A | **Precondition:** `IUserRepository.UpdatePasswordAndFirstLoginAsync returns null`<br>**resetFirstLoginRequest.Email:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to reset password |


## F019 — ChangePasswordAsync

**Function Code:** `F019`  
**Created By:** Nguyễn Tiến Thuận  
**Executed By:** Nguyễn Tiến Thuận  
**Lines of Code:** 47  

**Test Requirement:** Unit test for Task<bool> ChangePasswordAsync(string accessToken, ChangePasswordRequest changePasswordRequest)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `IUserRepository.UpdatePasswordByIdAsync succeeds`<br>**accessToken:** `validJWT`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"newpass123"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass123"` | **Return:** Returns true<br>**Exception:** Password updated, LogInformation: User u1 changed their password |
| `UTCD-02` | A | **Precondition:** `JwtUtil.VerifyAsync throws exception`<br>**accessToken:** `"invalid.token"`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"newpass123"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass123"` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-03` | A | **Precondition:** `IUserRepository.FindByIdAsync returns null`<br>**accessToken:** `validJWT_of_deleted_user`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"newpass123"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found |
| `UTCD-04` | A | **Precondition:** `Password length is between 5 and 64 characters`<br>**accessToken:** `validJWT`<br>**changePasswordRequest.CurrentPassword:** `"wrongpass"`<br>**changePasswordRequest.NewPassword:** `"newpass123"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Current password is incorrect |
| `UTCD-05` | A | **Precondition:** `NewPassword != ConfirmPassword`<br>**accessToken:** `validJWT`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"newpass1"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass2"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: New password and confirm password do not match |
| `UTCD-06` | A | **Precondition:** `Password length is less than 5 characters`<br>**accessToken:** `validJWT`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"abc" (len=3)`<br>**changePasswordRequest.ConfirmPassword:** `"abc"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: New password must be between 5 and 64 characters |
| `UTCD-07` | A | **Precondition:** `Password length is greater than 64 characters`<br>**accessToken:** `validJWT`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"a"*65 (len=65)`<br>**changePasswordRequest.ConfirmPassword:** `"a"*65` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: New password must be between 5 and 64 characters |
| `UTCD-08` | A | **Precondition:** `IUserRepository.UpdatePasswordByIdAsync returns null`<br>**accessToken:** `validJWT`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"newpass123"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to update password |
| `UTCD-09` | A | **Precondition:** `IUserRepository.FindByIdAsync returns User with IsEnable=false`<br>**accessToken:** `validJWT_of_disabled_user`<br>**changePasswordRequest.CurrentPassword:** `"oldpass"`<br>**changePasswordRequest.NewPassword:** `"newpass123"`<br>**changePasswordRequest.ConfirmPassword:** `"newpass123"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found |


## F020 — UpdateUserAsync

**Function Code:** `F020`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 17  

**Test Requirement:** Unit test for Task<UserProfileResponse> UpdateUserAsync(string userId, string? fullname, string? roleNumber, Role? role, bool? isEnable)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `"u1"`<br>**fullname:** `"New Name"`<br>**roleNumber:** `"SE999999"`<br>**role:** `Role.LECTURER`<br>**isEnable:** `true` | **Confirm:** Returns UserProfileResponse<br>**Exception:** Fullname==New Name, RoleNumber==SE999999, Role==LECTURER, IsEnable==true |
| `UTCD-02` | A | **Precondition:** `"u1"`<br>**fullname:** `null`<br>**roleNumber:** `null`<br>**role:** `null`<br>**isEnable:** `null` | **Confirm:** Returns UserProfileResponse<br>**Exception:** Fields unchanged (null = no update) |
| `UTCD-03` | A | **Precondition:** `"u1"`<br>**fullname:** `"Name"`<br>**roleNumber:** `"SE000000"`<br>**role:** `Role.STUDENT`<br>**isEnable:** `false` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to update user |


## F021 — UpdateProfileAsync

**Function Code:** `F021`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 19  

**Test Requirement:** Unit test for Task<UserProfileResponse> UpdateProfileAsync(string accessToken, string? fullname, DateTime? birthday, string? avatarUrl)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | B | **Precondition:** `IUserRepository.UpdateProfileAsync succeeds`<br>**accessToken:** `validJWT`<br>**fullname:** `"New Name"`<br>**birthday:** `DateTime(1990,1,1)`<br>**avatarUrl:** `"https://example.com/avatar.png"` | **Return:** Returns UserProfileResponse<br>**Exception:** Fullname, Birthday, AvatarUrl updated |
| `UTCD-02` | A | **Precondition:** `JwtUtil.VerifyAsync throws exception`<br>**accessToken:** `"invalid.token"`<br>**fullname:** `"Name"`<br>**birthday:** `null`<br>**avatarUrl:** `null` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-03` | A | **Precondition:** `IUserRepository.FindByIdAsync returns User with IsEnable=false`<br>**accessToken:** `validJWT_of_disabled_user`<br>**fullname:** `"Name"`<br>**birthday:** `null`<br>**avatarUrl:** `null` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found or inactive |
| `UTCD-04` | A | **Precondition:** `IUserRepository.UpdateProfileAsync returns null`<br>**accessToken:** `validJWT`<br>**fullname:** `"Name"`<br>**birthday:** `null`<br>**avatarUrl:** `null` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Failed to update profile |
| `UTCD-05` | A | **Precondition:** `IUserRepository.UpdateProfileAsync succeeds`<br>**accessToken:** `validJWT`<br>**fullname:** `null`<br>**birthday:** `DateTime(2000,12,31)`<br>**avatarUrl:** `null` | **Return:** Returns UserProfileResponse<br>**Exception:** Birthday updated, Fullname unchanged |


## F022 — AuthenticateAsync

**Function Code:** `F022`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 47  

**Test Requirement:** Unit test for Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `JwtUtil available`<br>**credentials.Email:** `"user@test.com"`<br>**credentials.Password:** `"correctpass"` | **Confirm:** Returns AuthResponse<br>**Exception:** AccessToken != null, RefreshToken != null, FirstLogin == false |
| `UTCD-02` | A | **Precondition:** `IUserRepository.FindByEmailAsync returns null`<br>**credentials.Email:** `"nonexistent@test.com"`<br>**credentials.Password:** `"pass"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid email or password |
| `UTCD-03` | A | **Precondition:** `JwtUtil available`<br>**credentials.Email:** `"user@test.com"`<br>**credentials.Password:** `"wrongpass"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid email or password |
| `UTCD-04` | A | **Precondition:** `JwtUtil available`<br>**credentials.Email:** `"disabled@test.com"`<br>**credentials.Password:** `"pass"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User is forbidden |
| `UTCD-05` | N | **Precondition:** `JwtUtil available`<br>**credentials.Email:** `"firstlogin@test.com"`<br>**credentials.Password:** `"pass"` | **Confirm:** Returns AuthResponse<br>**Exception:** FirstLogin == true |


## F023 — AuthenticateWithGoogleAsync

**Function Code:** `F023`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 52  

**Test Requirement:** Unit test for Task<AuthResponse> AuthenticateWithGoogleAsync(string idToken)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `User.IsEnable == true`<br>**idToken:** `validGoogleToken` | **Return:** Returns AuthResponse<br>**Exception:** AccessToken != null, RefreshToken != null |
| `UTCD-02` | A | **Precondition:** `IUserRepository.FindByEmailAsync returns null`<br>**idToken:** `validGoogleToken` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found with this email |
| `UTCD-03` | A | **Precondition:** `User.IsEnable == true`<br>**idToken:** `validGoogleToken` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User is forbidden |
| `UTCD-04` | A | **Precondition:** `User.IsEnable == true`<br>**idToken:** `validGoogleToken` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Google ID does not match this account |
| `UTCD-05` | N | **Precondition:** `UpdateGoogleIdAsync succeeds`<br>**idToken:** `validGoogleToken` | **Return:** Returns AuthResponse<br>**Exception:** UpdateGoogleIdAsync called with gid123 |
| `UTCD-06` | A | **Precondition:** `GoogleTokenVerifier.VerifyTokenAsync throws exception`<br>**idToken:** `"invalid.google.token"` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: Invalid Google token |


## F024 — GetProfileAsync

**Function Code:** `F024`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 21  

**Test Requirement:** Unit test for Task<UserProfileResponse> GetProfileAsync(string accessToken)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `User.IsEnable == true`<br>**accessToken:** `validJWT` | **Confirm:** Returns UserProfileResponse<br>**Exception:** Id==u1, IsEnable==true |
| `UTCD-02` | A | **Precondition:** `JwtUtil.VerifyAsync throws exception`<br>**accessToken:** `"invalid.token"` | **Exception:** SecurityTokenException<br>**Log:** SecurityTokenException |
| `UTCD-03` | A | **Precondition:** `IUserRepository.FindByIdAsync returns null`<br>**accessToken:** `validJWT_of_deleted_user` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found or inactive |
| `UTCD-04` | A | **Precondition:** `User.IsEnable == false`<br>**accessToken:** `validJWT_of_disabled_user` | **Exception:** InvalidOperationException<br>**Log:** InvalidOperationException: User not found or inactive |


## F025 — GetAllUsersAsync

**Function Code:** `F025`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 13  

**Test Requirement:** Unit test for Task<List<UserProfileResponse>> GetAllUsersAsync()

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | N | **Precondition:** `IUserRepository.FindAllAsync returns list` | **Confirm:** Returns List<UserProfileResponse><br>**Exception:** Count == 3 |
| `UTCD-02` | B | **Precondition:** `IUserRepository.FindAllAsync returns empty list` | **Confirm:** Returns List<UserProfileResponse><br>**Exception:** Count == 0 |


## F026 — GetPagedUsersAsync

**Function Code:** `F026`  
**Created By:** Trần Chí Tâm  
**Executed By:** Trần Chí Tâm  
**Lines of Code:** 14  

**Test Requirement:** Unit test for Task<PagedResult<UserProfileResponse>> GetPagedUsersAsync(int pageIndex, int pageSize, string? searchTerm = null, string? role = null, bool? isEnable = null)

### Test Cases

| # | Type | Test Description | Expected Result |
|---|---|---|---|
| `UTCD-01` | A | **Precondition:** `page returns data`<br>**pageIndex:** `10`<br>**searchTerm:** `null`<br>**role:** `null`<br>**isEnable:** `null` | **Return:** Returns PagedResult<br>**Exception:** Items.Count == 10, TotalCount == 25 |
| `UTCD-02` | A | **Precondition:** `page returns data`<br>**pageIndex:** `10`<br>**searchTerm:** `"@fpt.edu.vn"`<br>**role:** `null`<br>**isEnable:** `null` | **Return:** Returns PagedResult<br>**Exception:** All users have email containing @fpt.edu.vn |
| `UTCD-03` | A | **Precondition:** `page returns data`<br>**pageIndex:** `10`<br>**searchTerm:** `null`<br>**role:** `"STUDENT"`<br>**isEnable:** `null` | **Return:** Returns PagedResult<br>**Exception:** All users have Role==STUDENT |
| `UTCD-04` | A | **Precondition:** `page returns data`<br>**pageIndex:** `10`<br>**searchTerm:** `null`<br>**role:** `null`<br>**isEnable:** `false` | **Return:** Returns PagedResult<br>**Exception:** All users have IsEnable==false |
| `UTCD-05` | A | **Precondition:** `page returns no data (beyond results)`<br>**pageIndex:** `10`<br>**searchTerm:** `"xyznotexist999"`<br>**role:** `null`<br>**isEnable:** `null` | **Return:** Returns PagedResult<br>**Exception:** Items == [], TotalCount == 0 |
| `UTCD-06` | A | **Precondition:** `page returns data`<br>**pageIndex:** `10`<br>**searchTerm:** `null`<br>**role:** `null`<br>**isEnable:** `null` | **Return:** Returns PagedResult<br>**Exception:** Items.Count == 5, TotalCount == 25 |

