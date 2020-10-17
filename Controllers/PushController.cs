using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Groups2._0.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Groups2._0.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  [Authorize]
  public class PushController : ControllerBase
  {
    private UserManager<Chatterer> _userMgr;
    private SignInManager<Chatterer> _signMgr;
    private GroupsDbContext _groupsDb;
    private Connections _connections;
    public PushController(
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
    [HttpPost("web/subscribe")]
    public async Task<ContentResult> WebSubscribe([Required, FromBody] Subscription subscription)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        user.WebSubscription = subscription.ToString();
        await _groupsDb.SaveChangesAsync();
        ret = "OK";
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
    [HttpGet("web/unsubscribe")]
    public async Task<ContentResult> WebUnsubscribe()
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        user.WebSubscription = null;
        await _groupsDb.SaveChangesAsync();
        ret = "OK";
      }
      catch (Exception e)
      {
        ret = e.Message;
      }
      return Content(ret, "text/plain");
    }
    [HttpPost("web/push")]
    public async Task<ContentResult> Push([Required, FromBody] string name)
    {
      var user = await _userMgr.GetUserAsync(User);
      string ret;
      try
      {
        if (user.InGroupId == null)
          ret = "not_in_group";
        else
        {
          if (user.WebSubscription == null)
            ret = "s_not_subscribed";
          else
          {
            var rcvr = _groupsDb.Users.Where(c => c.InGroupId == user.InGroupId).SingleOrDefault(c => c.UserName == name);
            if (rcvr == null)
              ret = "not_found";
            else
            {
              if (rcvr.InGroupId != user.InGroupId)
                ret = "not_same_group";
              else
              {
                var web_subscription = StaticData.GetPushSubscription(rcvr.WebSubscription);
                if (web_subscription == null)
                  ret = "r_not_subscribed";
                else
                {
                  if (rcvr.LastNotified > DateTime.UtcNow.Subtract(TimeSpan.FromHours(1)).Ticks)
                    ret = "is_notified_hour";
                  else
                  {
                    if (rcvr.ConnectionId != null)
                      ret = "usr_active";
                    else
                    {
                      ValueTask<Chatterer> groupN = _groupsDb.Users.FindAsync(rcvr.InGroupId);
                      WebPush.WebPushClient client = new WebPush.WebPushClient();
                      WebPush.VapidDetails det = new WebPush.VapidDetails("mailto:splendiferouslife@outlook.com",
                          _connections.vapidPublic, _connections.vapidPrivate);
                      client.SetVapidDetails(det);
                      var groupName = (await groupN).Group;
                      var send_task = client.SendNotificationAsync(web_subscription, $"\"{groupName}\" by {user.UserName}");
                      rcvr.LastNotified = DateTime.UtcNow.Ticks;
                      var save_task = _groupsDb.SaveChangesAsync();
                      await Task.WhenAll(send_task, save_task);
                      ret = "OK";
                    }
                  }
                }
              }
            }
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
