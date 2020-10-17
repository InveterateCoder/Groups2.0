namespace Groups2._0
{
  public static class StaticData
  {
    private static readonly string _forbiddenChars = "\\/:*?\"<>|&%#[]+=„“";
    public static string RootPath;
    public static readonly string AuthenticationCookieName = "Auth_Tok";
    public static bool IsNameValid(string name)
    {
      foreach (var c in name)
        if (_forbiddenChars.Contains(c))
          return false;
      return true;
    }
    public static long JsMsToTicks(long jsMs) => 621355968000000000 + jsMs * 10000;
    public static long TicksToJsMs(long ticks) => (ticks - 621355968000000000) / 10000;
    public static WebPush.PushSubscription GetPushSubscription(string subscription)
    {
      if (subscription == null)
        return null;
      else
        return Subscription.FromJson(subscription).FormWebPushSubscription();
    }
  }
  public class Subscription
  {
    public struct KeysStruct
    {
      public string P256DH;
      public string Auth;
    }
    public string Endpoint;
    public string ExpirationTime;
    public KeysStruct Keys;
    public WebPush.PushSubscription FormWebPushSubscription()
    {
      return new WebPush.PushSubscription
      {
        Auth = Keys.Auth,
        P256DH = Keys.P256DH,
        Endpoint = Endpoint
      };
    }
    public static Subscription FromJson(string json) => Newtonsoft.Json.JsonConvert.DeserializeObject<Subscription>(json);
    public override string ToString()
    {
      return Newtonsoft.Json.JsonConvert.SerializeObject(this);
    }
  }
}
