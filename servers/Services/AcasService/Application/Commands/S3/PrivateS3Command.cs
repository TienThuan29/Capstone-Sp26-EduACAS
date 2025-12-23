using AcasService.Repositories.S3;
using Amazon.S3;

namespace AcasService.Application.Commands.S3;

public interface IPrivateS3Command
{
    Task<string> UploadFilesAsync(byte[] file, string fileName, string contentType);
    
    Task<string> DeleteFilesAsync(string fileName);
}

public class PrivateS3Command : IPrivateS3Command
{
    private readonly IPrivateS3Repository _privateS3Repository;
    
    public PrivateS3Command(IPrivateS3Repository privateS3Repository)
    {
        _privateS3Repository = privateS3Repository;
    }
    
    public async Task<string> UploadFilesAsync(byte[] file, string fileName, string contentType)
    {
        string uniqueSuffix = Guid.NewGuid().ToString();
        fileName = $"{Path.GetFileNameWithoutExtension(fileName)}_{uniqueSuffix}{Path.GetExtension(fileName)}";
        await _privateS3Repository.UploadFileAsync(file, fileName, contentType);
        return fileName;
    }
    
    public async Task<string> DeleteFilesAsync(string fileName)
    {
        var result = await _privateS3Repository.DeleteFileAsync(fileName);
        return result ? "File deleted successfully." : "File deletion failed.";
    }
}