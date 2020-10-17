using System.ComponentModel.DataAnnotations;

namespace Groups2._0.Models
{
  public class GroupChangeRequest
  {
    [Required, StringLength(32, MinimumLength = 8)]
    public string Password { get; set; }
    [StringLength(64, MinimumLength = 5)]
    public string NewGroupName { get; set; }
    [StringLength(32)]
    public string NewGroupPassword { get; set; }
  }
}
