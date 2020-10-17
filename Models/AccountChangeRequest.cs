using System.ComponentModel.DataAnnotations;

namespace Groups2._0.Models
{
  public class AccountChangeRequest
  {
    [Required, StringLength(32, MinimumLength = 8), DataType(DataType.Password)]
    public string Password { get; set; }
    [StringLength(64, MinimumLength = 5)]
    public string NewName { get; set; }
    [StringLength(32, MinimumLength = 8), DataType(DataType.Password)]
    public string NewPassword { get; set; }
  }
}