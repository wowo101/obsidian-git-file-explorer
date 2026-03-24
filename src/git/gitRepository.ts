import simpleGit, { FileStatusResult, SimpleGit } from "simple-git";
import { join, dirname, relative } from "path";
import { existsSync } from "fs";
import { TerminalExecutor } from "./utils/terminalExecutor";

export class GitRepository {
	private git: SimpleGit;
	private subPath: string = "";

	private constructor(public repoAbsPath: string) {
		this.git = simpleGit(this.repoAbsPath);
	}

	static async getInstance(folderAbsPath: string): Promise<GitRepository> {
		const repoRoot = GitRepository.findGitRepoRoot(folderAbsPath);
		if (!repoRoot) {
			throw new Error("Not a git repository @ " + folderAbsPath);
		}

		const gitRepository = new GitRepository(repoRoot);
		gitRepository.subPath = relative(repoRoot, folderAbsPath).replace(/\\/g, "/");
		return gitRepository;
	}

	static isGitRepo(fullPath: string): boolean {
		const gitDir = join(fullPath, ".git");
		return existsSync(gitDir);
	}

	static findGitRepoRoot(startPath: string): string | null {
		let dir = startPath;
		while (true) {
			if (existsSync(join(dir, ".git"))) return dir;
			const parent = dirname(dir);
			if (parent === dir) return null;
			dir = parent;
		}
	}

	async hasRemote(): Promise<boolean> {
		const remotes = await this.git.getRemotes();
		return remotes.length > 0;
	}

	async getChangedFiles(): Promise<FileStatusResult[]> {
		const status = await this.git.status();
		if (!this.subPath) return status.files;

		const prefix = this.subPath + "/";
		return status.files
			.filter(f => f.path.replace(/\\/g, "/").startsWith(prefix))
			.map(f => ({ ...f, path: f.path.replace(/\\/g, "/").slice(prefix.length) }));
	}

	static async openDiff(repoAbsPath: string, relativePath: string = ""): Promise<void> {
		if (!GitRepository.findGitRepoRoot(repoAbsPath))
			throw new Error("Not a git repository @ " + repoAbsPath);

		const gitCmd = relativePath
			? `git difftool --no-prompt -- "${relativePath}"`
			: 'git difftool --no-prompt';

		await TerminalExecutor.execute(repoAbsPath, gitCmd);
	}
}
