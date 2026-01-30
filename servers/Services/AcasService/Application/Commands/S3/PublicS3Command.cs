using AcasService.Repositories.S3;

namespace AcasService.Application.Commands.S3;

public interface IPublicS3Command
{
    Task<string> UploadFileAsync(byte[] file, string fileName, string contentType);
}

public class PublicS3Command : IPublicS3Command
{
    private readonly IPublicS3Repository _publicS3Repository;

    public PublicS3Command(IPublicS3Repository publicS3Repository)
    {
        _publicS3Repository = publicS3Repository;
    }

    public async Task<string> UploadFileAsync(byte[] file, string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension))
            extension = ".bin";
        var key = $"avatars/{Guid.NewGuid()}{extension}";
        var url = await _publicS3Repository.UploadFileAsync(file, key, contentType);
        return url;
    }
}
