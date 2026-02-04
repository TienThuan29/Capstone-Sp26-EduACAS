
namespace AcasService.Repositories.Slot;

public interface ISlotRepository
{
    Task<Models.Slot?> CreateAsync(Models.Slot slot);
    Task<Models.Slot?> FindByIdAsync(string slotId);
    Task<List<Models.Slot>> FindAllAsync();
    Task<Models.Slot?> UpdateAsync(Models.Slot slot);
    Task DeleteAsync(string slotId);
    Task<IEnumerable<Models.Slot>> GetSlotsByClassroomIdAsync(string classroomId);
    Task<IEnumerable<Models.Slot>> GetSlotsByKeywordAsync(string keyword);

    Task AddRangeAsync(List<Models.Slot> slots);


}
