namespace AuthService.Application.Utils;

public class OptGenerator
{
    public static string GenerateOpt(int length = 6)
    {
        return new string(Enumerable.Repeat("0123456789", length).Select(s => s[Random.Shared.Next(s.Length)]).ToArray());
    }
}