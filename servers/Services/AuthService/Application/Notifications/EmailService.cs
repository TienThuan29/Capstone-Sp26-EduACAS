using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit.Text;
using MimeKit;

namespace AuthService.Application.Notifications;

public interface IEmailService
{
      Task SendEmailAsync(string toEmail, string subject, string body, string template);
      Task SendEmailAsync(string toEmail, string subject, string url, string expiry, string template);
}

public class EmailService : IEmailService
{
      private readonly EmailSettings _emailSettings;

      private readonly ILogger<EmailService> _logger;

      public EmailService(ILogger<EmailService> logger, IOptions<EmailSettings> emailSettings)
      {
            _logger = logger;
            _emailSettings = emailSettings.Value;
      }

      public async Task SendEmailAsync(string toEmail, string subject, string body, string template)
      {
            var message = this.BuildMessage(toEmail, subject, body, template);

            using var client = new SmtpClient();
            try
            {
                  await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, _emailSettings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
                  if (!string.IsNullOrEmpty(_emailSettings.User))
                        await client.AuthenticateAsync(_emailSettings.User, _emailSettings.Password);

                  await client.SendAsync(message);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                  throw;
            }
            finally
            {
                  await client.DisconnectAsync(true);
            }
      }

      public async Task SendEmailAsync(string toEmail, string subject, string url, string expiry, string template)
      {
            var message = this.BuildPasswordResetMessage(toEmail, subject, url, expiry, template);

            using var client = new SmtpClient();
            try
            {
                  await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, _emailSettings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
                  if (!string.IsNullOrEmpty(_emailSettings.User))
                        await client.AuthenticateAsync(_emailSettings.User, _emailSettings.Password);

                  await client.SendAsync(message);
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                  throw;
            }
            finally
            {
                  await client.DisconnectAsync(true);
            }
      }

      private MimeMessage BuildMessage(string toEmail, string subject, string body, string template)
      {
            var msg = new MimeMessage();
            msg.From.Add(MailboxAddress.Parse(string.IsNullOrWhiteSpace(_emailSettings.From) ? _emailSettings.User : _emailSettings.From));
            msg.To.Add(MailboxAddress.Parse(toEmail));
            msg.Subject = subject;

            var htmlBody = string.Format(template, subject, body);
            msg.Body = new TextPart(TextFormat.Html) { Text = htmlBody };
            return msg;
      }

      private MimeMessage BuildPasswordResetMessage(string toEmail, string subject, string url, string expiry, string template)
      {
            var msg = new MimeMessage();
            msg.From.Add(MailboxAddress.Parse(string.IsNullOrWhiteSpace(_emailSettings.From) ? _emailSettings.User : _emailSettings.From));
            msg.To.Add(MailboxAddress.Parse(toEmail));
            msg.Subject = subject;

            var htmlBody = string.Format(template, url, expiry);
            msg.Body = new TextPart(TextFormat.Html) { Text = htmlBody };
            return msg;
      }

