using System;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using Amazon.DynamoDBv2;
using AcasService.Application.Mappers;
using AcasService.Repositories.Examination;


namespace AcasService.Application.Queries.Examination;

public interface IExaminationQuery
{
    Task<ExaminationResponse?> GetByIdAsync(string id);
    Task<List<ExaminationResponse?>> GetAllAsync();

}

public class ExaminationQuery : IExaminationQuery
{
    private readonly IExaminationRepository _examinationRepository;
    private readonly ExaminationMapper _examinationMapper;
    private readonly ILogger<ExaminationQuery> _logger;

    public ExaminationQuery(IExaminationRepository examinationRepository, ILogger<ExaminationQuery> logger, ExaminationMapper examinationMapper)
    {
        _examinationRepository = examinationRepository;
        _examinationMapper = examinationMapper;
        _logger = logger;
    }

    public async Task<ExaminationResponse?> GetByIdAsync(string id)
    {
        try
        {
            var exam = await _examinationRepository.GetByIdAsync(id);
            if (exam == null)
            {
                throw new Exception("Examination with id not found.");
            }

            return _examinationMapper.ToExaminationResponse(exam);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examination by id");
            throw;
        }
    }

 public async Task<List<ExaminationResponse?>> GetAllAsync()
    {
        try
        {
            var exams = await _examinationRepository.GetAllAsync();
            var responseList = new List<ExaminationResponse?>();

            if (exams == null || exams.Count == 0)
            {
                throw new Exception("No examinations found.");
            }

            foreach (var exam in exams)
            {
                responseList.Add(exam == null ? null : _examinationMapper.ToExaminationResponse(exam));
            }

            return responseList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting all examinations");
            throw;
        }
    }
}
