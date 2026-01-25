using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ProgrammingLanguage;
using Microsoft.Extensions.Logging;
using AcasService.Application.Mappers;

namespace AcasService.Application.Queries.ProgrammingLanguage;


public interface IProgrammingLanguageQuery
{
    Task<ProgrammingLanguageResponse?> GetByIdAsync(string id);

    Task<List<ProgrammingLanguageResponse>> GetAllAsync();
    
    Task<List<ProgrammingLanguageResponse>> SearchAsync(string? searchTerm = null, bool? isEnable = null);
    
    Task<PagedProgrammingLanguageResponse> GetPagedAsync(
        int page = 1, int pageSize = 10, string? sortBy = null, bool ascending = true);

}


public class ProgrammingLanguageQuery : IProgrammingLanguageQuery
{
    private readonly IProgrammingLanguageRepository _repository;
    private readonly ILogger<ProgrammingLanguageQuery> _logger;

    private readonly ProgrammingLanguageMapper _mapper;
    public ProgrammingLanguageQuery(
        IProgrammingLanguageRepository repository,
        ILogger<ProgrammingLanguageQuery> logger,
        ProgrammingLanguageMapper mapper)
    {
        _repository = repository;
        _logger = logger;
        _mapper = mapper;
    }

     public async Task<List<ProgrammingLanguageResponse>> GetAllAsync()
    {
        try
        {
            var entities = await _repository.GetAllAsync();
            var responseList = new List<ProgrammingLanguageResponse>();
            if (entities == null || entities.Count() == 0)
            {
                throw new Exception("No programming languages found.");
            }
            foreach (var entity in entities)
            {
                responseList.Add(_mapper.ToProgrammingLanguageResponse(entity));
            }
            return responseList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error getting all programming languages");
            throw;
        }
    }

    public async Task<ProgrammingLanguageResponse?> GetByIdAsync(string id)
    {
        try
        {
            var entity = await _repository.GetByIdAsync(id);
            if(entity == null)
            {
                throw new Exception("Programming language with id not found.");
            }
            return _mapper.ToProgrammingLanguageResponse(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error getting programming language by Id: {Id}", id);
            throw;
        }
    }

    public async Task<List<ProgrammingLanguageResponse>> SearchAsync(string? searchTerm = null, bool? isEnable = null)
    {
        try
        {
            var entities = await _repository.SearchAsync(searchTerm, isEnable);
            var responseList = new List<ProgrammingLanguageResponse>();
            
            foreach (var entity in entities)
            {
                responseList.Add(_mapper.ToProgrammingLanguageResponse(entity));
            }
            
            return responseList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching programming languages");
            throw;
        }
    }

    public async Task<PagedProgrammingLanguageResponse> GetPagedAsync(
        int page = 1, int pageSize = 10, string? sortBy = null, bool ascending = true)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var (items, totalCount) = await _repository.GetPagedAsync(page, pageSize, sortBy, ascending);
            
            var responseList = items.Select(entity => _mapper.ToProgrammingLanguageResponse(entity)).ToList();
            
            return new PagedProgrammingLanguageResponse
            {
                Items = responseList,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged programming languages");
            throw;
        }
    }

}