using AcasService.Repositories.S3;
using Amazon.S3;
using Microsoft.Extensions.Logging;

namespace AcasService.Application.Queries.S3;

public interface IPrivateS3Query
{
    Task<string> GetFileUrlAsync(string fileName);
    Task<Dictionary<string, string>> GetFileUrlsAsync(IEnumerable<string> fileNames);
}

public class PrivateS3Query : IPrivateS3Query
{
    private readonly IPrivateS3Repository _privateS3Repository;
    private readonly ILogger<PrivateS3Query> _logger;

    public PrivateS3Query(IPrivateS3Repository privateS3Repository, ILogger<PrivateS3Query> logger)
    {
        _privateS3Repository = privateS3Repository;
        _logger = logger;
    }

    public async Task<string> GetFileUrlAsync(string fileName)
    {
        return await _privateS3Repository.GenerateSignedUrlAsync(fileName);
    }

    public async Task<Dictionary<string, string>> GetFileUrlsAsync(IEnumerable<string> fileNames)
    {
        var distinct = fileNames.Where(f => !string.IsNullOrWhiteSpace(f)).Distinct().ToList();
        if (distinct.Count == 0)
            return new Dictionary<string, string>();

        var tasks = distinct.Select(async fileName =>
        {
            try
            {
                var url = await _privateS3Repository.GenerateSignedUrlAsync(fileName);
                return (fileName, url);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not generate presigned URL for file {FileName}", fileName);
                return (fileName, string.Empty);
            }
        });

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(x => x.Item1, x => x.Item2);
    }
}