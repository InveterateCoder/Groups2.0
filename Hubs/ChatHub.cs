using Groups2._0.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Groups2._0.Hubs
{
  public class MessageFromClient
  {
    public string[] To { get; set; }
    public string Text { get; set; }
  }
  public class MessageToClient
  {
    public long SharpTime { get; set; }
    public long JsTime { get; set; }
    public string StringTime { get; set; }
    public string From { get; set; }
    public string[] Peers { get; set; }
    public string Text { get; set; }
  }
  public class Time
  {
    public long SharpTime { get; set; }
    public long JsTime { get; set; }
    public string StringTime { get; set; }
  }
  [Authorize]
  public class ChatHub : Hub
  {
    private GroupsDbContext _groupDb;
    private UserManager<Chatterer> _usrMgr;
    public ChatHub(GroupsDbContext groupDb, UserManager<Chatterer> usrMgr)
    {
      _groupDb = groupDb;
      _usrMgr = usrMgr;
    }
    public async Task<string> Members()
    {
      try
      {
        var user = await _usrMgr.GetUserAsync(Context.User);
        var members = _groupDb.Users.Where(u => u.InGroupId == user.InGroupId);
        var onl = members.Where(c => c.ConnectionId != null).Select(c => c.UserName).ToArray();
        var ofl = members.Where(c => c.ConnectionId == null).Select(c => c.UserName).ToArray();
        return Newtonsoft.Json.JsonConvert.SerializeObject(new { online = onl, offline = ofl });
      }
      catch (Exception e)
      {
        throw new HubException(e.Message);
      }
    }
    public async Task SignOut()
    {
      var user = await _usrMgr.GetUserAsync(Context.User);
      try
      {
        await Clients.OthersInGroup(user.InGroupId).SendAsync("signed_out", user.UserName);
        await Groups.RemoveFromGroupAsync(user.ConnectionId, user.InGroupId);
        user.InGroupId = null;
        user.InGroupPassword = null;
        await _groupDb.SaveChangesAsync();
      }
      catch (Exception e)
      {
        throw new HubException(e.Message);
      }
    }
    public async Task<Time> MessageServer(MessageFromClient msg)
    {
      var user = await _usrMgr.GetUserAsync(Context.User);
      if (string.IsNullOrEmpty(msg.Text) || msg.Text.Length > 10000)
        throw new HubException("Message cannot be empty or exceed 10000 characters.");
      Time time = new Time();
      var timeNow = DateTime.UtcNow;
      if (user.LastActive > timeNow.Subtract(TimeSpan.FromSeconds(1.5)).Ticks)
        throw new HubException("You're messaging too fast.");
      time.SharpTime = timeNow.Ticks;
      user.LastActive = time.SharpTime;
      time.JsTime = StaticData.TicksToJsMs(time.SharpTime);
      time.StringTime = time.SharpTime.ToString();
      if (msg.To == null)
      {
        Chatterer group;
        if (user.InGroupId == user.Id)
          group = user;
        else
          group = await _usrMgr.FindByIdAsync(user.InGroupId);
        if (group == null)
          throw new HubException("Internal error, try again later");
        else
        {
          var retMsg = new MessageToClient
          {
            SharpTime = time.SharpTime,
            JsTime = time.JsTime,
            StringTime = time.StringTime,
            From = user.UserName,
            Peers = null,
            Text = msg.Text
          };
          await Clients.OthersInGroup(user.InGroupId).SendAsync("message_client", retMsg);
          await _groupDb.Messages.AddAsync(new Message
          {
            SharpTime = time.SharpTime,
            JsTime = time.JsTime,
            StringTime = time.StringTime,
            From = user.UserName,
            Text = msg.Text,
            GroupId = group.Id
          });
        }
      }
      else
      {
        if (msg.To.Length > 50)
          throw new HubException("You can't select more than 50 peers");
        foreach (var p in msg.To)
          if (p.Length > 64)
            throw new HubException("Corrupted data detected");
        var retMsg = new MessageToClient
        {
          SharpTime = time.SharpTime,
          JsTime = time.JsTime,
          StringTime = time.StringTime,
          From = user.UserName,
          Peers = msg.To,
          Text = msg.Text
        };
        await Clients.Clients(_groupDb.Users.Where(c => msg.To.Contains(c.UserName)).Select(c => c.ConnectionId).ToArray()).SendAsync("message_client", retMsg);
      }
      await _groupDb.SaveChangesAsync();
      return time;
    }
    public async override Task OnConnectedAsync()
    {
      var user = await _usrMgr.GetUserAsync(Context.User);
      user.ConnectionId = Context.ConnectionId;
      user.LastNotified = 0;
      user.LastActive = DateTime.UtcNow.Ticks;
      await _groupDb.SaveChangesAsync();
      await Groups.AddToGroupAsync(Context.ConnectionId, user.InGroupId);
      await Clients.OthersInGroup(user.InGroupId).SendAsync("go_on", user.UserName);
    }
    public async override Task OnDisconnectedAsync(Exception exception)
    {
      var user = await _usrMgr.GetUserAsync(Context.User);
      if (user.InGroupId != null)
      {
        await Clients.OthersInGroup(user.InGroupId).SendAsync("go_off", user.UserName);
        await Groups.RemoveFromGroupAsync(user.ConnectionId, user.InGroupId);
      }
      user.ConnectionId = null;
      user.LastActive = DateTime.UtcNow.Ticks;
      await _groupDb.SaveChangesAsync();
      await base.OnDisconnectedAsync(exception);
    }
  }
}