      public static string EmailHtmlTemplate = @"<!DOCTYPE html>
            <html>
            <head>
            <meta charset=""UTF-8"" />
            <style>
                  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 24px; }}
                  .card {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 28px 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }}
                  .title {{ font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px; }}
                  .subtitle {{ font-size: 14px; color: #6b7280; margin: 0 0 20px; }}
                  .body {{ font-size: 15px; line-height: 1.6; color: #1f2937; }}
                  .footer {{ font-size: 12px; color: #9ca3af; margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 12px; }}
                  a.button {{ display: inline-block; margin-top: 16px; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; }}
            </style>
            </head>
            <body>
            <div class=""card"">
                  <div class=""title"">{0}</div>
                  <div class=""subtitle"">A quick update from EduACAS</div>
                  <div class=""body"">
                  {1}
                  </div>
                  <div class=""footer"">
                  If you didn’t request this, you can ignore this email.
                  </div>
            </div>
            </body>
            </html>";
      
      public static string EmailOptTemplate = @"<!DOCTYPE html>
            <html>
            <head>
            <meta charset=""UTF-8"" />
            <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
            <style>
                  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 24px; }}
                  .card {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }}
                  .title {{ font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px; text-align: center; }}
                  .subtitle {{ font-size: 15px; color: #6b7280; margin: 0 0 32px; text-align: center; }}
                  .message {{ font-size: 15px; line-height: 1.6; color: #1f2937; margin: 0 0 28px; text-align: center; }}
                  .otp-container {{ background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; }}
                  .otp-label {{ font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; font-weight: 600; }}
                  .otp-code {{ font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace; }}
                  .expiry {{ font-size: 13px; color: #9ca3af; text-align: center; margin: 20px 0 0; }}
                  .warning {{ font-size: 13px; color: #dc2626; text-align: center; margin: 24px 0 0; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 3px solid #dc2626; }}
                  .footer {{ font-size: 12px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; line-height: 1.5; }}
            </style>
            </head>
            <body>
            <div class=""card"">
                  <div class=""title"">Verify Your Email</div>
                  <div class=""subtitle"">EduACAS Email Verification</div>
                  <div class=""message"">
                  Please use the verification code below to complete your registration. This code will expire in 5 minutes.
                  </div>
                  <div class=""otp-container"">
                        <div class=""otp-label"">Verification Code</div>
                        <div class=""otp-code"">{0}</div>
                  </div>
                  <div class=""expiry"">
                  This code expires in 5 minutes
                  </div>
                  <div class=""warning"">
                  <strong>Security Notice:</strong> Never share this code with anyone. EduACAS will never ask for your verification code.
                  </div>
                  <div class=""footer"">
                  If you didn't request this verification code, you can safely ignore this email.<br />
                  This is an automated message, please do not reply.
                  </div>
            </div>
            </body>
            </html>";
      
      public static string EmailPasswordResetTemplate = @"<!DOCTYPE html>
            <html>
            <head>
            <meta charset=""UTF-8"" />
            <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
            <style>
                  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 24px; }}
                  .card {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }}
                  .title {{ font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px; text-align: center; }}
                  .subtitle {{ font-size: 15px; color: #6b7280; margin: 0 0 32px; text-align: center; }}
                  .message {{ font-size: 15px; line-height: 1.6; color: #1f2937; margin: 0 0 28px; text-align: center; }}
                  .button-container {{ background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 32px 24px; margin: 32px 0; text-align: center; }}
                  .button-label {{ font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; font-weight: 600; }}
                  .reset-button {{ display: inline-block; padding: 14px 32px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: background 0.2s; }}
                  .reset-button:hover {{ background: #374151; }}
                  .expiry {{ font-size: 13px; color: #9ca3af; text-align: center; margin: 20px 0 0; }}
                  .warning {{ font-size: 13px; color: #dc2626; text-align: center; margin: 24px 0 0; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 3px solid #dc2626; }}
                  .footer {{ font-size: 12px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; line-height: 1.5; }}
            </style>
            </head>
            <body>
            <div class=""card"">
                  <div class=""title"">Reset Your Password</div>
                  <div class=""subtitle"">EduACAS Password Reset</div>
                  <div class=""message"">
                  We received a request to reset your password. Click the button below to create a new password. This link will expire in {1}.
                  </div>
                  <div class=""button-container"">
                        <div class=""button-label"">Reset Password Link</div>
                        <a href=""{0}"" class=""reset-button"">Reset Password</a>
                  </div>
                  <div class=""expiry"">
                  This link expires in {1}
                  </div>
                  <div class=""warning"">
                  <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                  </div>
                  <div class=""footer"">
                  If you didn't request a password reset, you can safely ignore this email.<br />
                  This is an automated message, please do not reply.
                  </div>
            </div>
            </body>
            </html>";
      
      // Template that just passes through the body (for pre-formatted HTML emails)
      public static string EmailBodyOnlyTemplate = @"{1}";
      
      public static string EmailGrantAccountTemplate = @"<!DOCTYPE html>
            <html>
            <head>
            <meta charset=""UTF-8"" />
            <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
            <style>
                  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 24px; }}
                  .card {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }}
                  .title {{ font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px; text-align: center; }}
                  .subtitle {{ font-size: 15px; color: #6b7280; margin: 0 0 32px; text-align: center; }}
                  .message {{ font-size: 15px; line-height: 1.6; color: #1f2937; margin: 0 0 28px; }}
                  .credentials-container {{ background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0; }}
                  .credentials-table {{ width: 100%; border-collapse: collapse; }}
                  .credentials-table td {{ padding: 12px; border-bottom: 1px solid #e5e7eb; }}
                  .credentials-table td:first-child {{ font-weight: 600; color: #374151; width: 40%; }}
                  .credentials-table td:last-child {{ color: #111827; }}
                  .credentials-table tr:last-child td {{ border-bottom: none; }}
                  .warning {{ font-size: 14px; color: #dc2626; margin: 24px 0 0; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 3px solid #dc2626; }}
                  .footer {{ font-size: 12px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; line-height: 1.5; }}
            </style>
            </head>
            <body>
            <div class=""card"">
                  <div class=""title"">Welcome {2}!</div>
                  <div class=""subtitle"">Your EduACAS Account Credentials</div>
                  <div class=""message"">
                  Your account has been created with the following credentials:
                  </div>
                  <div class=""credentials-container"">
                        <table class=""credentials-table"">
                              <tr>
                                    <td><strong>Email:</strong></td>
                                    <td>{0}</td>
                              </tr>
                              <tr>
                                    <td><strong>Temporary Password:</strong></td>
                                    <td>{1}</td>
                              </tr>
                              <tr>
                                    <td><strong>Role:</strong></td>
                                    <td>{3}</td>
                              </tr>
                        </table>
                  </div>
                  <div class=""warning"">
                  <strong>Important:</strong> Please log in immediately and change your password to a secure one.
                  </div>
                  <div class=""footer"">
                  Best regards,<br />EduACAS Team<br />
                  This is an automated message, please do not reply.
                  </div>
            </div>
            </body>
            </html>";
      
}

public class EmailSettings
{
      public string From { get; set; } = string.Empty;
      public string SmtpHost { get; set; } = string.Empty;
      public int SmtpPort { get; set; } = 587;
      public string User { get; set; } = string.Empty;
      public string Password { get; set; } = string.Empty;
      public bool UseSsl { get; set; } = true;
}
