#!/usr/bin/env python3
"""Auto-commit and push script that commits and pushes changes every 1 minute."""

import subprocess
import time
from datetime import datetime


def run_git_command(args):
    """Run a git command and return the output."""
    result = subprocess.run(
        ["git"] + args,
        capture_output=True,
        text=True
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def auto_commit():
    """Check for changes and commit if any exist."""
    # Check if there are any changes
    returncode, stdout, _ = run_git_command(["status", "--porcelain"])

    if returncode != 0:
        print("Error: Not a git repository or git is not installed")
        return False

    if not stdout:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] No changes to commit")
        return False

    # Stage all changes
    run_git_command(["add", "-A"])

    # Create commit with timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"Auto-commit: {timestamp}"

    returncode, _, stderr = run_git_command(["commit", "-m", commit_message])

    if returncode == 0:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Committed: {commit_message}")

        # Push to remote
        push_code, _, push_err = run_git_command(["push", "origin", "main"])
        if push_code == 0:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Pushed to GitHub")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Push failed: {push_err}")
        return True
    else:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Commit failed: {stderr}")
        return False


def main():
    """Main loop that runs auto-commit every minute."""
    print("Auto-commit & push started. Press Ctrl+C to stop.")
    print("Pushing to: https://github.com/Kalyangotimothy/ILES.git")
    print("Checking for changes every 60 seconds...\n")

    try:
        while True:
            auto_commit()
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nAuto-commit stopped.")


if __name__ == "__main__":
    main()
