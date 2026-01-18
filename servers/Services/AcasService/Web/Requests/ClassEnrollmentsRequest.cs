

namespace AcasService.Web.Requests;

public class ClassEnrollmentsRequest
{
    public string ClassId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;

    public string EnrolKey { get; set; } = string.Empty;
}