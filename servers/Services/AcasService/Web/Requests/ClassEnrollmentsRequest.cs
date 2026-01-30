using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests;

public class ClassEnrollmentsRequest
{
    [Required(ErrorMessage = "Class ID is required")]
    public string ClassId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Student ID is required")]
    public string StudentId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Enrol key is required")]
    public string EnrolKey { get; set; } = string.Empty;
}