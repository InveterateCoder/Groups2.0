var app;
var notif_worker;
navigator.serviceWorker.register('/js/notif_worker.js').then(ret => notif_worker = ret);
document.addEventListener('DOMContentLoaded', () => app = new app_class());
class api_class {
  constructor() { }
  async register(chatterer) {
    try {
      let ret = false;
      let resp = await this.post('/api/account/reg', chatterer);
      switch (resp) {
        case "pending_" + chatterer.email:
          ret = true;
          break;
        case "signed_out":
          app.alert("You've been signed out, try again");
          break;
        case "email_is_taken":
          app.alert("This email address has been already registered");
          break;
        case "invalid_name":
          app.alert("Name cannot contain following characters: \\/:*?\"<>|&%#[]+=„“");
          break;
        case "name_is_taken":
          app.alert("This nickname has been already taken");
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async validate(number) {
    try {
      let ret = false;
      let resp = await this.post('api/account/val', number);
      if (resp.startsWith('added_'))
        ret = true;
      else if (resp == 'signed_out')
        app.alert("You've been signed out, try again");
      else if (resp == 'invalid_confirmation_id')
        app.alert('Wrong number');
      else if (resp == 'reg_request_required')
        app.alert('Registration is required prior to email verification');
      else if (resp == 'email_is_taken')
        app.alert("This email address has been already registered");
      else if (resp == 'name_is_taken')
        app.alert("This nickname has been already taken");
      else app.alert(resp);
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async signin(chatterer) {
    try {
      let ret = false;
      let resp = await this.post('api/account/sign', chatterer);
      if (resp == "OK")
        ret = await this.usr_info();
      else if (resp == 'signed_out')
        app.alert("You've been signed out, try again");
      else if (resp == 'user_not_found')
        app.alert("The email address is not registered");
      else if (resp == 'password_incorrect')
        app.alert('Wrong password');
      else if (resp == 'multiple_signins_forbidden')
        app.alert('Access denied, connection is already open');
      else
        app.alert(resp);
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async signout() {
    try {
      let ret = false;
      let resp = await this.post('api/user/signout');
      if (resp == 'OK' || resp == "not_authorized" || resp == "single_connection_only")
        ret = true;
      else
        app.alert(resp);
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async acc_change(request) {
    try {
      let ret = {
        name: false,
        pass: false
      };
      let resp = await this.post('api/user/change', request);
      switch (resp) {
        case "name_changed":
          ret.name = true;
          app.name = request.NewName;
          break;
        case "pass_changed":
          ret.pass = true;
          break;
        case "name&pass_changed":
          ret.name = true;
          ret.pass = true;
          app.name = request.NewName;
          break;
        case "invalid_name":
          app.alert("New name cannot contain following characters: \\/:*?\"<>|&%#[]+=„“")
          break;
        case "wrong_password":
          app.alert("Wrong password")
          break;
        case "name_exists":
          app.alert("The name is already taken, choose another one");
          break;
        case "no_change_requested":
          app.alert("Empty request");
          break;
        case "same_credentials":
          app.alert("No changes have been made, same credentials");
          break;
        case "not_authorized":
        case "single_connection_only":
          ret.pass = true;
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async acc_delete(signin) {
    try {
      let ret = false;
      let resp = await this.post('api/user/del', signin);
      switch (resp) {
        case "deleted":
          ret = true;
          break;
        case "wrong_email":
          app.alert("Wrong email address");
          break;
        case "wrong_password":
          app.alert("Wrong password");
          break;
        case "not_authorized":
        case "single_connection_only":
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async grp_reg(info) {
    try {
      let ret = false;
      let resp = await this.post("api/groups/reg", info);
      switch (resp) {
        case "OK":
          app.group = info.GroupName;
          ret = true;
          break;
        case "has_group":
          app.alert("You have already registered a group");
          break;
        case "invalid_name":
          app.alert("Group name cannot contain following characters: \\/:*?\"<>|&%#[]+=„“");
          break;
        case "name_taken":
          app.alert("A group with such name already exists");
          break;
        case "not_authorized":
        case "single_connection_only":
          ret = true;
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async grp_change(info) {
    try {
      let ret = false;
      let resp = await this.post("api/groups/change", info);
      switch (resp) {
        case "name_changed":
        case "name&pass_changed":
          app.group = info.NewGroupName;
        case "pass_changed":
        case "not_authorized":
        case "single_connection_only":
          ret = true;
          break;
        case "has_no_group":
          app.group = null;
          ret = true;
          break;
        case "wrong_password":
          app.alert("Wrong password");
          break;
        case "invalid_name":
          app.alert("New group name cannot contain following characters: \\/:*?\"<>|&%#[]+=„“");
          break;
        case "group_name_exists":
          app.alert("The group name is already taken, choose another one");
          break;
        case "not_changed":
          app.alert("No changes were made");
          break;
        case "no_change_requested":
          app.alert("No change was requested");
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async usr_info() {
    try {
      let ret = false;
      let fetresp = await fetch('api/user/info', {
        method: 'get',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (fetresp.status != 200) {
        app.name = null;
        app.group = null;
        app.ingroup = null;
        app.goto("reg");
      }
      else {
        let obj = await fetresp.json();
        if (obj.name != null) {
          app.name = obj.name;
          ret = true;
        }
        else
          app.name = null;
        if (obj.group != null)
          app.group = obj.group;
        else
          app.group = null;
        if (obj.ingroup != null)
          app.ingroup = obj.ingroup;
        else
          app.ingroup = null;
        app.pub_key = obj.pub_key;
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async grp_del(pass) {
    try {
      let ret = false;
      let resp = await this.post("api/groups/del", pass);
      switch (resp) {
        case "deleted":
        case "has_no_group":
          app.group = null;
          ret = true;
          break;
        case "wrong_password":
          app.alert("Wrong password");
          break;
        case "not_authorized":
        case "single_connection_only":
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async list_groups(start, quantity, query) {
    let ret = null;
    if (start != 0 && !start || isNaN(start) || start < 0)
      return null;
    if (!quantity && quantity != 0)
      ret = await this.get(`api/groups/list/${start}`, false);
    else {
      if (isNaN(quantity) || quantity < 1 || quantity > 100)
        return null;
      if (!query && query != 0)
        ret = await this.get(`api/groups/list/${start}/${quantity}`, false);
      else {
        if (query.length > 64)
          return null;
        else
          ret = await this.get(`api/groups/list/${start}/${quantity}/${query}`, false);
      }
    }
    return ret;
  }
  async grp_signin(request) {
    let ret = {
      success: false,
      hide: false
    }
    try {
      let resp = await this.post("api/groups/sign", request);
      switch (resp) {
        case "OK":
          app.ingroup = request.name;
          ret.success = true;
          break;
        case "already_signed":
          ret.hide = true;
          app.alert("Already signed into a group, please sign out to proceed");
          break;
        case "not_found":
          ret.hide = true;
          app.alert("Group doesn't exist")
          break;
        case "wrong_password":
          app.alert("Wrong group password, try again")
          break;
        default:
          app.alert(resp);
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async get_grp_msgs(ticks_str, quantity) {
    try {
      let ticks = Number(ticks_str);
      if (ticks != 0 && ticks < app.groupin.jsMsToTicks(Date.now() - 1296000000))
        return null;
      else {
        if (quantity < 1 || quantity > 100)
          return null;
        else {
          return await this.get(`api/groups/msgs/${ticks_str}/${quantity}`);
        }
      }
    }
    catch (err) {
      app.alert(err);
      return null;
    }
  }
  async get_missed_msgs(ticks_str) {
    try {
      let ticks = Number(ticks_str);
      if (ticks < app.groupin.jsMsToTicks(Date.now() - 86400000))
        return null;
      else return await this.get(`api/groups/msgs/missed/${ticks_str}`);
    }
    catch (err) {
      app.alert(err);
      return null;
    }
  }
  async subscribe(token) {
    try {
      let ret = await this.post("api/push/web/subscribe", token);
      if (ret != "OK") {
        app.alert(ret);
        return false;
      }
      return true;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async unsubscribe() {
    try {
      app.wait();
      let ret;
      let resp = await fetch("api/push/web/unsubscribe", { method: 'get', headers: { 'Accept': 'text/plain' } });
      app.resume();
      if (resp.status != 200) {
        app.fail("Error. Server responded with: " + resp.statusText);
        return false;
      }
      else
        ret = await resp.text();
      if (ret != 'OK') {
        app.alert(ret);
        return false;
      }
      else return true;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async push(name) {
    try {
      let ret = false;
      let resp = await this.post("api/push/web/push", name);
      switch (resp) {
        case "OK":
          ret = true;
          break;
        case "not_in_group":
          app.alert("You must be signed to a group.");
          break;
        case "s_not_subscribed":
          app.alert("You must be subscribed for notifications.");
          break;
        case "not_found":
          app.alert("User was not found.");
          break;
        case "not_same_group":
          app.alert("User is not in the same group.")
          break;
        case "r_not_subscribed":
          app.alert("User is not subscribed for notifications.");
          break;
        case "is_notified_hour":
          app.alert("User has been already invited. Active one hour policy. Please try later.");
          break;
        case "usr_active":
          app.alert("User is online and cannot be invited.");
          break;
        default:
          app.alert(resp);
          break;
      }
      return ret;
    }
    catch (err) {
      app.alert(err.message);
      return false;
    }
  }
  async post(addr, obj, foc = true) {
    app.wait(foc);
    let ret;
    try {
      let resp = await fetch(addr, {
        method: 'post',
        headers: {
          'Accept': 'text/plain', 'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj || '')
      });
      if (resp.status != 200) {
        app.fail("Error. Server responded with: " + resp.statusText);
        ret = null;
      }
      else
        ret = await resp.text();
    }
    catch (err) {
      ret = err.message;
    }
    finally {
      app.resume();
      return ret;
    }
  }
  async get(addr, foc = true) {
    app.wait(foc);
    let ret;
    try {
      let resp = await fetch(addr, {
        method: 'get',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (resp.status != 200) {
        app.fail("Error. Server responded with: " + resp.statusText);
        ret = null;
      }
      else
        ret = await resp.json();
    }
    catch (err) {
      ret.response = err.message;
    }
    finally {
      app.resume();
      return ret;
    }
  }
}

class reg_panel_class {
  constructor() {
    this.panel = document.getElementById('reg_panel');
    this.place = 'home';;
    this.email = null;
    this.password = null;
  }
  num(e) {
    if (isNaN(e.key))
      e.preventDefault();
  }
  pasteFilter(e) {
    if (isNaN(e.target.value))
      e.target.value = null;
  }
  clear() {
    let arr;
    switch (this.place) {
      case 'reg':
        arr = this.panel.children[2].getElementsByTagName('input');
        for (let i = 0; i < arr.length; i++)
          arr[i].value = null;
        break;
      case 'sign':
        arr = this.panel.children[3].getElementsByTagName('input');
        for (let i = 0; i < arr.length; i++)
          arr[i].value = null;
        break;
      case 'numb':
        this.panel.children[4].getElementsByTagName('input')[0].value = null;
        break;
    }
  }
  btn_hover(el) {
    el.firstElementChild.style.transform = "scale(1.1,1.1)";
  }
  btn_out(el) {
    el.firstElementChild.style.transform = "scale(1,1)";
  }
  btn_down(el) {
    el.firstElementChild.style.transform = "scale(0.9,0.9)";
  }
  btn_up(el) {
    el.firstElementChild.style.transform = "scale(1.1,1.1)";
  }
  goto(place) {
    switch (place) {
      case 'home':
        this.hide();
        this.panel.children[1].style.display = 'flex';
        this.place = place;
        break;
      case 'reg':
        this.hide();
        this.panel.children[2].style.display = 'flex';
        this.panel.children[2].children[1].children[1].focus();
        this.place = place;
        break;
      case 'sign':
        this.hide();
        this.panel.children[3].style.display = 'flex';
        this.panel.children[3].children[1].children[1].focus();
        this.place = place;
        break;
      case 'numb':
        this.hide();
        this.panel.children[4].style.display = 'flex';
        this.panel.children[4].children[1].firstElementChild.focus();
        this.place = place;
        break;
    }
  }
  hide() {
    switch (this.place) {
      case 'home':
        this.panel.children[1].style.display = 'none';
        break;
      case 'reg':
        this.clear();
        this.panel.children[2].style.display = 'none';
        break;
      case 'sign':
        this.clear();
        this.panel.children[3].style.display = 'none';
        break;
      case 'numb':
        this.clear();
        this.panel.children[4].style.display = 'none';
        break;
    }
  }
  register() {
    let form = this.panel.children[2].getElementsByTagName('input');
    let chatterer = {
      name: form[0].value,
      email: form[1].value,
      password: form[2].value
    };
    if (!app.validateName(chatterer.name))
      app.alert(app.message.name("Name"));
    else if (!chatterer.email || !form[1].checkValidity())
      app.alert('Incorrect email address');
    else if (!app.validatePassword(chatterer.password))
      app.alert(app.message.password("Password"));
    else {
      app.api.register(chatterer).then(ok => {
        if (ok) {
          this.email = chatterer.email;
          this.password = chatterer.password;
          this.goto("numb");
        }
      });
    }
  }
  validate() {
    let num = this.panel.children[4].getElementsByTagName('input')[0].value;
    if (num.length != 4)
      app.alert("Code must consist of 4 digits");
    else {
      app.api.validate(Number(num)).then(ok => {
        if (ok) {
          this.goto("sign");
          let form = this.panel.children[3].getElementsByTagName('input');
          form[0].value = this.email;
          form[1].value = this.password;
          this.email = this.password = null;
          this.signin();
        }
      });
    }
  }
  signin() {
    let form = this.panel.children[3].getElementsByTagName('input');
    let chatterer = {
      email: form[0].value,
      password: form[1].value
    };
    if (!chatterer.email || !form[0].checkValidity())
      app.alert("Incorrect email address");
    else if (!app.validatePassword(chatterer.password))
      app.alert(app.message.password("Password"));
    else app.api.signin(chatterer).then(ok => {
      if (ok) {
        if (app.ingroup)
          app.goto("ingroup");
        else app.goto('groups');
      }
    });
  }
  cntrl_key(key) {
    if (key == "Enter") {
      switch (this.place) {
        case 'reg':
          this.register();
          break;
        case 'sign':
          this.signin();
          break;
        case 'numb':
          this.validate();
          break;
      }
    }
    else if (key == "Escape") {
      if (this.place != 'home')
        this.goto('home');
    }
  }
}

class groups_class {
  constructor() {
    this.groups_window = document.getElementById('groups');
    this.hmbrgr_btn = document.getElementById('hmbrgr');
    this.m_acc = document.getElementById('m_account');
    this.m_group = document.getElementById('m_group');
    this.m_all = document.getElementById('m_all');
    this.account_btn = this.groups_window.children[2].children[2].children[0].children[0];
    this.group_btn = this.groups_window.children[2].children[2].children[0].children[1];
    this.acc_open = false;
    this.group_open = false;
    this.groups_forms = document.getElementById('groups_forms');
    this.start = 0;
    this.quantity = 100;
    this.query = '';
    this.timeoutHandle = null;
    this.open_form = null;
  }
  hmbrg_click() {
    this.hmbrgr_btn.classList.toggle('clicked');
    if (this.hmbrgr_btn.classList.contains('clicked')) {
      this.m_all.style.opacity = '1';
      this.m_all.style.transform = 'translate(0,0)';
    }
    else {
      this.m_all.style.opacity = '0';
      this.m_all.style.transform = `translate(0, -${this.m_all.offsetHeight}px)`;
    }
  }
  hmbrg_over() {
    for (let i = 0; i < this.hmbrgr_btn.children.length; i++) {
      this.hmbrgr_btn.children[i].style.backgroundColor = 'white';
      this.hmbrgr_btn.children[i].style.boxShadow = '0 0 4px white';
    }
  }
  hmbrg_out() {
    for (let i = 0; i < this.hmbrgr_btn.children.length; i++) {
      this.hmbrgr_btn.children[i].style.backgroundColor = 'silver';
      this.hmbrgr_btn.children[i].style.boxShadow = 'none';
    }
  }
  initialize(group = true) {
    this.close_all_menus();
    let height = this.groups_window.children[2].offsetHeight;
    this.groups_window.children[0].style.top = height + 'px';
    this.m_acc.style.right = '0px';
    this.m_acc.style.top = height + 'px';
    this.m_acc.style.width = this.account_btn.offsetWidth + 28 + 'px';
    this.m_group.style.right = this.m_acc.offsetWidth + 'px';
    this.m_group.style.top = height + 'px';
    this.m_group.style.width = this.group_btn.offsetWidth + 28 + 'px';
    if (group) this.group_conf();
    this.m_all.style.top = this.groups_window.children[2].offsetHeight + 'px';
    this.m_all.style.transform = `translate(0, -${this.m_all.offsetHeight}px)`;
    this.loaded = false;
  }
  group_conf() {
    if (app.group) {
      this.m_group.children[0].style.display = 'none';
      this.m_group.children[1].textContent = app.group;
      this.m_group.children[1].title = app.group;
      this.m_group.children[1].style.display = 'list-item';
      this.m_group.children[2].style.display = 'list-item';
      this.m_group.children[3].style.display = 'list-item';
      this.m_all.children[5].style.display = 'none';
      this.m_all.children[6].textContent = app.group;
      this.m_all.children[6].title = app.group;
      this.m_all.children[6].style.display = 'block';
      this.m_all.children[7].style.display = 'block';
      this.m_all.children[8].style.display = 'block';
    }
    else {
      this.m_group.children[0].style.display = 'list-item';
      this.m_group.children[1].style.display = 'none';
      this.m_group.children[2].style.display = 'none';
      this.m_group.children[3].style.display = 'none';
      this.m_all.children[5].style.display = 'block';
      this.m_all.children[6].style.display = 'none';
      this.m_all.children[7].style.display = 'none';
      this.m_all.children[8].style.display = 'none';
    }
  }
  m_accf() {
    this.m_proc(this.m_acc, this.account_btn, this.acc_open, true);
  }
  m_groupf() {
    this.m_proc(this.m_group, this.group_btn, this.group_open);
  }
  m_proc(el, btn, open, isacc = false) {
    if (open) {
      btn.classList.remove('open');
      if (isacc)
        this.acc_open = false;
      else
        this.group_open = false;
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    }
    else {
      btn.classList.add('open');
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.focus();
      if (isacc)
        this.acc_open = true;
      else
        this.group_open = true;
    }
  }
  m_onblur(el) {
    el.style.opacity = '0';
    if (el.id == 'm_account')
      this.account_btn.classList.remove('open');
    else
      this.group_btn.classList.remove('open');
    setTimeout(() => {
      if (el.id == 'm_account') {
        this.acc_open = false;
        this.m_acc.style.visibility = 'hidden';
      }
      else {
        this.group_open = false;
        this.m_group.style.visibility = 'hidden';
      }
    }, 170);
  }
  close_all_menus() {
    if (this.acc_open) {
      this.account_btn.classList.remove('open');
      this.acc_open = false;
      this.m_acc.style.opacity = '0';
      this.m_acc.style.visibility = 'hidden';
    }
    else if (this.group_open) {
      this.group_btn.classList.remove('open');
      this.group_open = false;
      this.m_group.style.opacity = '0';
      this.m_group.style.visibility = 'hidden';
    }
    if (this.hmbrgr_btn.classList.contains('clicked')) {
      this.hmbrgr_btn.classList.remove('clicked');
      this.m_all.style.opacity = '0';
      this.m_all.style.transform = `translate(0, -${this.m_all.offsetHeight}px)`;
    }
  }
  groups_resize() {
    this.initialize(false);
    if (this.loaded && this.groups_window.firstElementChild.scrollHeight - this.groups_window.firstElementChild.scrollTop < window.innerHeight + 300)
      this.list_load();
  }
  signout() {
    this.close_all_menus();
    app.api.signout().then(ok => {
      if (ok) {
        app.goto('reg');
        app.name = null;
        app.group = null;
      }
    });
  }
  form_open(n) {
    this.open_form = n;
    this.groups_forms.children[n].style.display = 'flex';
    this.groups_forms.style.display = 'block';
    this.close_all_menus();
  }
  form_close(n) {
    this.open_form = null;
    this.groups_forms.style.display = 'none';
    this.groups_forms.children[n].style.display = 'none';
    let form = this.groups_forms.children[n].getElementsByTagName('input');
    if (n == 4) {
      this.groups_forms.children[4].children[4].style.visibility = 'visible';
      form[2].checked = false;
      for (let i = 0; i < form.length; i++) {
        if (i == 2) continue;
        form[i].value = null;
      };
    }
    else
      for (let i = 0; i < form.length; i++) {
        form[i].value = null;
      };
  }
  acc_change() {
    let form = this.groups_forms.children[1].getElementsByTagName('input');
    let request = {
      Password: form[0].value,
      NewName: form[1].value,
      NewPassword: form[2].value
    };
    if (!app.validatePassword(request.Password))
      app.alert(app.message.password("Password"));
    else if (request.NewName.length > 0 && !app.validateName(request.NewName))
      app.alert(app.message.name("New name"));
    else if (request.NewPassword && !app.validatePassword(request.NewPassword))
      app.alert(app.message.password("New password"));
    else if (request.Password == request.NewPassword || request.NewName == app.name)
      app.alert("Leave blank if the credentials are the same");
    else if (!request.NewName && !request.NewPassword)
      app.alert("No change requested");
    else {
      if (request.NewName.length == 0)
        request.NewName = null;
      if (request.NewPassword.length == 0)
        request.NewPassword = null;
      app.api.acc_change(request).then(ret => {
        if (ret.name || ret.pass) {
          if (ret.name)
            this.groups_window.getElementsByTagName('code')[0].textContent = app.name;
          this.form_close(1);
        }
      });
    }
  }
  acc_delete() {
    let form = this.groups_forms.children[2].getElementsByTagName('input');
    let signin = {
      email: form[0].value,
      password: form[1].value
    };
    if (!signin.email || !form[0].checkValidity())
      app.alert("Incorrect email address");
    else if (!app.validatePassword(signin.password))
      app.alert(app.message.password("Password"));
    else {
      app.api.acc_delete(signin).then(ret => {
        if (ret) {
          app.goto('reg');
          app.name = null;
          app.group = null;
          this.form_close(2);
        }
      });
    }
  }
  group_create() {
    let form = this.groups_forms.children[3].getElementsByTagName('input');
    let info = {
      Password: form[0].value,
      GroupName: form[1].value,
      GroupPassword: form[2].value
    };
    if (!app.validatePassword(info.Password))
      app.alert(app.message.password("Password"));
    else if (!app.validateName(info.GroupName))
      app.alert(app.message.name("Group name"));
    else if (info.GroupPassword && !app.validatePassword(info.GroupPassword))
      app.alert(app.message.password("Group password"));
    else {
      if (info.GroupPassword.length == 0)
        info.GroupPassword = null;
      app.api.grp_reg(info).then(ret => {
        if (ret) {
          this.group_conf();
          this.list_clear();
          this.form_close(3);
          this.list_load();
        }
      });
    }
  }
  group_change() {
    let form = this.groups_forms.children[4].getElementsByTagName('input');
    let info = {
      Password: form[0].value,
      NewGroupName: form[1].value,
      NewGroupPassword: form[3].value
    };
    if (!app.validatePassword(info.Password))
      app.alert(app.message.password("Password"));
    else if (info.NewGroupName.length > 0 && !app.validateName(info.NewGroupName))
      app.alert(app.message.name("New name"));
    else if (!form[2].checked && info.NewGroupPassword && !app.validatePassword(info.NewGroupPassword))
      app.alert(app.message.password("New password"));
    else {
      if (form[2].checked) info.NewGroupPassword = null;
      else if (info.NewGroupPassword.length == 0) info.NewGroupPassword = "000";
      if (info.NewGroupName.length == 0)
        info.NewGroupName = null;
      if (!info.NewGroupName && info.NewGroupPassword == "000")
        app.alert("No change requested");
      else {
        app.api.grp_change(info).then(ret => {
          if (ret) {
            this.group_conf();
            this.list_clear();
            this.form_close(4);
            this.list_load();
          }
        });
      }
    }

  }
  group_del() {
    let pass = this.groups_forms.children[5].getElementsByTagName('input')[0].value;
    if (!app.validatePassword(pass))
      app.alert(app.message.password("Password"));
    else app.api.grp_del(pass).then(ret => {
      if (ret) {
        this.group_conf();
        this.list_clear();
        this.form_close(5);
        this.list_load();
      }
    });
  }
  on_pass_del_change(el) {
    if (el.checked)
      this.groups_forms.children[4].children[4].style.visibility = 'hidden';
    else
      this.groups_forms.children[4].children[4].style.visibility = 'visible';
  }
  list_clear() {
    let div = this.groups_window.firstElementChild;
    if (div.childElementCount > 0)
      while (div.firstElementChild)
        div.firstElementChild.remove();
    this.start = 0;
    this.quantity = 100;
  }
  list_add(list) {
    if (!list || !Array.isArray(list) || list.length == 0)
      return false;
    let div = this.groups_window.firstElementChild;
    list.forEach((str) => {
      if (typeof str == "string") {
        let node = document.createElement("button");
        var textnode = document.createTextNode(str);
        node.appendChild(textnode);
        node.onclick = () => app.groups.group_signin(str);
        node.tabIndex = -1;
        div.appendChild(node);
      }
    });
  }
  list_load() {
    if (this.quantity > 0) {
      app.api.list_groups(this.start, this.quantity, this.query).then(ret => {
        if (ret == 0) {
          this.quantity = 0;
          this.loaded = true;
        }
        else {
          if (typeof ret == "string") {
            app.alert(ret);
            this.loaded = true;
          }
          else if (Array.isArray(ret)) {
            this.start += ret.length;
            if (ret.length < this.quantity)
              this.quantity = 0;
            this.list_add(ret);
            if (this.groups_window.firstElementChild.scrollHeight < window.innerHeight + 300)
              this.list_load();
            else this.loaded = true;
          }
        }
      });
    }
  }
  on_scroll(el) {
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 300) {
      this.list_load();
    }
  }
  on_query_key(query) {
    this.set_list_timer(query);
  }
  on_query_paste(e) {
    this.set_list_timer(e.clipboardData.getData('Text'));
  }
  on_query_cut(el) {
    setTimeout(() => this.set_list_timer(el.value), 50);
  }
  set_list_timer(query) {
    if (query != this.query) {
      this.list_clear();
      this.query = query;
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = setTimeout(() => this.list_load(), 500);
    }
  }
  group_signin(group) {
    if (group && group == app.group) {
      this.close_all_menus();
      this.group_signin_send({ name: group, password: null });
    }
    else {
      let form = this.groups_forms.children[6].getElementsByTagName('input');
      form[0].value = group;
      this.form_open(6);
    }
  }
  group_signin_send(request = null) {
    if (!request) {
      let form = this.groups_forms.children[6].getElementsByTagName('input');
      request = {
        name: form[0].value,
        password: form[1].value
      }
    }
    if (!app.validateName(request.name))
      app.alert(app.message.name("Group name"));
    else if (request.password && !app.validatePassword(request.password))
      app.alert(app.message.password("Group password"));
    else {
      if (!request.password)
        request.password = null;
      app.api.grp_signin(request).then(ret => {
        if (ret.success) {
          if (this.groups_forms.children[6].style.display != 'none')
            this.form_close(6);
          app.goto('ingroup');
        }
        else if (ret.hide) {
          this.list_clear();
          this.list_load();
          if (this.groups_forms.children[6].style.display != 'none')
            this.form_close(6);
        }
      });
    }
  }
  cntrl_key(key) {
    if (key == "Enter") {
      if (this.open_form)
        this.groups_forms.children[this.open_form].lastElementChild.lastElementChild.click();
    }
    else if (key == "Escape") {
      if (this.open_form)
        this.groups_forms.children[this.open_form].lastElementChild.firstElementChild.click();
      else this.close_all_menus();
    }
  }
}

class ingroup_class {
  constructor() {
    this.dicon_cover = document.querySelector("#ingroup > #disconnected");
    this.msgs_panel = document.getElementById("ingroup").firstElementChild;
    this.msgs_panel.addEventListener("click", () => app.groupin.usrs_close(), true);
    this.msgs_cont = this.msgs_panel.children[1];
    this.msg_input = document.querySelector("#ingroup > div:first-child > input");
    this.usrs_panel = this.msgs_panel.nextElementSibling;
    this.secret_input = this.usrs_panel.firstElementChild.firstElementChild;
    this.open_btn = this.msgs_panel.firstElementChild.firstElementChild;
    this.close_btn = this.usrs_panel.firstElementChild.children[1];
    this.connection = new signalR.HubConnectionBuilder().withUrl("/hub").configureLogging(signalR.LogLevel.Error).build();
    this.connection.onclose(() => this.leave());
    this.connection.on("signed_out", name => this.member_signout(name));
    this.connection.on("go_off", name => this.usr_switch_off(name));
    this.connection.on("go_on", name => this.usr_joined(name));
    this.connection.on("message_client", msg => this.recieve_msg(msg));
    this.isMobile = false;
    this.usrs_panel_open = true;
    this.offl_usr = null;
    this.onl_usrs = new Set();
    this.btn_swtch = this.usrs_panel.children[2].firstElementChild;
    this.btn_notif = this.btn_swtch.nextElementSibling;
    this.btn_sound = this.btn_notif.nextElementSibling;
    this.is_cleared = false;
    this.onl_usr_panel = this.usrs_panel.children[3].firstElementChild;
    this.ofl_usr_panel = this.usrs_panel.children[3].children[2];
    this.arr_onl_usrs = null;
    this.arr_ofl_usrs = null;
    this.signingout = false;
    this.open_peers = null;
    this.upper_msg_el = null;
    this.upper_msg_time = "0";
    this.last_msg_time = null;
    this.end_reached = false;
    this.msgs_quantity = 30;
    this.isdown = true;
    this.scroll_handle = null;
    this.block_scroll = false;
    this.resize_handle = null;
    this.usr_state_changed = false;
    this.msgs_loaded = false;
    this.msg_pipe_handle = null;
    this.msg_pipe = [];
    this.msg_time = new Set();
    this.key = null;
    this.recieve_msg_mutex = false;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.audio = document.createElement("audio");
    let src = document.createElement("source");
    src.setAttribute("src", "sounds/new_m.mp3");
    src.setAttribute("type", "audio/mpeg");
    this.audio.appendChild(src);
    this.sound_on = false;
    this.wind_width = 0;
  }
  get secret() {
    let val = localStorage.getItem("secret");
    if (!val)
      return "";
    else return val;
  }
  set secret(val) {
    if (!val)
      localStorage.removeItem("secret");
    else
      localStorage.setItem("secret", val);
  }
  init() {
    this.dicon_cover.style.opacity = "0";
    setTimeout(() => app.groupin.dicon_cover.style.display = "none", 500);
    this.wind_width = window.innerWidth;
    this.config_mobile();
    this.members_get();
    if (!this.last_msg_time && !this.end_reached) {
      this.secret_input.value = "";
      let sec = this.secret;
      if (sec)
        for (let i = 0; i < sec.length; i++)
          this.secret_input.value += '-';
      if (!this.key && sec)
        this.toCryptoKey(this.secret).then(key => {
          this.key = key;
          this.get_msgs(true);
        });
      else
        this.get_msgs(true);
    }
    else this.get_missed_msgs(this.last_msg_time);
  }
  leave(page = false) {
    this.msg_input.setAttribute("disabled", "");
    this.dicon_cover.style.display = "block";
    this.dicon_cover.style.opacity = "1";
    this.usr_state_changed = false;
    this.clear_usrs();
    this.msgs_loaded = false;
    if (page) {
      this.msg_input.value = null;
      this.clear_msgs();
      this.key = null;
      this.secret_input.value = "";
    }
  }
  async members_get() {
    let ret = JSON.parse(await this.connection.invoke("Members"));
    if (!Array.isArray(ret.online) || !Array.isArray(ret.offline)) {
      this.signout();
      app.alert("Something went terribly wrong: " + ret);
    }
    else {
      this.arr_onl_usrs = ret.online;
      this.arr_ofl_usrs = ret.offline;
      this.arr_onl_usrs.splice(this.arr_onl_usrs.indexOf(app.name), 1);
      this.arr_onl_usrs.sort();
      this.arr_onl_usrs.forEach(name => this.onl_usr_panel.appendChild(this.create_name(name, true)));
      this.arr_ofl_usrs.sort();
      this.arr_ofl_usrs.forEach(name => {
        this.ofl_usr_panel.appendChild(this.create_name(name, false));
      });
      if (this.usr_state_changed) {
        this.usr_state_changed = false;
        this.clear_usrs();
        this.members_get();
      }
    }
  }
  clear_usrs() {
    this.arr_onl_usrs = null;
    this.arr_ofl_usrs = null;
    this.offl_usr = null;
    this.onl_usrs.clear();
    this.is_cleared = false;
    let remove_div = this.onl_usr_panel;
    this.onl_usr_panel = document.createElement("div");
    this.onl_usr_panel.setAttribute("id", "online_usrs");
    remove_div.parentElement.replaceChild(this.onl_usr_panel, remove_div);
    remove_div.remove();
    remove_div = this.ofl_usr_panel;
    this.ofl_usr_panel = document.createElement("div");
    this.ofl_usr_panel.setAttribute("id", "offline_usrs");
    remove_div.parentElement.replaceChild(this.ofl_usr_panel, remove_div);
    remove_div.remove();
    this.btn_swtch.firstElementChild.src = "/images/cancel_sel.svg";
    this.btn_swtch.classList.add("disabled");
    this.btn_notif.classList.add("disabled");
  }
  clear_msgs() {
    let remove_div = this.msgs_cont;
    this.msgs_cont = document.createElement("div");
    this.msgs_cont.setAttribute("onscroll", "app.groupin.scroll()");
    remove_div.parentElement.replaceChild(this.msgs_cont, remove_div);
    remove_div.remove();
    this.end_reached = false;
    this.last_msg_time = null;
    this.upper_msg_time = "0";
    this.upper_msg_el = null;
    this.msgs_cont.style.opacity = "0";
  }
  ingroup_resize() {
    this.msgs_cont.style.opacity = "0";
    if (window.innerWidth != this.wind_width) {
      this.wind_width = window.innerWidth;
      this.config_mobile();
      this.usrs_close();
    }
    if (this.isdown) {
      this.block_scroll = true;
      clearTimeout(this.resize_handle);
      this.resize_handle = setTimeout(() => {
        app.groupin.block_scroll = false;
        app.groupin.msgs_cont.scrollTop = app.groupin.msgs_cont.scrollHeight;
        app.groupin.msgs_cont.style.opacity = "1";
      }, 300);
    }
    else {
      clearTimeout(this.resize_handle);
      this.resize_handle = setTimeout(() => {
        app.groupin.msgs_cont.style.opacity = "1";
      }, 300);
    }
  }
  config_mobile() {
    if (this.isMobile && this.wind_width > 900) {
      this.isMobile = false;
      this.usrs_open();
      this.open_btn.style.display = this.close_btn.style.display = "none"
      this.open_btn.style.opacity = this.close_btn.style.opacity = "0";
    }
    else if (!this.isMobile && this.wind_width <= 900) {
      this.isMobile = true;
      this.usrs_close();
      this.open_btn.style.display = this.close_btn.style.display = "block"
      this.open_btn.style.opacity = "1";
      setTimeout(() => this.close_btn.style.opacity = "1", 400);
    }
  }
  usrs_close() {
    if (this.isMobile && this.usrs_panel_open) {
      this.usrs_panel_open = false;
      this.usrs_panel.style.transform = `translateX(-${this.usrs_panel.offsetWidth || 300}px)`;
    }
  }
  usrs_open() {
    if (!this.usrs_panel_open) {
      this.usrs_panel_open = true;
      this.usrs_panel.style.transform = `translateX(0)`;
    }
  }
  signout() {
    this.connection.invoke("SignOut").then(() => app.goto('groups')).catch(err => app.alert(err.message));
  }
  offl_usr_select(el) {
    if (this.offl_usr == null) {
      this.offl_usr = el;
      el.classList.add("selected");
      this.btn_notif.classList.remove("disabled");
    }
    else {
      if (this.offl_usr == el) {
        this.offl_usr = null;
        el.classList.remove("selected");
        this.btn_notif.classList.add("disabled");
      }
      else {
        this.offl_usr.classList.remove("selected");
        this.offl_usr = el;
        el.classList.add("selected");
      }
    }
  }
  onl_usr_select(el) {
    if (this.is_cleared) {
      this.onl_usrs.clear();
      this.btn_swtch.firstElementChild.src = "/images/cancel_sel.svg";
      this.onl_usrs.add(el);
      el.classList.add("selected");
      this.is_cleared = false;
    }
    else if (this.onl_usrs.has(el)) {
      this.onl_usrs.delete(el);
      el.classList.remove("selected");
      if (this.onl_usrs.size == 0) {
        this.btn_swtch.classList.add("disabled");
      }
    }
    else {
      if (this.onl_usrs.size == 0) {
        this.btn_swtch.classList.remove("disabled");
      }
      this.onl_usrs.add(el);
      el.classList.add("selected");
    }
  }
  switch_click() {
    if (this.onl_usrs.size != 0) {
      if (this.is_cleared) {
        this.onl_usrs.forEach(el => el.classList.add("selected"));
        this.is_cleared = false;
        this.btn_swtch.firstElementChild.src = "/images/cancel_sel.svg";
      }
      else {
        this.onl_usrs.forEach(el => el.classList.remove("selected"));
        this.is_cleared = true;
        this.btn_swtch.firstElementChild.src = "/images/selective.svg";
      }
    }
  }
  create_name(name, online) {
    let div = document.createElement("div");
    div.textContent = name;
    div.setAttribute("onclick", online ? "app.groupin.onl_usr_select(this)" : "app.groupin.offl_usr_select(this)");
    return div;
  }
  usr_joined(member) {
    this.usr_state_changed = true;
    if (!this.arr_onl_usrs)
      return;
    let index = this.arr_onl_usrs.indexOf(member);
    if (index > -1)
      return;
    index = this.arr_ofl_usrs.indexOf(member);
    if (index > -1) {
      if (this.offl_usr && member == this.offl_usr.textContent) {
        this.offl_usr = null;
        this.btn_notif.classList.add("disabled");
      }
      this.arr_ofl_usrs.splice(index, 1);
      this.ofl_usr_panel.children[index].remove();
    }
    this.arr_onl_usrs.push(member);
    this.arr_onl_usrs.sort(function (a, b) {
      if (a.toLowerCase() < b.toLowerCase()) return -1;
      if (a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
    index = this.arr_onl_usrs.indexOf(member);
    this.onl_usr_panel.insertBefore(this.create_name(member, true), this.onl_usr_panel.children[index]);
  }
  usr_switch_off(member) {
    this.usr_state_changed = true;
    if (!this.arr_onl_usrs)
      return;
    if (this.signingout) {
      this.signingout = false;
      return;
    }
    let index = this.arr_onl_usrs.indexOf(member);
    this.arr_onl_usrs.splice(index, 1);
    this.remove_el(this.onl_usr_panel.children[index]);
    this.arr_ofl_usrs.push(member);
    this.arr_ofl_usrs.sort(function (a, b) {
      if (a.toLowerCase() < b.toLowerCase()) return -1;
      if (a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
    index = this.arr_ofl_usrs.indexOf(member);
    this.ofl_usr_panel.insertBefore(this.create_name(member, false), this.ofl_usr_panel.children[index]);
  }
  member_signout(member) {
    this.usr_state_changed = true;
    if (!this.arr_onl_usrs)
      return;
    let index = this.arr_onl_usrs.indexOf(member);
    if (index > -1) {
      this.arr_onl_usrs.splice(index, 1);
      this.remove_el(this.onl_usr_panel.children[index]);
    }
    this.signingout = true;
  }
  remove_el(el) {
    if (this.onl_usrs.has(el)) {
      if (this.onl_usrs.size == 1) {
        if (this.is_cleared == true) {
          this.is_cleared = false;
          this.btn_swtch.firstElementChild.src = "/images/cancel_sel.svg";
        }
        this.btn_swtch.classList.add("disabled");
        this.onl_usrs.clear();
      }
      else
        this.onl_usrs.delete(el);
    }
    el.remove();
  }
  jsMsToTicks(jsMs) {
    return 621355968000000000 + jsMs * 10000;
  }
  ticksToJsMs(ticks) {
    return (ticks - 621355968000000000) / 10000;
  }
  form_time(jsMs) {
    let time;
    let month;
    let day;
    let hours;
    let minutes;
    if (jsMs != 0) {
      time = new Date(jsMs);
      month = time.getMonth().toString();
      if (month.length < 2)
        month = '0' + month;
      day = time.getDate().toString();
      if (day.length < 2)
        day = '0' + day;
      hours = time.getHours().toString();
      if (hours.length < 2)
        hours = '0' + hours;
      minutes = time.getMinutes().toString();
      if (minutes.length < 2)
        minutes = '0' + minutes;
    }
    else
      month = day = hours = minutes = "--";
    return day + '/' + month + ' ' + hours + ':' + minutes;
  }
  form_msg(msg) {
    let div = document.createElement("div");
    div.classList.add("message");
    div.appendChild(document.createElement("div"));
    div.appendChild(document.createElement("div"));
    div.firstElementChild.appendChild(document.createElement("img"));
    div.firstElementChild.appendChild(document.createElement("div"));
    div.firstElementChild.appendChild(document.createElement("div"));
    div.firstElementChild.appendChild(document.createElement("div"));
    div.firstElementChild.children[1].textContent = this.form_time(msg.jsTime);
    if (msg.peers) {
      div.firstElementChild.firstElementChild.src = "/images/reply.svg";
      div.firstElementChild.firstElementChild.setAttribute("draggable", "false");
      div.firstElementChild.firstElementChild.setAttribute("onclick", "app.groupin.reply_click(this)");
      div.firstElementChild.firstElementChild.classList.add("reply");
      div.firstElementChild.children[2].textContent = "Secret";
      div.firstElementChild.children[2].classList.add("secret");
      div.firstElementChild.children[2].setAttribute("onclick", "app.groupin.show_peers(this)");
      let ul = document.createElement("ul");
      msg.peers.forEach(peer => {
        let li = document.createElement("li");
        li.textContent = peer;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }
    else {
      div.firstElementChild.firstElementChild.src = "/images/message.svg";
      div.firstElementChild.firstElementChild.setAttribute("draggable", "false");
      div.firstElementChild.children[2].textContent = "Public";
    }
    div.firstElementChild.children[3].textContent = msg.from;
    div.children[1].textContent = msg.text;
    return div;
  }
  async recieve_msg(msg) {
    if (this.recieve_msg_mutex)
      setTimeout(() => app.groupin.recieve_msg(msg), 10);
    else {
      this.recieve_msg_mutex = true;
      if (!this.msgs_loaded) {
        this.msg_pipe.push(msg);
        this.recieve_msg_mutex = false;
        this.proc_pipe_msgs();
      }
      else {
        if (this.sound_on)
          this.audio.play();
        if (!msg.peers)
          this.last_msg_time = msg.stringTime;
        if (this.key)
          msg.text = await this.decrypt(msg.text);
        this.msgs_cont.appendChild(this.form_msg(msg));
        this.recieve_msg_mutex = false;
        if (this.isdown)
          this.msgs_cont.scrollTop = this.msgs_cont.scrollHeight;
      }
    }
  }
  async proc_pipe_msgs() {
    if (!app.groupin.msgs_loaded) {
      clearTimeout(app.groupin.msg_pipe_handle);
      app.groupin.msg_pipe_handle = setTimeout(app.groupin.proc_pipe_msgs, 50);
    }
    else {
      for (let i = 0; i < app.groupin.msg_pipe.length; i++) {
        let msg = app.groupin.msg_pipe[i];
        if (!app.groupin.msg_time.has(msg.stringTime)) await app.groupin.recieve_msg(msg);
      }
      app.groupin.msg_pipe.length = 0;
      app.groupin.msg_time.clear();
      app.groupin.msg_input.removeAttribute("disabled");
    }
  }
  onkey_input(ev) {
    if (ev.key == "Enter" && this.msg_input.value) {
      if (this.msg_input.value.length > 2500) {
        this.msg_input.value = "";
        app.alert("Message size is limited to 2500 characters");
        return;
      }
      var msg = null;
      if (this.onl_usrs.size == 0 || this.is_cleared == true) {
        msg = {
          to: null,
          text: this.msg_input.value
        };
      }
      else {
        let arr = [];
        this.onl_usrs.forEach(user => arr.push(user.textContent));
        msg = {
          to: arr,
          text: this.msg_input.value
        };
      }
      this.msg_input.value = null;
      let msgLoc = {
        jsTime: 0,
        from: app.name,
        peers: msg.to,
        text: msg.text
      };
      this.last_sent_message = this.form_msg(msgLoc);
      this.msgs_cont.appendChild(this.last_sent_message);
      this.msgs_cont.scrollTop = this.msgs_cont.scrollHeight;
      if (this.key) {
        this.encrypt(msg.text).then(enc_text => {
          msg.text = enc_text;
          this.send_msg(msg);
        });
      }
      else
        this.send_msg(msg);
    }
    else if (ev.key == "Escape")
      this.msg_input.blur();
  }
  send_msg(msg) {
    this.connection.invoke("MessageServer", msg).then(time => {
      this.last_msg_time = time.stringTime;
      this.last_sent_message.firstElementChild.children[1].textContent = this.form_time(time.jsTime);
    }).catch(err => {
      this.last_sent_message.children[1].style.color = "red";
      let msg = err.message;
      let index = msg.indexOf("HubException:");
      if (index > -1)
        msg = msg.substring(index + 14);
      app.alert(msg);
    });
  }
  show_peers(el) {
    let msg_shell = el.parentElement.parentElement;
    if (this.open_peers != null)
      this.open_peers.classList.remove("showpeers");
    if (this.open_peers != msg_shell) {
      this.open_peers = msg_shell;
      this.open_peers.classList.add("showpeers");
    }
    else
      this.open_peers = null;
    if (this.isdown)
      setTimeout(() => app.groupin.msgs_cont.scrollTop = app.groupin.msgs_cont.scrollHeight, 20);
  }
  reply_click(el) {
    let msg_shell = el.parentElement.parentElement;
    let list = [];
    for (let i = 0; i < msg_shell.children[2].children.length; i++) {
      if (msg_shell.children[2].children[i].textContent != app.name)
        list.push(msg_shell.children[2].children[i].textContent);
    }
    if (msg_shell.firstElementChild.children[3].textContent != app.name)
      list.push(msg_shell.firstElementChild.children[3].textContent);
    let cleared = false;
    if (list.length > 0) {
      for (let i = 0; i < this.onl_usr_panel.children.length; i++) {
        let index = list.indexOf(this.onl_usr_panel.children[i].textContent);
        if (index > -1) {
          if (!cleared) {
            cleared = true;
            if (this.onl_usrs.size > 0) {
              if (this.is_cleared == true) {
                this.is_cleared = false;
                this.btn_swtch.firstElementChild.src = "/images/cancel_sel.svg";
              }
              this.onl_usrs.clear();
            }
            else {
              this.btn_swtch.classList.remove("disabled");
            }
            for (let i = 0; i < this.onl_usr_panel.children.length; i++)
              this.onl_usr_panel.children[i].classList.remove("selected");
          }
          this.onl_usr_panel.children[i].classList.add("selected");
          this.onl_usrs.add(this.onl_usr_panel.children[i]);
          list.splice(index, 1);
        }
      }
    }
    if (cleared)
      this.msgs_panel.children[2].focus();
  }
  async get_msgs(initial = false) {
    if (!this.end_reached) {
      let ret = await app.api.get_grp_msgs(this.upper_msg_time, this.msgs_quantity);
      if (ret != null) {
        if (isNaN(ret)) {
          if (Array.isArray(ret)) {
            if (ret.length < this.msgs_quantity)
              this.end_reached = true;
            let initiated = false;
            if (!this.end_reached)
              this.upper_msg_time = ret[0].stringTime;
            if (!this.upper_msg_el)
              this.last_msg_time = ret[ret.length - 1].stringTime;
            let Previous = this.upper_msg_el;
            let scrl_height = this.msgs_cont.scrollHeight;
            for (let i = 0; i < ret.length; i++) {
              let msg = ret[i];
              if (this.key)
                msg.text = await this.decrypt(msg.text);
              let div = this.form_msg(msg);
              if (!initiated && !this.end_reached) {
                this.upper_msg_el = div;
                initiated = true;
              }
              if (Previous)
                this.msgs_cont.insertBefore(div, Previous);
              else {
                this.msg_time.add(msg.stringTime);
                this.msgs_cont.appendChild(div);
              }
            }
            if (initial) {
              clearTimeout(this.scroll_handle);
              this.scroll_handle = setTimeout(() => {
                app.groupin.msgs_cont.scrollTop = app.groupin.msgs_cont.scrollHeight;
                app.groupin.msgs_cont.style.opacity = "1";
              }, 200);
              if (this.msgs_cont.scrollHeight < this.msgs_cont.offsetHeight * 3)
                await this.get_msgs(initial);
              this.msgs_loaded = true;
              if (this.msg_pipe.length == 0)
                this.msg_input.removeAttribute("disabled");
            }
            else
              if (scrl_height < this.msgs_cont.scrollHeight)
                this.msgs_cont.scrollTop = this.msgs_cont.scrollHeight - scrl_height;
          }
          else {
            app.alert("Error. Server returned: " + ret);
            this.msgs_loaded = true;
            if (this.msg_pipe.length == 0)
              this.msg_input.removeAttribute("disabled");
          }
        }
        else {
          if (ret == 0) {
            this.end_reached = true;
            this.msgs_cont.style.opacity = "1";
            this.msgs_loaded = true;
            if (this.msg_pipe.length == 0)
              this.msg_input.removeAttribute("disabled");
          }
          else {
            this.msgs_loaded = true;
            if (this.msg_pipe.length == 0)
              this.msg_input.removeAttribute("disabled");
            app.alert("Something went wrong, try to reload the page");
          }
        }
      }
      else {
        this.msgs_loaded = true;
        if (this.msg_pipe.length == 0)
          this.msg_input.removeAttribute("disabled");
      }
    }
  }
  async get_missed_msgs() {
    let ret = await app.api.get_missed_msgs(this.last_msg_time);
    if (ret) {
      if (isNaN(ret)) {
        if (Array.isArray(ret)) {
          for (let i = 0; i < ret.length; i++) {
            let msg = ret[i];
            this.msg_time.add(msg.stringTime);
            if (this.key)
              msg.text = await this.decrypt(msg.text);
            this.msgs_cont.appendChild(this.form_msg(msg));
          }
          this.last_msg_time = ret[ret.length - 1].stringTime;
          if (this.isdown)
            this.msgs_cont.scrollTop = this.msgs_cont.scrollHeight;
        }
      }
      else {
        if (ret == -1)
          app.alert("Limit exceeded. Try to reload the page.");
      }
      this.msgs_loaded = true;
      if (this.msg_pipe.length == 0)
        this.msg_input.removeAttribute("disabled");
    }
    else {
      this.msgs_loaded = true;
      if (this.msg_pipe.length == 0)
        this.msg_input.removeAttribute("disabled");
    }
  }
  scroll() {
    if (!this.block_scroll) {
      if (this.msgs_cont.clientHeight + this.msgs_cont.scrollTop < this.msgs_cont.scrollHeight - 50) {
        this.isdown = false;
        this.msgs_cont.style.backgroundColor = "white";
        if (this.msgs_cont.scrollTop == 0)
          this.get_msgs();
      }
      else {
        this.isdown = true;
        this.msgs_cont.style.backgroundColor = "transparent";
      }
    }
  }
  secret_onfocus(el) {
    el.value = this.secret;
    el.placeholder = "";
  }
  secret_onblur(el) {
    el.placeholder = "Secret Word or Phrase";
    el.value = '';
    for (let i = 0; i < this.secret.length; i++)
      el.value += '-';
  }
  secret_onkey(e, el) {
    if (e.key == "Escape")
      el.blur();
    else if (e.key == "Enter") {
      if (el.value == this.secret)
        el.blur();
      else {
        this.secret = el.value;
        el.blur();
        this.reload_msgs();
      }
    }
  }
  async reload_msgs() {
    if (!this.secret)
      this.key = null;
    else
      this.key = await this.toCryptoKey(this.secret);
    this.clear_msgs();
    await this.get_msgs(true);
  }
  async toCryptoKey(txt_key) {
    let byte_arr = this.textToArr(txt_key);
    let hash_buffer = await crypto.subtle.digest('SHA-256', new Uint8Array(byte_arr));
    return await crypto.subtle.importKey(
      "raw", new Uint8Array(hash_buffer), "AES-CTR", false, ["encrypt", "decrypt"]);
  }
  textToArr(text) {
    let arr = [];
    for (let i = 0; i < text.length; i++)
      arr.push(text.charCodeAt(i));
    return arr;
  }
  async encrypt(text) {
    if (!this.key)
      return;
    let buf = await crypto.subtle.encrypt({ name: "AES-CTR", counter: new Uint8Array(16), length: 128 }, this.key, this.encoder.encode(text));
    return String.fromCharCode(...new Uint8Array(buf));
  }
  async decrypt(text) {
    if (!this.key)
      return;
    let buf = await crypto.subtle.decrypt({ name: "AES-CTR", counter: new Uint8Array(16), length: 128 }, this.key, new Uint8Array(this.textToArr(text)));
    return this.decoder.decode(new Uint8Array(buf));
  }
  notify() {
    if (this.offl_usr == null)
      return;
    if (Notification.permission != "granted") {
      app.alert("For you to be able to send notifications, you have to allow notifications for this web page in your browser's settings.");
      return;
    }
    app.api.push(this.offl_usr.textContent).then(ret => {
      if (ret)
        app.alert("User " + this.offl_usr.textContent + " has been invited");
      this.offl_usr.classList.remove("selected");
      this.btn_notif.classList.add("disabled");
      this.offl_usr = null;
    });
  }
  sound_toggle() {
    if (this.sound_on) {
      this.btn_sound.firstElementChild.src = "/images/sound_off.svg";
      this.sound_on = false;
    }
    else {
      this.btn_sound.firstElementChild.src = "/images/sound_on.svg";
      this.sound_on = true;
    }
  }
}

class app_class {
  constructor() {
    window.addEventListener('resize', () => this.on_resize());
    this.alert_el = document.getElementById("message");
    this.alert_btn = this.alert_el.firstElementChild.children[1];
    this.alert_btn.onclick = this.alert_hide;
    this.alert_active = false;
    this.wait_count = 0;
    this.wait_handle = null;
    this.wait_el = document.getElementById('wait');
    this.page = null;
    this.name = null;
    this.group = null;
    this.ingroup = null;
    this.pub_key = null;
    this.api = new api_class();
    this.reg_panel = new reg_panel_class();
    this.groups = new groups_class();
    this.groupin = new ingroup_class();
    setTimeout(() => {
      this.api.usr_info().then(ret => {
        if (ret) {
          if (this.ingroup)
            this.goto('ingroup');
          else
            this.goto('groups');
        }
      });
    }, 1300);
    this.message = {
      password: text => text + " must be at least 8 characters long and maximum 32",
      name: text => text + " must be at least 5 characters long and maximum 64"
    };
    navigator.permissions.query({ name: 'notifications' }).then(notifPerm => notifPerm.onchange = () => app.notif_perm_changed());
    document.addEventListener("keydown", this.key_pressed);
  }
  key_pressed(e) {
    if (app.alert_active)
      return;
    if (e.key == "Enter" || e.key == "Escape" && !e.repeat) {
      switch (app.page) {
        case 'reg':
          app.reg_panel.cntrl_key(e.key);
          break;
        case 'groups':
          app.groups.cntrl_key(e.key);
          break;
      }
    }
  }
  get pkey_array() {
    const padding = ' '.repeat((4 - this.pub_key.length % 4) % 4);
    const base64 = (this.pub_key + padding).replace(/\-/g, '+').replace(/_/g, '/');
    return new Uint8Array(Array.from(atob(base64), c => c.charCodeAt(0)));
  }
  on_resize() {
    switch (this.page) {
      case 'groups':
        this.groups.groups_resize();
        break;
      case 'ingroup':
        this.groupin.ingroup_resize();
        break;
    }
  }
  wait(foc = true) {
    if (++this.wait_count == 1)
      this.wait_handle = setTimeout(() => {
        app.wait_el.style.display = 'block';
        if (foc) app.wait_el.focus();
      }, 50);
  }
  resume() {
    if (--this.wait_count == 0) {
      clearTimeout(this.wait_handle);
      this.wait_el.style.display = 'none';
    }
  }
  alert(message) {
    this.alert_active = true;
    app.alert_el.style.display = 'block';
    app.alert_el.focus();
    setTimeout(() => app.alert_btn.focus(), 150);
    app.alert_el.firstElementChild.firstElementChild.textContent = message;
  }
  alert_hide() {
    app.alert_el.style.display = 'none';
    app.alert_active = false;
  }
  fail(text) {
    document.cookie = "Auth_Tok=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    app.name = null;
    app.group = null;
    app.ingroup = null;
    app.goto('reg');
    if (text)
      app.alert(text);
  }
  goto(place) {
    if (this.page == place)
      return;
    switch (place) {
      case 'reg':
        this.groupin.secret = null;
        document.body.children[0].style.display = 'block';
        document.body.children[0].focus();
        this.hide('reg');
        break;
      case 'groups':
        this.groupin.loaded = false;
        this.groupin.secret = null;
        this.groups.list_clear();
        this.groups.list_load();
        this.groups.groups_window.getElementsByTagName('code')[0].textContent = this.name;
        this.groups.groups_window.getElementsByTagName('code')[0].title = this.name;
        document.body.children[1].style.display = 'block';
        document.body.children[1].focus();
        this.groups.initialize();
        this.hide('groups');
        break;
      case 'ingroup':
        switch (Notification.permission) {
          case 'default':
            this.alert_btn.onclick = () => this.proceed_ingroup(true);
            this.alert("Shortly you'll be prompted to allow this website send you push notifications. " +
              "In order to allow group users send you notifications and for you to be able to notify them, please allow.");
            break;
          case 'denied':
            this.alert_btn.onclick = () => this.proceed_ingroup();
            this.alert("Your notifications are disabled. To be able to receive and send group notifications, " +
              "please enable notifications in your browser settings for this website");
            break;
          case 'granted':
            this.load_ingroup();
            break;
        }
        break;
    }
  }
  proceed_ingroup(def = false) {
    this.alert_hide();
    this.alert_btn.onclick = () => this.alert_hide();
    if (def)
      Notification.requestPermission().then(() => this.load_ingroup());
    else this.load_ingroup();
  }
  load_ingroup() {
    app.notif_subscribe();
    app.groupin.connection.start().then(() => {
      app.groupin.init();
      app.groupin.usrs_panel.children[1].textContent = app.name;
      app.groupin.open_btn.nextElementSibling.textContent = app.ingroup;
      app.groupin.open_btn.nextElementSibling.title = 'In Group: ' + app.ingroup;
      document.body.children[2].style.display = 'block';
      document.body.children[2].focus();
      document.addEventListener("visibilitychange", app.visib_change);
      app.hide('ingroup');
    });
  }
  hide(place) {
    switch (this.page) {
      case 'reg':
        document.body.children[0].style.display = 'none';
        try {
          app.reg_panel.goto('home');
        }
        catch (err) { }
        break;
      case 'groups':
        document.body.children[1].style.display = 'none';
        this.groups.groups_window.children[2].children[1].value = null;
        this.groups.query = '';
        break;
      case 'ingroup':
        this.groupin.connection.stop().then(() => {
          app.groupin.leave(true);
          document.body.children[2].style.display = 'none';
          document.removeEventListener("visibilitychange", this.visib_change);
        });
        break;
    }
    this.page = place;
  }
  validatePassword(password) {
    if (!password || password.length < 8 || password.length > 32)
      return false;
    else
      return true;
  }
  validateName(name) {
    if (!name || name.length < 5 || name.length > 64)
      return false;
    else
      return true;
  }
  visib_change() {
    switch (document.visibilityState) {
      case "hidden":
        app.groupin.connection.stop().catch(err => app.alert(err));
        break;
      case "visible":
        app.groupin.connection.start().then(() => app.groupin.init()).catch(err => app.alert(err));
        break;
    }
  }
  async notif_subscribe() {
    if (Notification.permission == 'granted') {
      try {
        let ret;
        let subs = await notif_worker.pushManager.getSubscription();
        if (subs) {
          ret = await app.api.subscribe(subs);
          if (!ret) {
            subs.unsubscribe();
            app.fail()
          }
        }
        else {
          subs = await notif_worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.pkey_array });
          if (subs) {
            ret = await app.api.subscribe(subs);
            if (!ret) {
              subs.unsubscribe();
              app.fail()
            }
          }
          else app.fail("System failed");
        }
      }
      catch (err) {
        app.fail(err.message);
      }
    }
    else app.api.unsubscribe();
  }
  notif_perm_changed() {
    window.location.reload();
  }
}
