using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Net;

namespace AcasService.Repositories.S3;

public class PrivateS3Repository : IPrivateS3Repository
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly ILogger<PrivateS3Repository> _logger;

    public PrivateS3Repository(
        IAmazonS3 s3Client,
        IConfiguration configuration,
        ILogger<PrivateS3Repository> logger)
    {
        _s3Client = s3Client;
        _bucketName = configuration["S3:PrivateBucketName"] ??
            throw new InvalidOperationException("S3:PrivateBucketName is not configured");
        _logger = logger;
    }

    public async Task<string> GenerateSignedUrlAsync(string fileName, int expiresInSeconds = 3600)
    {
        ValidateArguments(fileName, expiresInSeconds);

        try
        {
            await _s3Client.GetObjectMetadataAsync(_bucketName, fileName); // throws if missing
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileName,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddSeconds(expiresInSeconds)
            };

            var url = _s3Client.GetPreSignedURL(request);
            // _logger.LogInformation(
            //     "Generated signed download URL for {FileName} that expires at {Expiration}",
            //     fileName,
            //     request.Expires
            // );
            // return Task.FromResult(url);
            return url;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("File not found: {FileName}", fileName);
            throw new FileNotFoundException("File not found", fileName, ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate signed URL for file {FileName}", fileName);
            throw;
        }
    }

    public async Task<string> GeneratePresignedUploadUrlAsync(string fileName, string contentType, int expiresInSeconds = 3600)
    {
        ValidateArguments(fileName, expiresInSeconds);

        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("Content type must be provided", nameof(contentType));
        }

        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileName,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddSeconds(expiresInSeconds),
                ContentType = contentType
            };

            var url = _s3Client.GetPreSignedURL(request);
            // _logger.LogInformation(
            //     "Generated presigned upload URL for {FileName} that expires at {Expiration}",
            //     fileName,
            //     request.Expires);
            // return Task.FromResult(url);
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned upload URL for file {FileName}", fileName);
            throw;
        }
    }

    public async Task<string> UploadFileAsync(byte[] file, string fileName, string contentType)
    {
        if (file is null || file.Length == 0)
        {
            throw new ArgumentException("File content must be provided", nameof(file));
        }

        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("Content type must be provided", nameof(contentType));
        }

        ValidateArguments(fileName);

        try
        {
            using var stream = new MemoryStream(file);

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = fileName,
                InputStream = stream,
                ContentType = contentType
            };

            var response = await _s3Client.PutObjectAsync(request);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                var location = $"s3://{_bucketName}/{fileName}";
                _logger.LogInformation("File uploaded to private bucket: {FileName}", fileName);
                return location;
            }

            throw new InvalidOperationException($"Failed to upload file. HTTP Status: {response.HttpStatusCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to private bucket: {FileName}", fileName);
            throw;
        }
    }

    public async Task<bool> DeleteFileAsync(string fileName)
    {
        ValidateArguments(fileName);

        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = fileName
            };

            var response = await _s3Client.DeleteObjectAsync(request);

            if (response.HttpStatusCode == HttpStatusCode.OK || response.HttpStatusCode == HttpStatusCode.NoContent)
            {
                _logger.LogInformation("File deleted from private bucket: {FileName}", fileName);
                return true;
            }

            _logger.LogWarning("Failed to delete file from private bucket. HTTP Status: {Status}, FileName: {FileName}", response.HttpStatusCode, fileName);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from private bucket: {FileName}", fileName);
            return false;
        }
    }

    private static void ValidateArguments(string fileName, int? expiresInSeconds = null)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("File name must be provided", nameof(fileName));
        }

        if (expiresInSeconds.HasValue && expiresInSeconds.Value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(expiresInSeconds), "Expiration must be positive.");
        }
    }
}
