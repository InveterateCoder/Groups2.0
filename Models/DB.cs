using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Groups2._0.Models
{
  public class Chatterer : IdentityUser
  {
    public long LastActive { get; set; }
    [MaxLength(64)]
    public string Group { get; set; }
    public long GroupLastCleaned { get; set; }
    [MaxLength(32)]
    public string GroupPassword { get; set; }
    public string InGroupId { get; set; }
    [MaxLength(32)]
    public string InGroupPassword { get; set; }
    [MaxLength(64)]
    public string ConnectionId { get; set; }
    public string WebSubscription { get; set; }
    public long LastNotified { get; set; }
  }
  public class RegData
  {
    public int Id { get; set; }
    public int Code { get; set; }
    public long RequestTime { get; set; }
    [MaxLength(64)]
    public string Name { get; set; }
    [MaxLength(256)]
    public string Email { get; set; }
    [MaxLength(32)]
    public string Password { get; set; }
  }
  public class Message
  {
    public int Id { get; set; }
    public long SharpTime { get; set; }
    public long JsTime { get; set; }
    [MaxLength(64)]
    public string StringTime { get; set; }
    [MaxLength(64)]
    public string From { get; set; }
    [MaxLength(10000)]
    public string Text { get; set; }
    public string GroupId { get; set; }
  }
  public class GroupsDbContext : IdentityDbContext<Chatterer>
  {
    public GroupsDbContext(DbContextOptions<GroupsDbContext> opts) : base(opts) { }
    public DbSet<Message> Messages { get; set; }
    public DbSet<RegData> RegRequests { get; set; }
  }
}
