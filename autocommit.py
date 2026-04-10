import subprocess
import datetime


def run_git_commands():
    # Get current time for the commit message
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"Auto-commit: {timestamp}"

    try:
        # 1. Add all changes
        subprocess.run(["git", "add", "."], check=True)

        # 2. Commit
        subprocess.run(["git", "commit", "-m", commit_message], check=True)

        # 3. Push to main
        subprocess.run(["git", "push", "origin", "main"], check=True)

        print(f"Successfully pushed: {commit_message}")

    except subprocess.CalledProcessError as e:
        print(f"Error during git operation: {e}")


if __name__ == "__main__":
    run_git_commands()
