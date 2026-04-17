using System.Net;
using System.Net.Mail;

namespace AcasService.Application.Thirdparty;

public class SmtpEmailConfig
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
    public bool UseDefaultCredentials { get; set; } = false;
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task SendEmailAsync(IEnumerable<string> toAddresses, string subject, string htmlBody, CancellationToken cancellationToken = default);
}

public class EmailService : IEmailService
{
    private readonly SmtpEmailConfig _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(SmtpEmailConfig config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        await SendEmailAsync(new[] { to }, subject, htmlBody, cancellationToken);
    }

    public async Task SendEmailAsync(IEnumerable<string> toAddresses, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var addressList = toAddresses.Where(a => !string.IsNullOrWhiteSpace(a)).ToList();
        if (addressList.Count == 0)
        {
            _logger.LogWarning("No valid recipients provided for email: {Subject}", subject);
            return;
        }

        using var mailMessage = new MailMessage
        {
            From = new MailAddress(_config.FromAddress, _config.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        foreach (var address in addressList)
        {
            mailMessage.To.Add(address);
        }

        using var smtpClient = new SmtpClient(_config.Host, _config.Port)
        {
            EnableSsl = _config.EnableSsl,
            UseDefaultCredentials = _config.UseDefaultCredentials,
            Credentials = new NetworkCredential(_config.Username, _config.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 30000
        };

        try
        {
            _logger.LogInformation(
                "Sending email: Subject={Subject}, To={ToCount} recipients",
                subject,
                addressList.Count);

            await smtpClient.SendMailAsync(mailMessage, cancellationToken);

            _logger.LogInformation(
                "Email sent successfully: Subject={Subject}, To={Recipients}",
                subject,
                string.Join(", ", addressList));
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex,
                "SMTP error while sending email: Subject={Subject}, Error={Error}",
                subject,
                ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unexpected error while sending email: Subject={Subject}, Error={Error}",
                subject,
                ex.Message);
            throw;
        }
    }
}
