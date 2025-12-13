using AuthService.Application.Mappers;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Models;
using AuthService.Repositories.User;
using AuthService.Web.Requests;

namespace AuthService.Application.Commands;

public interface IUserCommand
{
    public Task<AuthResponse> CreateUserAsync(RegisterData registerData);
}

public class UserCommand : IUserCommand
{
   private readonly IUserRepository _userRepository;
   private readonly IConfiguration _configuration;
   private readonly JwtUtil _jwtUtil;
   private readonly UserMapper _userMapper;
   private readonly ILogger<UserCommand> _logger;
   
   public UserCommand(
        IUserRepository userRepository,
        IConfiguration configuration,
        UserMapper userMapper,
        JwtUtil jwtUtil,
        ILogger<UserCommand> logger
   ) {
       _userRepository = userRepository;
       _configuration = configuration;
       _userMapper = userMapper;
       _jwtUtil = jwtUtil;
       _logger = logger;
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
}