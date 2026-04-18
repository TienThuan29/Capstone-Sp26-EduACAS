namespace AcasService.Repositories.ClassroomQuiz;

public interface IClassroomQuizRepository
{
    Task<Models.ClassroomQuiz?> CreateAsync(Models.ClassroomQuiz classroomQuiz);
    Task<Models.ClassroomQuiz?> FindByIdAsync(string classroomQuizId);
    Task<List<Models.ClassroomQuiz>> FindAllAsync();
    Task<List<Models.ClassroomQuiz>> FindByClassroomIdAsync(string classroomId);
    Task<(List<Models.ClassroomQuiz> Items, int TotalCount)> FindByClassroomIdPagedAsync(string classroomId, int pageNumber, int pageSize, bool includeDrafts = false);
    Task<Models.ClassroomQuiz?> UpdateAsync(Models.ClassroomQuiz classroomQuiz);
    Task SoftDeleteAsync(string classroomQuizId);
    Task DeleteAsync(string classroomQuizId);
}
