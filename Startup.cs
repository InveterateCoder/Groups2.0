using Groups2._0.Hubs;
using Groups2._0.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Groups2._0
{
  public class Startup
  {
    private IConfiguration Configuration;
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }
    public void ConfigureServices(IServiceCollection services)
    {
      var connectionStrings = Configuration.GetSection("ConnectionStrings");
      var connections = connectionStrings.Get<Connections>();
      services.AddSingleton<Connections>(connections);
      services.AddDbContext<GroupsDbContext>(opts => opts.UseMySql(connections.Users));
      services.AddIdentity<Chatterer, IdentityRole>(opts =>
      {
        opts.User.AllowedUserNameCharacters = string.Empty;
        opts.User.RequireUniqueEmail = true;
        opts.Password.RequiredLength = 8;
        opts.Password.RequireUppercase = false;
        opts.Password.RequireNonAlphanumeric = false;
        opts.Password.RequireDigit = false;
        opts.Password.RequireLowercase = false;
        opts.Password.RequiredUniqueChars = 0;
      }).AddEntityFrameworkStores<GroupsDbContext>();
      services.AddResponseCaching();
      services.AddRazorPages();
      services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_3_0);
      services.AddSignalR().AddAzureSignalR(connections.SignalR);
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
      StaticData.RootPath = env.ContentRootPath;
      if (env.IsDevelopment())
        app.UseDeveloperExceptionPage();
      else
        app.UseHsts();
      app.UseHttpsRedirection();
      app.UseStaticFiles();
      app.UseRouting();
      app.UseAuthentication();
      app.UseAuthorization();
      app.UseResponseCaching();
      app.UseEndpoints(endpoints =>
      {
        endpoints.MapRazorPages();
        endpoints.MapControllers();
        endpoints.MapHub<ChatHub>("/hub");
      });
    }
  }
}