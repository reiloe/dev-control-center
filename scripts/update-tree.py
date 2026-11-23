import os
import re

ROOT_NAME = "dev-control-center"
IGNORE = {
    ".git",
    ".gradle",
    ".mvn",
    ".idea",
    ".vscode",
    "target",
    "build",
    "node_modules",
    "dist",
    "__pycache__",
    ".DS_Store",
    ".sonar",
    ".scannerwork",
    "coverage",
}


def generate_tree(dir_path, prefix=""):
    entries = sorted(
        [e for e in os.listdir(dir_path) if e not in IGNORE],
        key=lambda x: (not os.path.isdir(os.path.join(dir_path, x)), x.lower()),
    )
    lines = []
    for i, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        is_last = i == len(entries) - 1
        connector = "└── " if is_last else "├── "
        lines.append(f"{prefix}{connector}{entry}")
        if os.path.isdir(path):
            extension = "    " if is_last else "│   "
            lines.extend(generate_tree(path, prefix + extension))
    return lines


def main():
    tree_lines = [f"{ROOT_NAME}/"] + generate_tree(".")
    tree_block = "<!-- TREE_START -->\n```text\n" + "\n".join(tree_lines) + "\n```\n<!-- TREE_END -->"

    with open("README.md", "r", encoding="utf-8") as f:
        content = f.read()

    updated = re.sub(
        r"<!-- TREE_START -->.*?<!-- TREE_END -->",
        tree_block,
        content,
        flags=re.DOTALL,
    )

    if updated != content:
        with open("README.md", "w", encoding="utf-8") as f:
            f.write(updated)
        print("README.md: Project Structure wurde automatisch aktualisiert.")


if __name__ == "__main__":
    main()
