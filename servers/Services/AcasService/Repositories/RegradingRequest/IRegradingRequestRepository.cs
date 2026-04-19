using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Repositories.RegradingRequest;

public interface IRegradingRequestRepository
{
    Task<Models.RegradingRequest?> CreateAsync(Models.RegradingRequest request);
    Task<Models.RegradingRequest?> GetByIdAsync(string id);
    Task<Models.RegradingRequest?> UpdateAsync(Models.RegradingRequest request);
    Task DeleteAsync(string id);
    
    Task<List<Models.RegradingRequest>> GetByStudentIdAsync(string studentId);
    Task<List<Models.RegradingRequest>> GetByExamIdAsync(string examId);
    Task<List<Models.RegradingRequest>> GetBySubmissionIdAsync(string submissionId);
    Task<List<Models.RegradingRequest>> GetByStatusAsync(Models.RegradingRequestStatus status);
    
    Task<PagedResult<Models.RegradingRequest>> GetAllPagedAsync(
        int pageIndex,
        int pageSize,
        string? studentId = null,
        string? examId = null,
        RegradingRequestStatus? status = null);
    
    Task<Models.RegradingRequest?> ApproveAsync(string id, string lecturerNote);
    Task<Models.RegradingRequest?> RejectAsync(string id, string lecturerNote);
    Task<Models.RegradingRequest?> CancelAsync(string id);
}
