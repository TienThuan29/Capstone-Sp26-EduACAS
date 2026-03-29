namespace AcasService.Repositories.AnswerOption;

public interface IAnswerOptionRepository
{
    Task<List<Models.AnswerOption>> CreateBatchAsync(List<Models.AnswerOption> answerOptions);
    Task<List<Models.AnswerOption>> FindByQuestionIdAsync(string questionId);
    Task<Dictionary<string, List<Models.AnswerOption>>> FindByQuestionIdsAsync(IEnumerable<string> questionIds);
    Task DeleteByQuestionIdAsync(string questionId);
}
