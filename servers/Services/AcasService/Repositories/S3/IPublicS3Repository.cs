namespace AcasService.Repositories.S3
{
      public interface IPublicS3Repository
      {
            Task<string> UploadFileAsync(byte[] file, string fileName, string contentType);

            Task<string> UploadFileWithMetadataAsync(byte[] file, string fileName, string contentType, Dictionary<string, string>? metadata = null);

            Task<bool> DeleteFileAsync(string fileName);
            
            Task<bool> FileExistsAsync(string fileName);
      }
}