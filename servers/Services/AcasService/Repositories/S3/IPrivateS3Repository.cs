namespace AcasService.Repositories.S3;

public interface IPrivateS3Repository
{
      Task<string> GenerateSignedUrlAsync(string fileName, int expiresInSeconds = 3600);

      Task<string> GeneratePresignedUploadUrlAsync(string fileName, string contentType, int expiresInSeconds = 3600);

      Task<string> UploadFileAsync(byte[] file, string fileName, string contentType);

      Task<bool> DeleteFileAsync(string fileName);
      Task<byte[]> DownloadFileAsync(string fileName);

}
