namespace AuthService.Application.ResponseDTOs;

public class CheckEmailExistsResponse
{
    public bool Exists { get; set; }
    public string? Message { get; set; }
}
