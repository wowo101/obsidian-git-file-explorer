import * as path from "path";

export type GitNode = { path: string };

export class NavColorUpdater {
    private styleEl: HTMLStyleElement;
    private lastPaths: string = "";

    constructor(
        private navColorStyle: "colored-text" | "margin-highlight" = "colored-text",
        private repoRelPath: string = ""
    ) {
        this.styleEl = document.createElement('style');
        document.head.appendChild(this.styleEl);
    }

    update(gitNodes: GitNode[]) {
        const changedPaths = gitNodes.map((node) => {
            const rel = node.path.replace(/\\/g, "/");
            if (this.repoRelPath) {
                return path.posix.normalize(`${this.repoRelPath}/${rel}`);
            }
            return rel;
        });

        const key = changedPaths.sort().join("\n");
        if (key === this.lastPaths) return;
        this.lastPaths = key;

        const cssRules: string[] = [];

        const fileStyle = this.navColorStyle === "colored-text"
            ? `color: #b38522 !important;`
            : `color: #b38522 !important; border-left: 3px solid var(--git-changed-file-color, #b38522);`;

        changedPaths.forEach(changedPath => {
            const escapedPath = CSS.escape(changedPath);

            cssRules.push(`
                .nav-file-title[data-path="${escapedPath}"] {
                    ${fileStyle}
                }
            `);

            let parentPath = path.dirname(changedPath);
            while (parentPath && parentPath !== "." && parentPath !== "/") {
                const escapedParentPath = CSS.escape(parentPath);

                cssRules.push(`
                    .nav-folder-title[data-path="${escapedParentPath}"] {
                        ${fileStyle}
                    }
                `);

                parentPath = path.dirname(parentPath);
            }
        });

        this.styleEl.textContent = cssRules.join('\n');
    }

    cleanup() {
        if (this.styleEl?.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
        }
    }
}
