using AuthService.Application.Mappers;
using AuthService.Application.ResponseDTOs;
using AuthService.Application.Utils;
using AuthService.Models;
using AuthService.Repositories.User;
using AuthService.Web.Requests;

namespace AuthService.Application.Queries;

public interface IUserQuery
{
    public Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials);
    public Task<AuthResponse> AuthenticateWithGoogleAsync(string idToken);
    public Task<UserProfileResponse> GetProfileAsync(string accessToken);
    public Task<List<UserProfileResponse>> GetAllUsersAsync();
    public Task<PagedResult<UserProfileResponse>> GetPagedUsersAsync(int pageIndex, int pageSize, string? searchTerm = null, string? role = null, bool? isEnable = null);
}

public class UserQuery : IUserQuery
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly JwtUtil _jwtUtil;
    private readonly UserMapper _userMapper;
    private readonly GoogleTokenVerifier _googleTokenVerifier;
    private readonly ILogger<UserQuery> _logger;
    
    public UserQuery(
        IUserRepository userRepository,
        IConfiguration configuration,
        UserMapper userMapper,
        JwtUtil jwtUtil,
        GoogleTokenVerifier googleTokenVerifier,
        ILogger<UserQuery> logger
    ) {
        _userRepository = userRepository;
        _configuration = configuration;
        _userMapper = userMapper;
        _jwtUtil = jwtUtil;
        _googleTokenVerifier = googleTokenVerifier;
        _logger = logger;
    }
    
    public async Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials)
    {
        try
        {
            var user = await _userRepository.FindByEmailAsync(credentials.Email);

            if (user == null)
            {
                throw new InvalidOperationException("Invalid email or password");
            }

            if (!user.IsEnable)
            {
                throw new InvalidOperationException("User is forbidden");
            }

            var isPasswordValid = HashingUtil.VerifyHash(credentials.Password, user.Password, _configuration);

            if (!isPasswordValid)
            {
                throw new InvalidOperationException("Invalid email or password");
            }

            var tokenPayload = new JwtPayload
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role.ToString()
            };

            var accessToken = _jwtUtil.GenerateAccessToken(tokenPayload);
            var refreshToken = _jwtUtil.GenerateRefreshToken(tokenPayload);

            return new AuthResponse
            {
                UserProfile = _userMapper.ToUserResponse(user),
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                FirstLogin = user.FirstLogin ?? false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error authenticating user");
            throw;
        }
    }

    public async Task<AuthResponse> AuthenticateWithGoogleAsync(string idToken)
    {
        try
        {
            var googlePayload = await _googleTokenVerifier.VerifyTokenAsync(idToken);
            var user = await _userRepository.FindByEmailAsync(googlePayload.Email);

            if (user == null)
            {
                throw new InvalidOperationException("User not found with this email");
            }

            if (!user.IsEnable)
            {
                throw new InvalidOperationException("User is forbidden");
            }

            // Verify googleId - if empty, save it
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user = await _userRepository.UpdateGoogleIdAsync(user.Id, googlePayload.GoogleId);
            }
            else if (user.GoogleId != googlePayload.GoogleId)
            {
                throw new InvalidOperationException("Google ID does not match this account");
            }

            var tokenPayload = new JwtPayload
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role.ToString()
            };

            var accessToken = _jwtUtil.GenerateAccessToken(tokenPayload);
            var refreshToken = _jwtUtil.GenerateRefreshToken(tokenPayload);
            user.LastLoginDate = DateTime.UtcNow;

            return new AuthResponse
            {
                UserProfile = _userMapper.ToUserResponse(user),
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                FirstLogin = user.FirstLogin ?? false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error authenticating user with Google");
            throw;
        }
    }
    
    public async Task<UserProfileResponse> GetProfileAsync(string accessToken)
    {
        try
        {
            var decoded = await _jwtUtil.VerifyAsync(accessToken);
            var userId = decoded.Id;
            var user = await _userRepository.FindByIdAsync(userId);
                
            if (user == null || !user.IsEnable)
            {
                throw new InvalidOperationException("User not found or inactive");
            }
                
            return _userMapper.ToUserResponse(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            throw;
        }
    }
    
    public async Task<List<UserProfileResponse>> GetAllUsersAsync()
    {
        try
        {
            var users = await _userRepository.FindAllAsync();
            return users.Select(user => _userMapper.ToUserResponse(user)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            throw;
        }
    }

    public async Task<PagedResult<UserProfileResponse>> GetPagedUsersAsync(int pageIndex, int pageSize, string? searchTerm = null, string? role = null, bool? isEnable = null)
    {
        try
        {
            var (items, totalCount) = await _userRepository.FindPagedAsync(pageIndex, pageSize, searchTerm, role, isEnable);
            var mappedItems = items.Select(user => _userMapper.ToUserResponse(user)).ToList();
            return new PagedResult<UserProfileResponse>(mappedItems, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged users");
            throw;
        }
    }
}