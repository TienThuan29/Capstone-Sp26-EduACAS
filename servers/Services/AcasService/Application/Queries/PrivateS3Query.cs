using AcasService.Repositories.S3;
using Amazon.S3;

namespace AcasService.Application.Queries.S3;

public interface IPrivateS3Query
{
    Task<string> GetFileUrlAsync(string fileName);
}

public class PrivateS3Query : IPrivateS3Query
{
    private readonly IPrivateS3Repository _privateS3Repository;

      public PrivateS3Query(IPrivateS3Repository privateS3Repository)
      {
            _privateS3Repository = privateS3Repository;
      }

      public async Task<string> GetFileUrlAsync(string fileName)
      {
            return await _privateS3Repository.GenerateSignedUrlAsync(fileName);
      }
}