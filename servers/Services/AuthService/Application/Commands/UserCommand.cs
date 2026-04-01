using AuthService.Application.Mappers;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Models;
using AuthService.Repositories.User;
using AuthService.Web.Requests;
using AuthService.Application.Notifications;

namespace AuthService.Application.Commands;

public interface IUserCommand
{
    public Task<AuthResponse> CreateUserAsync(RegisterData registerData);

    public Task<string> RegisterWithEmailVerificationAsync(RegisterData registerData);

    public Task<bool> VerifyEmailAsync(VerifyEmailRequest verifyEmailRequest);

    public Task<bool> SendForgotPasswordLinkAsync(ForgotPasswordRequest forgotPasswordRequest);

    public Task<bool> ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest);

    public Task<GrantAccountResponse> GrantAccountAsync(GrantAccountRequest grantAccountRequest);

    public Task<bool> ResetFirstLoginPasswordAsync(ResetFirstLoginPasswordRequest resetFirstLoginRequest);
    
    public Task<UserProfileResponse> UpdateUserAsync(string userId, string? fullname, string? roleNumber, Role? role, bool? isEnable);

    public Task<UserProfileResponse> UpdateProfileAsync(string accessToken, string? fullname, DateTime? birthday, string? avatarUrl);
}

public class UserCommand : IUserCommand
{
    private readonly IUserRepository _userRepository;
    private readonly IUserOptCacheRepository _userOptCacheRepository;
    private readonly IUserCacheRepository _userCacheRepository;
    private readonly IConfiguration _configuration;
    private readonly JwtUtil _jwtUtil;
    private readonly UserMapper _userMapper;
    private readonly ILogger<UserCommand> _logger;
    private readonly IEmailService _emailService;

