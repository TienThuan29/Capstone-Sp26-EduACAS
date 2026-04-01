namespace AcasService.Repositories.Question;

public interface IQuestionRepository
{
    Task<Models.Question?> CreateAsync(Models.Question question);
    Task<Models.Question?> FindByIdAsync(string questionId);
    Task<List<Models.Question>> FindAllAsync();
    Task<Models.Question?> UpdateAsync(Models.Question question);
    Task SoftDeleteAsync(string questionId);
    Task DeleteAsync(string questionId);
}
