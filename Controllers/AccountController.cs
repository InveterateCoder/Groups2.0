using Groups2._0.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Groups2._0.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class AccountController : ControllerBase
  {
    private string emailText = "Welcome to Groups, {0}. This is an automatically generated message and the following is the confirmation number: {1}. Validity will expire in one hour.";
    private UserManager<Chatterer> _userMgr;
    private SignInManager<Chatterer> _signMgr;
    private GroupsDbContext _groupsDb;
    private Connections _connections;
    public AccountController(
      GroupsDbContext groupsDb,
      UserManager<Chatterer> userMgr,
      SignInManager<Chatterer> signMgr,
      Connections connections
      )
    {
      _userMgr = userMgr;
      _signMgr = signMgr;
      _groupsDb = groupsDb;
      _connections = connections;
    }
    [HttpPost("reg")]
    public async Task<ContentResult> RequestRegister([FromBody] RegRequest request)
    {
      string ret;
      if (User.Identity.IsAuthenticated)
        ret = "already_registered";
      else
      {
        try
        {
          request.Email = request.Email.ToLower();
          if ((await _userMgr.FindByEmailAsync(request.Email)) != null)
            ret = "email_is_taken";
          else if (!StaticData.IsNameValid(request.Name))
            ret = "invalid_name";
          else if ((await _userMgr.FindByNameAsync(request.Name)) != null)
            ret = "name_is_taken";
          else
          {
            Random rand = new Random();
            int code;
            do code = rand.Next(1234, 9876);
            while (_groupsDb.RegRequests.FirstOrDefault(r => r.Code == code) != null);
            _groupsDb.RegRequests.Add(new RegData
            {
              Code = code,
              RequestTime = DateTime.UtcNow.Ticks,
              Name = request.Name,
              Email = request.Email,
              Password = request.Password
            });
            await _groupsDb.SaveChangesAsync();
            await CleanInactiveUsers();
            var mret = await SendMail(request.Email, request.Name, code.ToString());
            if (mret != "ok") ret = mret;
            else ret = "pending_" + request.Email;
          }
        }
        catch (Exception e)
        {
          ret = e.Message;
        }
      }
      return Content(ret, "text/plain");
    }
    [HttpPost("val")]
    public async Task<ContentResult> Validate([Required, FromBody] int _id)
    {
      string ret;
      if (User.Identity.IsAuthenticated)
        ret = "already_validated";
      else
      {
        try
        {
          if (_id < 1234 || _id > 9876)
            throw new InvalidDataException("invalid_confirmation_id");
          var expirationTime = DateTime.UtcNow.Subtract(TimeSpan.FromHours(1)).Ticks;
          var overdueReq = _groupsDb.RegRequests.Where(r => r.RequestTime < expirationTime);
          var mustSave = false;
          if (overdueReq.Count() > 0)
          {
            _groupsDb.RegRequests.RemoveRange(overdueReq);
            mustSave = true;
          }
          var reqReq = _groupsDb.RegRequests.FirstOrDefault(r => r.Code == _id);
          if (reqReq == null)
          {
            ret = "reg_request_required";
            if (mustSave)
              await _groupsDb.SaveChangesAsync();
          }
          else
          {
            if ((await _userMgr.FindByEmailAsync(reqReq.Email)) != null)
            {
              ret = "email_is_taken";
              if (mustSave)
                await _groupsDb.SaveChangesAsync();
            }
            else if ((await _userMgr.FindByNameAsync(reqReq.Name)) != null)
            {
              ret = "name_is_taken";
              if (mustSave)
                await _groupsDb.SaveChangesAsync();
            }
            else
            {
              await _userMgr.CreateAsync(new Chatterer
              {
                UserName = reqReq.Name,
                Email = reqReq.Email
              }, reqReq.Password);
              ret = "added_" + reqReq.Email;
              _groupsDb.RegRequests.Remove(reqReq);
              await _groupsDb.SaveChangesAsync();
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
    [HttpPost("sign")]
    public async Task<ContentResult> SignIn([FromBody] SignRequest request)
    {
      string ret;
      try
      {
        if (User.Identity.IsAuthenticated)
          ret = "already_signed";
        else
        {
          var user = await _userMgr.FindByEmailAsync(request.Email);
          if (user == null)
            ret = "user_not_found";
          else
          {
            var result = await _signMgr.PasswordSignInAsync(user, request.Password, true, false);
            if (!result.Succeeded) ret = "failed";
            else ret = "OK";
          }
        }
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
    private async Task CleanInactiveUsers()
    {
      var limit = DateTime.UtcNow.Subtract(TimeSpan.FromDays(300)).Ticks;
      var inactiveUsrs = _userMgr.Users.Where(c => c.LastActive < limit);
      if (inactiveUsrs.Count() > 0)
      {
        var groupIds = inactiveUsrs.Where(c => c.Group != null).Select(u => u.Id);
        if (groupIds.Count() > 0)
        {
          foreach (var id in groupIds)
          {
            var inGroupUsrs = _userMgr.Users.Where(c => c.InGroupId == id);
            foreach (var usr in inGroupUsrs)
            {
              usr.InGroupId = null;
              usr.InGroupPassword = null;
            }
            _groupsDb.Messages.RemoveRange(_groupsDb.Messages.Where(m => m.GroupId == id));
          }
        }
        _groupsDb.Users.RemoveRange(inactiveUsrs);
        await _groupsDb.SaveChangesAsync();
      }
    }
    private async Task<string> SendMail(string to, string name, string code)
    {
      string mailContent = emailText, ret;
      mailContent = string.Format(mailContent, name, code);
      try
      {
        var msg = new SendGridMessage();
        msg.SetFrom(new EmailAddress("inveterate.coder@outlook.com", "Groups"));
        msg.AddTo(to);
        msg.SetSubject("Groups Registration Confirmation");
        msg.AddContent(MimeType.Text, mailContent);
        var client = new SendGridClient(_connections.SGKey);
        var response = await client.SendEmailAsync(msg);
        if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
          ret = "ok";
        else ret = "failed";
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return ret;
    }
  }
}