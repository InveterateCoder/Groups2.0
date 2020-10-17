using System.ComponentModel.DataAnnotations;

namespace Groups2._0.Models
{
  public class GroupSignRequest
  {
    [Required, StringLength(64, MinimumLength = 5)]
    public string Name { get; set; }
    [StringLength(32, MinimumLength = 8)]
    public string Password { get; set; }
  }
}
