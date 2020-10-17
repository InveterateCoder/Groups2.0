using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Groups2._0.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace Groups2._0.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  [Authorize]
  public class GroupsController : ControllerBase
  {
    private UserManager<Chatterer> _userMgr;
    private SignInManager<Chatterer> _signMgr;
    private GroupsDbContext _groupsDb;
    public GroupsController(GroupsDbContext groupsDb, UserManager<Chatterer> userMgr, SignInManager<Chatterer> signMgr)
    {
      _userMgr = userMgr;
      _signMgr = signMgr;
      _groupsDb = groupsDb;
    }
    [HttpGet("list/{start:int:min(0)}/{quantity:int:range(1,100)?}/{query:maxlength(64)?}")]
    public JsonResult Groups(int start, int quantity, string query = "")
    {
      try
      {
        var groups = _userMgr.Users.Where(u => u.Group != null && u.Group.StartsWith(query)).Select(u => u.Group);
        var groupsCount = groups.Count();
        if (groupsCount <= start)
          return new JsonResult(0);
        if (quantity == 0)
          return new JsonResult(groupsCount - start);
        if (start + quantity > groupsCount)
          quantity = groupsCount - start;
        return new JsonResult(groups.OrderBy(g => g).Skip(start).Take(quantity).ToArray());
      }
      catch (Exception e)
      {
        return new JsonResult(e.Message);
      }
    }
    [HttpGet("msgs/{ticks}/{quantity:int:range(1,100)}")]
    public JsonResult Messages(string ticks, int quantity)
    {
      var user = _userMgr.GetUserAsync(User).Result;
      try
      {
        long lticks = long.Parse(ticks);
        var limit = DateTime.UtcNow.Subtract(TimeSpan.FromDays(15)).Ticks;
        if (lticks == 0) lticks = DateTime.UtcNow.Ticks;
        else if (lticks < limit)
          return new JsonResult(-1);
        IQueryable<Message> messages;
        messages = _groupsDb.Messages.Where(m => m.GroupId == user.InGroupId && m.SharpTime < lticks && m.SharpTime >= limit).OrderBy(m => m.SharpTime);
        if (messages.Count() <= 0)
          return new JsonResult(0);
        if (messages.Count() <= quantity)
          return new JsonResult(messages);
        else
          return new JsonResult(messages.Skip(messages.Count() - quantity));
      }
      catch (Exception e)
      {
        return new JsonResult(e.Message);
      }
    }
    [HttpGet("msgs/missed/{ticks}")]
    public JsonResult MessagesMissed(string ticks)
    {
      var user = _userMgr.GetUserAsync(User).Result;
      try
      {
        long lticks = long.Parse(ticks);
        if (lticks < DateTime.UtcNow.Subtract(TimeSpan.FromDays(1)).Ticks)
          return new JsonResult(-1);
        else
        {
          var messages = _groupsDb.Messages.Where(m => m.GroupId == user.InGroupId && m.SharpTime > lticks).OrderBy(m => m.SharpTime);
          if (messages.Count() <= 0)
            return new JsonResult(0);
          else
            return new JsonResult(messages);
        }
      }
      catch (Exception e)
      {
        return new JsonResult(e.Message);
      }
    }
    [HttpPost("reg")]
    public async Task<ContentResult> Register([FromBody] GroupRegRequest request)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        if (user.Group != null)
          ret = "has_group";
        else if ((await _signMgr.CheckPasswordSignInAsync(user, request.Password, false)).Succeeded != true)
          ret = "wrong_password";
        else if (!StaticData.IsNameValid(request.GroupName))
          ret = "invalid_name";
        else if (_groupsDb.Users.Any(c => c.Group == request.GroupName))
          ret = "name_taken";
        else
        {
          user.Group = request.GroupName;
          user.GroupPassword = request.GroupPassword;
          user.GroupLastCleaned = DateTime.UtcNow.Ticks;
          await _groupsDb.SaveChangesAsync();
          ret = "OK";
        }
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
    [HttpPost("change")]
    public async Task<ContentResult> Change([FromBody] GroupChangeRequest request)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        if (user.Group == null)
          ret = "has_no_group";
        else if (request.NewGroupName == null && request.NewGroupPassword != null && request.NewGroupPassword.Length < 8)
          ret = "no_change_requested";
        else if ((await _signMgr.CheckPasswordSignInAsync(user, request.Password, false)).Succeeded != true)
          ret = "wrong_password";
        else
        {
          if (request.NewGroupName != null && !StaticData.IsNameValid(request.NewGroupName))
            ret = "invalid_name";
          else
          {
            if (request.NewGroupName != null && request.NewGroupName != user.Group && request.NewGroupPassword != user.GroupPassword
                && (request.NewGroupPassword == null || request.NewGroupPassword.Length >= 8))
            {
              if (request.NewGroupName.Equals(user.Group, StringComparison.OrdinalIgnoreCase))
              {
                user.Group = request.NewGroupName;
                user.GroupPassword = request.NewGroupPassword;
                await _groupsDb.SaveChangesAsync();
                ret = "name&pass_changed";
              }
              else
              {
                if (_groupsDb.Users.Any(c => c.Group == request.NewGroupName))
                  ret = "group_name_exists";
                else
                {
                  user.Group = request.NewGroupName;
                  user.GroupPassword = request.NewGroupPassword;
                  await _groupsDb.SaveChangesAsync();
                  ret = "name&pass_changed";
                }
              }
            }
            else if (request.NewGroupName != null && request.NewGroupName != user.Group)
            {
              if (request.NewGroupName.Equals(user.Group, StringComparison.OrdinalIgnoreCase))
              {
                user.Group = request.NewGroupName;
                await _groupsDb.SaveChangesAsync();
                ret = "name_changed";
              }
              else
              {
                if (_groupsDb.Users.Any(c => c.Group == request.NewGroupName))
                  ret = "group_name_exists";
                else
                {
                  user.Group = request.NewGroupName;
                  await _groupsDb.SaveChangesAsync(); ;
                  ret = "name_changed";
                }
              }
            }
            else if (request.NewGroupPassword != user.GroupPassword && (request.NewGroupPassword == null || request.NewGroupPassword.Length >= 8))
            {
              user.GroupPassword = request.NewGroupPassword;
              await _groupsDb.SaveChangesAsync();
              ret = "pass_changed";
            }
            else
              ret = "not_changed";
          }
        }
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
    [HttpPost("sign")]
    public async Task<ContentResult> Sign([FromBody] GroupSignRequest request)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      if (user.InGroupId != null)
        ret = "already_signed";
      else
      {
        try
        {
          if (request.Name == user.Group)
          {
            user.InGroupId = user.Id;
            user.InGroupPassword = user.GroupPassword;
            await _groupsDb.SaveChangesAsync();
            ret = "OK";
          }
          else
          {
            var entity = _groupsDb.Users.FirstOrDefault(c => c.Group == request.Name);
            if (entity == null)
              ret = "not_found";
            else
            {
              if (entity.GroupPassword != request.Password)
                ret = "wrong_password";
              else
              {
                user.InGroupId = entity.Id;
                user.InGroupPassword = request.Password;
                await _groupsDb.SaveChangesAsync();
                ret = "OK";
              }
            }
          }
        }
        catch (Exception e)
        {
          ret = e.Message;
        }
      }
      return Content(ret, "text/plain");
    }
    [HttpPost("del")]
    public async Task<ContentResult> Delete([Required, StringLength(32, MinimumLength = 8), FromBody] string password)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        if (user.Group == null)
          ret = "has_no_group";
        else if ((await _signMgr.CheckPasswordSignInAsync(user, password, false)).Succeeded != true)
          ret = "wrong_password";
        else
        {
          var group_users = _groupsDb.Users.Where(c => c.InGroupId == user.Id);
          foreach (var u in group_users)
            u.InGroupId = null;
          _groupsDb.Messages.RemoveRange(_groupsDb.Messages.Where(m => m.GroupId == user.Id));
          user.Group = null;
          user.GroupPassword = null;
          await _groupsDb.SaveChangesAsync();
          ret = "deleted";
        }
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
  }
}
