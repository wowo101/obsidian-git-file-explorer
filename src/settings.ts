import GitFileExplorerPlugin from "./../main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface GitFileExplorerPluginSettings {
	enableNavColorUpdater: boolean;
	navColorStyle: "colored-text" | "margin-highlight";
}

export const DEFAULT_SETTINGS: Partial<GitFileExplorerPluginSettings> = {
	enableNavColorUpdater: true,
	navColorStyle: "colored-text",
};

export class GitFileExplorerSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: GitFileExplorerPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Highlight changed files")
			.setDesc(
				"Change the color of new and modified files in the file explorer based on git status"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableNavColorUpdater)
					.onChange(async (value) => {
						this.plugin.settings.enableNavColorUpdater = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Highlight style")
			.setDesc("Choose how changed files should be highlighted")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("colored-text", "Colored text")
					.addOption("margin-highlight", "Margin highlight + colored text")
					.setValue(this.plugin.settings.navColorStyle)
					.onChange(async (value: "colored-text" | "margin-highlight") => {
						this.plugin.settings.navColorStyle = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl
			.createEl("p")
			.createEl("i")
			.setText("Changes require restarting Obsidian");

		this.containerEl.createEl("h2", { text: "About" });

		const paragraph = containerEl.createEl("small");
		paragraph.setText("Made with ☕ by ");
		paragraph
			.createEl("a", { href: "https://blog.mmolina.me" })
			.setText("Mateus Molina");
	}
}
