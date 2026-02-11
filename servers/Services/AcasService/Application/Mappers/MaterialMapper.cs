using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers
{
    public class MaterialMapper
    {
        public MaterialResponse ToMaterialResponse(Material material)
        {
            return new MaterialResponse
            {
                Id = material.Id,
                LecturerId = material.LecturerId,
                ClassroomId = material.ClassroomId,
                Filename = material.Filename,
                FileUrl = material.FileUrl,
                Description = material.Description,
                IsDeleted = material.IsDeleted,
                CreatedDate = material.CreatedDate
            };
        }
    }
}
