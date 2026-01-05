using AcasService.Models;

namespace AcasService.Repositories.Problem;

public interface IProblemRepository
{
    Task<Models.Problem?> GetByIdAsync(string problemId);
    Task<List<Models.Problem>> GetByExamIdAsync(string examId);
    Task<List<Models.Problem>> GetByLecturerIdAsync(string lecturerId);
    Task<List<Models.Problem>> GetAllAsync();
    Task<string> CreateAsync(Models.Problem problem);
    Task UpdateAsync(Models.Problem problem);
    Task DeleteAsync(string problemId);
    Task<bool> ExistsAsync(string problemId);
    Task AddTestCaseAsync(string problemId, TestCase testCase);
    Task UpdateTestCaseAsync(string problemId, TestCase testCase);
    Task DeleteTestCaseAsync(string problemId, string testCaseId);
    Task<TestCase?> GetTestCaseAsync(string problemId, string testCaseId);
    Task<List<TestCase>> GetTestCasesByProblemIdAsync(string problemId);
}