const UUID = 'favservices@andre.srv.br'
const Applet = imports.ui.applet;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const AppletDir = imports.ui.appletManager.appletMeta[UUID].path;
const Settings = imports.ui.settings;

let [ok, contents] = GLib.file_get_contents(`${AppletDir}/services.json`)
const services = JSON.parse(contents)

class MyApplet extends Applet.IconApplet {
  constructor(orientation, panel_height, instance_id){
    super(orientation, panel_height, instance_id);
    this._orientation = orientation

    this.set_applet_icon_name('bookmark-new-list');
    this.set_applet_tooltip(_('Favorite services'));
    this.settings = new Settings.AppletSettings(this, UUID, this.instance_id);
    this.settings.bindProperty(Settings.BindingDirection.IN, "services", "services", this.settingsChanged, null);
    this.refresh();
  }

  on_applet_clicked(){
    this.refresh()
    this.menu.toggle()
  }

  refresh(){
    this.menuManager = new PopupMenu.PopupMenuManager(this)
    this.menu = new Applet.AppletPopupMenu(this, this._orientation)
    this.menuManager.addMenu(this.menu)

    this.services.map(item => {
      let { service,  label} = item
      let isActive = isServiceActive(service)
      let menuItem = new PopupMenu.PopupSwitchMenuItem(label, isActive)
      menuItem.connect('toggled', function(event){
        let action = event.state? 'start' : 'stop'
        Util.spawnCommandLine(`sudo systemctl ${action} ${service}`)
      })
      this.menu.addMenuItem(menuItem)
    })
  }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}

function isServiceActive(service) {
  let [result, out, err] = GLib.spawn_command_line_sync(`sudo systemctl is-active ${service}`)
  return out.toString().replace(/\W/g, '') === 'active'
}
