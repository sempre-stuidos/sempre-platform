import type { Step } from 'driver.js';

export const eventCreationTourSteps: Step[] = [
  {
    element: '[data-tour="events-page"]',
    popover: {
      title: 'Navigate to Events',
      description: 'You\'re on the Events page. This is where you can see all your existing events and create new ones.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="new-event-button"]',
    popover: {
      title: 'Click New Event',
      description: 'Click the "New Event" button below (not the Next button) to navigate to the event creation form. The tour will continue automatically.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="title"]',
    popover: {
      title: 'Fill in Event Details',
      description: 'Enter the title of your event. This is the name that will appear in event listings (e.g., "Jazz Night with The Blue Notes").',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="short-description"]',
    popover: {
      title: 'Add Short Description',
      description: 'Enter a brief summary (1-2 lines) that will appear in event listings. This helps users quickly understand what the event is about.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="description"]',
    popover: {
      title: 'Write Full Description',
      description: 'Provide full details about your event. This longer description will be shown on the event detail page.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="event-type"]',
    popover: {
      title: 'Select Event Type',
      description: 'Choose a category for your event (e.g., Jazz, Brunch, Wine Tasting). This helps organize and filter events.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="start-date"]',
    popover: {
      title: 'Set Event Date and Time',
      description: 'Set when your event starts. Enter the start date - this determines when the event is active.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="start-time"]',
    popover: {
      title: 'Set Start Time',
      description: 'Enter the time when your event begins.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="end-date"]',
    popover: {
      title: 'Set End Date',
      description: 'Enter the date when your event concludes.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="end-time"]',
    popover: {
      title: 'Set End Time',
      description: 'Enter the time when your event ends.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="publish-start"]',
    popover: {
      title: 'Configure Visibility Window',
      description: 'Set when the event should appear on your website. Enter the publish start date and time to control when it becomes visible.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="publish-end"]',
    popover: {
      title: 'Set Publish End (Optional)',
      description: 'Optionally set when the event should be removed from your website. Leave empty for ongoing visibility.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="image-upload"]',
    popover: {
      title: 'Upload Event Image',
      description: 'Add a visual representation of your event. Upload an image or enter a URL. This image will be displayed on your website and in event listings. Recommended size: 1200x800 pixels.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="save-button"]',
    popover: {
      title: 'Save Your Event',
      description: 'Click "Save" to save your event. You can save it as a draft to edit later, or set the publish dates to make it live immediately. The event status will automatically update based on the current date and publish window.',
      side: 'top',
      align: 'center',
    },
  },
];

