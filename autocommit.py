import subprocess
import datetime


def run_git_commands():
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"Auto-commit: {timestamp}"

    try:
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", commit_message], check=True)

        # CHANGED: 'main' to 'master' to match your local branch
        subprocess.run(["git", "push", "origin", "master"], check=True)

        print(f"Successfully pushed: {commit_message}")

    except subprocess.CalledProcessError as e:
        print(f"Error during git operation: {e}")


if __name__ == "__main__":
    run_git_commands()
