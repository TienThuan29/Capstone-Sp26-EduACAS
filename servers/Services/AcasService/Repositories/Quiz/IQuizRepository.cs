namespace AcasService.Repositories.Quiz;

public interface IQuizRepository
{
    Task<Models.Quiz?> CreateAsync(Models.Quiz quiz);
    Task<Models.Quiz?> FindByIdAsync(string quizId);
    Task<List<Models.Quiz>> FindAllAsync();
    Task<Models.Quiz?> UpdateAsync(Models.Quiz quiz);
    Task SoftDeleteAsync(string quizId);
    Task DeleteAsync(string quizId);
}
