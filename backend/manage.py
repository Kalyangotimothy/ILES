#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    
    # IMPROVEMENT: Use an environment variable for settings, 
    # defaulting to 'config.settings.local' if not specified.
    # This prevents accidentally running dev settings on a production server.
    settings_module = os.getenv('DJANGO_SETTINGS_MODULE', 'config.settings')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Check: \n"
            "1. Is your virtual environment activated?\n"
            "2. Did you run 'pip install -r requirements.txt'?\n"
            "3. Is PYTHONPATH set correctly?"
        ) from exc
        
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