    public UserCommand(
         IUserRepository userRepository,
         IConfiguration configuration,
         UserMapper userMapper,
         JwtUtil jwtUtil,
         ILogger<UserCommand> logger,
         IUserOptCacheRepository userOptCacheRepository,
         IUserCacheRepository userCacheRepository,
         IEmailService emailService
    )
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _userMapper = userMapper;
        _jwtUtil = jwtUtil;
        _logger = logger;
        _userOptCacheRepository = userOptCacheRepository;
        _userCacheRepository = userCacheRepository;
        _emailService = emailService;
    }

    public async Task<AuthResponse> CreateUserAsync(RegisterData registerData)
    {
        var existingUser = await _userRepository.FindByEmailAsync(registerData.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var user = new User
        {
            Email = registerData.Email,
            RoleNumber = registerData.RoleNumber,
            Fullname = registerData.Fullname,
            Password = registerData.Password,
            Role = Enum.Parse<Role>(registerData.Role)
        };
        var createdUser = await _userRepository.CreateAsync(user);

        if (createdUser != null)
        {
            var tokenPayload = new JwtPayload()
            {
                Id = createdUser.Id,
                Email = createdUser.Email,
                Role = createdUser.Role.ToString()
            };

            var accessToken = _jwtUtil.GenerateAccessToken(tokenPayload);
            var refreshToken = _jwtUtil.GenerateRefreshToken(tokenPayload);

            return new AuthResponse
            {
                UserProfile = _userMapper.ToUserResponse(createdUser),
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                FirstLogin = createdUser.FirstLogin ?? false
            };
        }

        throw new InvalidOperationException("An error occurred while creating the account");
    }


    public async Task<string> RegisterWithEmailVerificationAsync(RegisterData registerData)
    {
        var existingUser = await _userRepository.FindByEmailAsync(registerData.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var opt = OptGenerator.GenerateOpt();
        var user = new UserWithOpt
        {
            Email = registerData.Email,
            RoleNumber = registerData.RoleNumber,
            Fullname = registerData.Fullname,
            Password = registerData.Password,
            Role = Enum.Parse<Role>(registerData.Role),
            Opt = opt
        };
        //cache
        var registerSession = Guid.NewGuid().ToString();
        var cachingTime = TimeSpan.FromMinutes(5);
        var isSaved = await _userOptCacheRepository.SaveAsync(registerSession, user, cachingTime);
        if (!isSaved)
        {
            throw new InvalidOperationException("Failed to save user to cache");
        }
        // send otp to email
        await _emailService.SendEmailAsync(registerData.Email, opt, "", EmailService.EmailOptTemplate);

        return registerSession;
    }

    public async Task<bool> VerifyEmailAsync(VerifyEmailRequest verifyEmailRequest)
    {
        var user = await _userOptCacheRepository.GetAsync(verifyEmailRequest.RegisterSession);
        if (user == null)
        {
            throw new InvalidOperationException("Invalid register session");
        }
        var isVerified = user.Opt == verifyEmailRequest.Opt;
        if (isVerified)
        {
            await _userOptCacheRepository.DeleteAsync(verifyEmailRequest.RegisterSession);
            // map user to user model
            var userModel = _userMapper.ToUser(user);
            // save user to db
            var createdUser = await _userRepository.CreateAsync(userModel);

            if (createdUser == null)
                throw new InvalidOperationException("Failed to save user to database");
        }
        return true;
    }

    public async Task<bool> SendForgotPasswordLinkAsync(ForgotPasswordRequest forgotPasswordRequest)
    {
        var user = await _userRepository.FindByEmailAsync(forgotPasswordRequest.Email);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }
        var uuidToken = Guid.NewGuid().ToString();
        var cachingTime = TimeSpan.FromMinutes(5);
        var isSaved = await _userCacheRepository.SaveAsync(uuidToken, user, cachingTime);
        if (!isSaved)
        {
            throw new InvalidOperationException("Failed to save user to cache");
        }
        var frontendUrl = _configuration["FrontendUrl"];
        var resetPasswordUrl = $"{frontendUrl}/forgot-password/reset?token={uuidToken}";
        await _emailService.SendEmailAsync(user.Email, "Reset Password", resetPasswordUrl, EmailService.EmailPasswordResetTemplate);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest resetPasswordRequest)
    {
        var user = await _userCacheRepository.GetAsync(resetPasswordRequest.Token);
        if (user == null)
        {
            throw new InvalidOperationException("Invalid token");
        }
        user.Password = resetPasswordRequest.NewPassword;
        var updatedUser = await _userRepository.UpdatePasswordAsync(user);
        if (updatedUser == null)
        {
            throw new InvalidOperationException("Failed to update user password");
        }
        return true;
    }

    /// <summary>
    /// Grant an account to a user (email-based)
    /// Only Admin can grant accounts to Lecturer and Student
    /// </summary>
    public async Task<GrantAccountResponse> GrantAccountAsync(GrantAccountRequest grantAccountRequest)
    {
        var targetRole = Enum.Parse<Role>(grantAccountRequest.Role);
        if (targetRole != Role.LECTURER && targetRole != Role.STUDENT)
        {
            throw new InvalidOperationException("Admin can only grant accounts to Lecturer or Student");
        }

        // Check if user already exists
        var existingUser = await _userRepository.FindByEmailAsync(grantAccountRequest.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        // Generate temporary password
        var temporaryPassword = GenerateTemporaryPassword();

        // Create new user with FirstLogin = true
        var newUser = new User
        {
            Email = grantAccountRequest.Email,
            RoleNumber = grantAccountRequest.RoleNumber,
            Fullname = grantAccountRequest.Fullname,
            Password = temporaryPassword,
            Role = targetRole,
            FirstLogin = true,
        };

        var createdUser = await _userRepository.CreateAsync(newUser);
        if (createdUser == null)
        {
            throw new InvalidOperationException("Failed to create user account");
        }

        // Prepare email with login credentials
        var emailSubject = "Your Account Credentials";
        var emailBody = GenerateGrantAccountEmailBody(
            createdUser.Email,
            temporaryPassword,
            createdUser.Fullname,
            createdUser.Role.ToString()
        );

        // Send email with credentials
        await _emailService.SendEmailAsync(
            createdUser.Email,
            emailSubject,
            emailBody,
            EmailService.EmailBodyOnlyTemplate
        );

        return new GrantAccountResponse
        {
            UserId = createdUser.Id,
            Email = createdUser.Email,
            Fullname = createdUser.Fullname,
            Role = createdUser.Role.ToString(),
            TemporaryPassword = temporaryPassword,
            FirstLogin = true,
            // Message = $"Account created and credentials sent to {createdUser.Email}"
        };
    }
    
    private static string GenerateGrantAccountEmailBody(string email, string temporaryPassword, string fullname, string role)
    {
        return string.Format(EmailService.EmailGrantAccountTemplate, email, temporaryPassword, fullname, role);
    }

    /// <summary>
    /// Reset password after first login (when FirstLogin = true)
    /// </summary>
    public async Task<bool> ResetFirstLoginPasswordAsync(ResetFirstLoginPasswordRequest resetFirstLoginRequest)
    {
        // Find user by email
        var user = await _userRepository.FindByEmailAsync(resetFirstLoginRequest.Email);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // Check if FirstLogin is true
        if (user.FirstLogin != true)
        {
            throw new InvalidOperationException("This endpoint is only for users on first login");
        }

        // Update password and set FirstLogin to false
        var updatedUser = await _userRepository.UpdatePasswordAndFirstLoginAsync(
            user.Id,
            resetFirstLoginRequest.NewPassword,
            false
        );

        if (updatedUser == null)
        {
            throw new InvalidOperationException("Failed to reset password");
        }

        return true;
    }

    /// <summary>
    /// Generate a temporary password (8 characters, mix of upper, lower, digits, and special chars)
    /// </summary>
    private string GenerateTemporaryPassword()
    {
        const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lowercase = "abcdefghijklmnopqrstuvwxyz";
        const string digits = "0123456789";
        const string specialChars = "!@#$%^&*";

        var random = new Random();
        var password = new System.Text.StringBuilder();

        // Ensure at least one character from each category
        password.Append(uppercase[random.Next(uppercase.Length)]);
        password.Append(lowercase[random.Next(lowercase.Length)]);
        password.Append(digits[random.Next(digits.Length)]);
        password.Append(specialChars[random.Next(specialChars.Length)]);

        // Fill the rest with random characters from all categories
        string allChars = uppercase + lowercase + digits + specialChars;
        for (int i = password.Length; i < 10; i++)
        {
            password.Append(allChars[random.Next(allChars.Length)]);
        }

        // Shuffle the password
        var passwordArray = password.ToString().ToCharArray();
        for (int i = passwordArray.Length - 1; i > 0; i--)
        {
            int randomIndex = random.Next(i + 1);
            (passwordArray[i], passwordArray[randomIndex]) = (passwordArray[randomIndex], passwordArray[i]);
        }

        return new string(passwordArray);
    }

    public async Task<UserProfileResponse> UpdateUserAsync(string userId, string? fullname, string? roleNumber, Role? role, bool? isEnable)
    {
        try
        {
            var updatedUser = await _userRepository.UpdateUserAsync(userId, fullname, roleNumber, role, isEnable);
            if (updatedUser == null)
            {
                throw new InvalidOperationException("Failed to update user");
            }
            return _userMapper.ToUserResponse(updatedUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user");
            throw;
        }
    }

    public async Task<UserProfileResponse> UpdateProfileAsync(string accessToken, string? fullname, DateTime? birthday, string? avatarUrl)
    {
        try
        {
            var decoded = await _jwtUtil.VerifyAsync(accessToken);
            var userId = decoded.Id;
            var updatedUser = await _userRepository.UpdateProfileAsync(userId, fullname, birthday, avatarUrl);
            if (updatedUser == null)
            {
                throw new InvalidOperationException("Failed to update profile");
            }
            return _userMapper.ToUserResponse(updatedUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile");
            throw;
        }
    }

}