using AuthService.Application.ResponseDTOs;
using AuthService.Repositories.User;

namespace AuthService.Application.Mappers;

public class UserMapper
{
    public UserProfileResponse ToUserResponse(Models.User user)
    {
        return new UserProfileResponse
        {
            Id = user.Id,
            RoleNumber = user.RoleNumber.ToString(),
            Email = user.Email,
            Fullname = user.Fullname,
            AvatarUrl = user.AvatarUrl,
            Birthday = user.Birthday,
            Role = user.Role.ToString(),
            IsEnable = user.IsEnable,
            LastLoginDate = user.LastLoginDate,
            CreatedDate = user.CreatedDate,
            UpdatedDate = user.UpdatedDate
        };
    }

    public Models.User ToUser(UserWithOpt user)
    {
        return new Models.User
        {
            Email = user.Email,
            RoleNumber = user.RoleNumber,
            Password = user.Password,
            Fullname = user.Fullname,
            Role = user.Role
        };
    }
}