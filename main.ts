import { Plugin, FileSystemAdapter } from "obsidian";
import { GitRepository } from "./src/git/gitRepository";
import { NavColorUpdater } from "./src/navColorUpdater";
import { GitDiffHandler } from "src/gitDiffHandler";
import { ViewRemoteHandler } from "src/viewRemoteHandler";
import { ContextMenuInstaller } from "src/contextMenuInstaller";
import { CommandRegister } from "src/commandRegister";
import { CapabilityProvider } from "src/capabilityProvider";
import {
	DEFAULT_SETTINGS,
	GitFileExplorerPluginSettings,
	GitFileExplorerSettingTab,
} from "./src/settings";

export default class GitFileExplorerPlugin extends Plugin {
	settings: GitFileExplorerPluginSettings;
	private gitRepo: GitRepository | null = null;
	private navColorUpdater: NavColorUpdater | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GitFileExplorerSettingTab(this.app, this));

		if (this.app.workspace.layoutReady) {
			await this.initialize();
		} else {
			this.app.workspace.onLayoutReady(this.initialize);
		}
	}

	initialize = async () => {
		const vaultBasePath = this.getVaultBasePath();
		if (!vaultBasePath) return;

		const repoRoot = GitRepository.findGitRepoRoot(vaultBasePath);
		if (!repoRoot) return;

		try {
			this.gitRepo = await GitRepository.getInstance(vaultBasePath);
		} catch {
			return;
		}

		if (this.settings.enableNavColorUpdater) {
			this.navColorUpdater = new NavColorUpdater(this.settings.navColorStyle);
			await this.refreshFileColors();
		}

		this.registerEvent(this.app.vault.on("create", () => this.refreshFileColors()));
		this.registerEvent(this.app.vault.on("delete", () => this.refreshFileColors()));
		this.registerEvent(this.app.vault.on("rename", () => this.refreshFileColors()));
		this.registerEvent(this.app.vault.on("modify", () => this.refreshFileColors()));

		// Piggyback on Obsidian Git plugin's status detection
		// @ts-ignore — custom event from obsidian-git plugin
		this.registerEvent(this.app.workspace.on("obsidian-git:status-changed", () => this.refreshFileColors()));

		const capabilityProviders: CapabilityProvider[] = [
			new GitDiffHandler(vaultBasePath),
			new ViewRemoteHandler(vaultBasePath),
		];

		const contextMenuInstaller = new ContextMenuInstaller(this);
		const commandRegister = new CommandRegister(this);

		capabilityProviders.forEach(provider => {
			contextMenuInstaller.installContextMenu(provider);
			commandRegister.registerCommandForActiveFile(provider);
		});
	};

	private async refreshFileColors(): Promise<void> {
		if (!this.gitRepo || !this.navColorUpdater) return;
		try {
			const changedFiles = await this.gitRepo.getChangedFiles();
			this.navColorUpdater.update(changedFiles);
		} catch {
			// silently ignore git errors
		}
	}

	onunload() {
		this.navColorUpdater?.cleanup();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private getVaultBasePath(): string {
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getBasePath();
		}
		return "";
	}
}
