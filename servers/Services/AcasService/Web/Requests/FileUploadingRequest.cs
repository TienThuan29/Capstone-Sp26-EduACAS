namespace AcasService.Web.Requests;

public sealed class UploadFileRequest
{
    public IFormFile File { get; set; } = default!;
}