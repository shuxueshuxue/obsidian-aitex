import aitex from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SettingTab extends PluginSettingTab {
  plugin: aitex;

  constructor(app: App, plugin: aitex) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("API key")
    //   .setDesc("Default date format")
      .addText((text) =>
        text
          .setPlaceholder("Your key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
    
      new Setting(containerEl)
      .setName("Endpoint")
    //   .setDesc("Default date format")
      .addText((text) =>
        text
          .setPlaceholder("API endpoint")
          .setValue(this.plugin.settings.endpoint)
          .onChange(async (value) => {
            this.plugin.settings.endpoint = value;
            await this.plugin.saveSettings();
          })
      );
  }
}