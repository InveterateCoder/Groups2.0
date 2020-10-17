using System;
using System.Linq;
using System.Threading.Tasks;
using Groups2._0.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;

namespace Groups2._0.Controllers
{
  [Route("api/[controller]")]
  [Authorize]
  public class UserController : Controller
  {
    private UserManager<Chatterer> _userMgr;
    private SignInManager<Chatterer> _signMgr;
    private GroupsDbContext _groupsDb;
    public UserController(GroupsDbContext groupsDb, UserManager<Chatterer> userMgr, SignInManager<Chatterer> signMgr)
    {
      _userMgr = userMgr;
      _signMgr = signMgr;
      _groupsDb = groupsDb;
    }
    [HttpGet("info")]
    public async Task<JsonResult> Info()
    {
      try
      {
        var user = await _userMgr.GetUserAsync(User);
        return new JsonResult(new
        {
          name = user.UserName,
          group = user.Group,
          ingroup = (await _userMgr.FindByIdAsync(user.InGroupId))?.Group,
          pub_key = "BFnbEjZPGFowzLKbDeFjlJ-o5juCQWiaFUzDH6jb_H3Rid3EO8f59N8PSe5AAMp5KhLMV31u1V79RxBiAmeofH0"
        });
      }
      catch
      {
        await _signMgr.SignOutAsync();
        return null;
      }
    }
    [HttpPost("signout")]
    public async Task<ContentResult> SignOut()
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        await _signMgr.SignOutAsync();
        user.InGroupId = null;
        user.InGroupPassword = null;
        await _groupsDb.SaveChangesAsync();
        ret = "OK";
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
    [HttpPost("del")]
    public async Task<ContentResult> Delete([FromBody] SignRequest request)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        if (user.Email != request.Email.ToLower())
          ret = "wrong_email";
        else if ((await _signMgr.CheckPasswordSignInAsync(user, request.Password, false)).Succeeded != true)
          ret = "wrong_password";
        else
        {
          await _signMgr.SignOutAsync();
          _groupsDb.Messages.RemoveRange(_groupsDb.Messages.Where(m => m.Id.ToString() == user.Id));
          var grpUsrs = _userMgr.Users.Where(u => u.InGroupId == user.Id);
          foreach (var u in grpUsrs)
          {
            u.InGroupId = null;
            u.InGroupPassword = null;
          }
          _groupsDb.Users.Remove(user);
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
    [HttpPost("change")]
    public async Task<ContentResult> Change([FromBody] AccountChangeRequest request)
    {
      PasswordHasher<Chatterer> pHasher = new PasswordHasher<Chatterer>();
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        if ((await _signMgr.CheckPasswordSignInAsync(user, request.Password, false)).Succeeded != true)
          ret = "wrong_password";
        else if (request.NewName == null && request.NewPassword == null)
          ret = "no_change_requested";
        else
        {
          if (request.NewName != null && !StaticData.IsNameValid(request.NewName))
            ret = "invalid_name";
          else
          {
            if (request.NewName != null && request.NewName != user.UserName
            && request.NewPassword != null && request.NewPassword != request.Password)
            {
              if (request.NewName.Equals(user.UserName, StringComparison.OrdinalIgnoreCase))
              {
                user.UserName = request.NewName;
                user.PasswordHash = pHasher.HashPassword(user, request.Password);
                await _groupsDb.SaveChangesAsync();
                ret = "name&pass_changed";
              }
              else
              {
                if ((await _userMgr.FindByNameAsync(request.NewName)) != null)
                  ret = "name_exists";
                else
                {
                  user.UserName = request.NewName;
                  user.PasswordHash = pHasher.HashPassword(user, request.Password);
                  await _groupsDb.SaveChangesAsync();
                  ret = "name&pass_changed";
                }
              }
            }
            else if (request.NewName != null && request.NewName != user.UserName)
            {
              if (request.NewName.Equals(user.UserName, StringComparison.OrdinalIgnoreCase))
              {
                user.UserName = request.NewName;
                await _groupsDb.SaveChangesAsync();
                ret = "name_changed";
              }
              else
              {
                if ((await _userMgr.FindByNameAsync(request.NewName)) != null)
                  ret = "name_exists";
                else
                {
                  user.UserName = request.NewName;
                  await _groupsDb.SaveChangesAsync();
                  ret = "name_changed";
                }
              }
            }
            else if (request.NewPassword != null && request.NewPassword != request.Password)
            {
              user.PasswordHash = pHasher.HashPassword(user, request.Password);
              await _groupsDb.SaveChangesAsync();
              ret = "pass_changed";
            }
            else
              ret = "same_credentials";
          }
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
