namespace AcasService.Repositories.QuizAttempt;

public interface IQuizAttemptRepository
{
    Task<Models.QuizAttempt?> CreateAsync(Models.QuizAttempt quizAttempt);
    Task<Models.QuizAttempt?> FindByIdAsync(string quizAttemptId);
    Task<List<Models.QuizAttempt>> FindAllAsync();
    Task<List<Models.QuizAttempt>> FindByClassroomQuizIdAsync(string classroomQuizId);
    Task<List<Models.QuizAttempt>> FindByStudentIdAsync(string studentId);
    Task<Models.QuizAttempt?> UpdateAsync(Models.QuizAttempt quizAttempt);
    Task DeleteAsync(string quizAttemptId);
    Task<int> GetMaxAttemptNumberAsync(string classroomQuizId);
    Task<int> GetMaxAttemptNumberAsync(string classroomQuizId, string studentId);
}
