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
}

public class UserCommand : IUserCommand
{
    private readonly IUserRepository _userRepository;
    private readonly IUserOptCacheRepository _userOptCacheRepository;
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
         IEmailService emailService
    )
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _userMapper = userMapper;
        _jwtUtil = jwtUtil;
        _logger = logger;
        _userOptCacheRepository = userOptCacheRepository;
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
                RefreshToken = refreshToken
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

}
