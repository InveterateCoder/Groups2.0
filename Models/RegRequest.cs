using System.ComponentModel.DataAnnotations;

namespace Groups2._0.Models
{
  public class RegRequest
  {
    [Required, StringLength(64, MinimumLength = 5)]
    public string Name { get; set; }
    [Required, StringLength(256, MinimumLength = 6), EmailAddress]
    public string Email { get; set; }
    [Required, StringLength(32, MinimumLength = 8), DataType(DataType.Password)]
    public string Password { get; set; }
  }
}
