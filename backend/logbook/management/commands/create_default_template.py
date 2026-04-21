from django.core.management.base import BaseCommand
from logbook.models import LogTemplate


class Command(BaseCommand):
    help = 'Creates the default log template with guided prompts'

    def handle(self, *args, **options):
        template, created = LogTemplate.objects.update_or_create(
            name='Standard Weekly Log',
            defaults={
                'description': 'Standard template for weekly internship logs with guided prompts',
                'activities_prompts': [
                    'What tasks/projects did you work on this week?',
                    'What meetings or training sessions did you attend?',
                    'Did you collaborate with team members? How?',
                    'What tools or technologies did you use?',
                    'Did you complete any milestones or deliverables?',
                ],
                'challenges_prompts': [
                    'What obstacles did you encounter?',
                    'Were there any technical difficulties?',
                    'Did you face any communication challenges?',
                    'What did you struggle to understand?',
                    'How did you overcome these challenges?',
                ],
                'skills_prompts': [
                    'What technical skills did you develop?',
                    'What soft skills did you practice?',
                    'What new knowledge did you gain?',
                    'How did this week contribute to your learning goals?',
                    'What would you like to learn more about?',
                ],
                'is_default': True,
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('Default template created successfully'))
        else:
            self.stdout.write(self.style.SUCCESS('Default template updated successfully'))
