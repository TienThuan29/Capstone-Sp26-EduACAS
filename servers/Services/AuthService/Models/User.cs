using System.ComponentModel.DataAnnotations;

namespace AuthService.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string RoleNumber { get; set; } = string.Empty;
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string Fullname { get; set; } = string.Empty;
        
        public string AvatarUrl { get; set; } = string.Empty;
        
        public DateTime? Birthday { get; set; }
        
        [Required]
        public bool IsEnable { get; set; }

        public bool? FirstLogin { get; set; } = false;
        
        [Required]
        public Role Role { get; set; }
        
        public string GoogleId { get; set; } = string.Empty;
        
        public DateTime? LastLoginDate { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }

    public enum Role
    {
        STUDENT,
        LECTURER,
        ADMIN
    }
}