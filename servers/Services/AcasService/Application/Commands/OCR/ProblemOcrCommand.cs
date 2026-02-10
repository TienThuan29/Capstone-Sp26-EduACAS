using AcasService.Repositories.S3;

namespace AcasService.Application.Commands.OCR
{
    public interface IProblemOcrCommand
    {
        Task<string> ExtractContentFromFileAsync(string s3FileName);
    }
    public class ProblemOcrCommand : IProblemOcrCommand
    {
        private readonly IAzureOcrCommand _azureOcrCommand;
        private readonly IPrivateS3Repository _s3Repository;
        private readonly ILogger<ProblemOcrCommand> _logger;
        public ProblemOcrCommand(
            IAzureOcrCommand azureOcrCommand,
            IPrivateS3Repository s3Repository,
            ILogger<ProblemOcrCommand> logger)
        {
            _azureOcrCommand = azureOcrCommand;
            _s3Repository = s3Repository;
            _logger = logger;
        }
        public async Task<string> ExtractContentFromFileAsync(string s3FileName)
        {
            try
            {
                _logger.LogInformation("Starting OCR extraction for file: {FileName}", s3FileName);
                var fileBytes = await _s3Repository.DownloadFileAsync(s3FileName);

                if (fileBytes == null || fileBytes.Length == 0)
                {
                    throw new InvalidOperationException($"File {s3FileName} is empty or not found");
                }
                using var stream = new MemoryStream(fileBytes);
                var markdown = await _azureOcrCommand.AnalyzeToMarkdownAsync(stream);
                _logger.LogInformation("OCR extraction completed for {FileName}, extracted {Length} characters",
                    s3FileName, markdown.Length);
                return markdown;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract content from {FileName}", s3FileName);
                throw;
            }
        }
    }
}
