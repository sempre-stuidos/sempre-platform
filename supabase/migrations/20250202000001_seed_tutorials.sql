-- ============================================================================
-- Seed Tutorial Data
-- ============================================================================

-- Events CRUD Tutorials

-- Creating Events
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Creating Events',
  'Learn how to create new events for your restaurant, including jazz nights, special dinners, and monthly events.',
  'Events',
  'IconPlus',
  '5 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Navigate to Events",
      "description": "Go to the Events page from the sidebar",
      "content": "Click on ''Events'' in the Site section of the sidebar navigation. This will take you to the Events management page where you can see all your existing events."
    },
    {
      "stepNumber": 2,
      "title": "Click New Event",
      "description": "Click the ''New Event'' button in the top right",
      "content": "On the Events page, you''ll see a ''New Event'' button in the top right corner. Click this button to start creating a new event."
    },
    {
      "stepNumber": 3,
      "title": "Fill in Event Details",
      "description": "Enter the basic information for your event",
      "content": "Fill in the required fields:\n- Title: The name of your event (e.g., ''Jazz Night with The Blue Notes'')\n- Short Description: A brief summary that appears in event listings\n- Description: Full details about the event\n- Event Type: Category (e.g., Jazz, Brunch, Wine Tasting)"
    },
    {
      "stepNumber": 4,
      "title": "Set Event Date and Time",
      "description": "Configure when your event starts and ends",
      "content": "Set the event timing:\n- Start Date & Time: When the event begins\n- End Date & Time: When the event concludes\nThese dates determine when the event is active."
    },
    {
      "stepNumber": 5,
      "title": "Configure Visibility Window",
      "description": "Set when the event should be visible on your website",
      "content": "Set the publish dates:\n- Publish Start: When the event should appear on your website\n- Publish End: When the event should be removed from your website\nLeave publish end empty for ongoing visibility."
    },
    {
      "stepNumber": 6,
      "title": "Upload Event Image",
      "description": "Add a visual representation of your event",
      "content": "Upload an image that represents your event. This image will be displayed on your website and in event listings. Recommended size: 1200x800 pixels."
    },
    {
      "stepNumber": 7,
      "title": "Save Your Event",
      "description": "Save the event as draft or publish it",
      "content": "Click ''Save'' to save your event. You can save it as a draft to edit later, or set the publish dates to make it live immediately. The event status will automatically update based on the current date and publish window."
    }
  ]
}'::jsonb
);

-- Events CRUD Tutorials

-- Editing Events
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Editing Events',
  'Learn how to update existing events, modify details, and change event status.',
  'Events',
  'IconEdit',
  '4 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Find Your Event",
      "description": "Locate the event you want to edit",
      "content": "Go to the Events page and use the search bar or tabs (Upcoming, Past, Drafts, All) to find the event you want to edit. You can also click directly on an event row to open it."
    },
    {
      "stepNumber": 2,
      "title": "Open Event Editor",
      "description": "Click on the event to open the edit form",
      "content": "Click on any event in the table to open the event editor. Alternatively, click the three-dot menu (\u22ee) on the right side of an event row and select ''Edit''."
    },
    {
      "stepNumber": 3,
      "title": "Modify Event Information",
      "description": "Update any fields you want to change",
      "content": "You can edit any field in the event form:\n- Title, description, and event type\n- Start and end dates/times\n- Publish start and end dates\n- Event image\nAll changes are saved when you click ''Save''."
    },
    {
      "stepNumber": 4,
      "title": "Update Event Status",
      "description": "Change how the event appears",
      "content": "The event status is automatically computed based on dates, but you can:\n- Save as Draft: Keep it hidden until you set publish dates\n- Set Publish Dates: Make it visible on your website\n- The status will show as Scheduled, Live, or Past based on current date"
    },
    {
      "stepNumber": 5,
      "title": "Save Changes",
      "description": "Save your updated event",
      "content": "Click ''Save'' to update the event. The changes will be reflected immediately. If you modified publish dates, the event visibility on your website will update accordingly."
    }
  ]
}'::jsonb
);

-- Events CRUD Tutorials

-- Managing Event Status
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Managing Event Status',
  'Understand how event statuses work and how to control when events are visible.',
  'Events',
  'IconCalendar',
  '3 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Understand Event Statuses",
      "description": "Learn what each status means",
      "content": "Events have five possible statuses:\n- Draft: Not published, not visible on website\n- Scheduled: Publish date is in the future\n- Live: Currently visible on website (within publish window)\n- Past: Event has ended or publish window has closed\n- Archived: Manually archived, hidden from normal view"
    },
    {
      "stepNumber": 2,
      "title": "Set Publish Dates",
      "description": "Control when events appear on your website",
      "content": "To make an event visible:\n- Set Publish Start: When it should appear\n- Set Publish End (optional): When it should be removed\n- If no publish end is set, the event stays visible until the event end date"
    },
    {
      "stepNumber": 3,
      "title": "View Events by Status",
      "description": "Use tabs to filter events",
      "content": "On the Events page, use the tabs to filter:\n- Upcoming: Shows Scheduled and Live events\n- Past: Shows completed events\n- Drafts: Shows unpublished events\n- All: Shows everything"
    },
    {
      "stepNumber": 4,
      "title": "Status Updates Automatically",
      "description": "Status changes based on dates",
      "content": "Event status updates automatically:\n- When current date reaches publish start \u2192 becomes Live\n- When event ends or publish end passes \u2192 becomes Past\n- You don''t need to manually change status for these transitions"
    }
  ]
}'::jsonb
);

-- Events CRUD Tutorials

-- Archiving Events
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Archiving Events',
  'Learn how to archive events to hide them from normal view while keeping them for reference.',
  'Events',
  'IconArchive',
  '2 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Locate the Event",
      "description": "Find the event you want to archive",
      "content": "Navigate to the Events page and find the event you want to archive. You can use search or filter tabs to locate it quickly."
    },
    {
      "stepNumber": 2,
      "title": "Open Actions Menu",
      "description": "Click the three-dot menu on the event",
      "content": "On the right side of the event row, click the three-dot menu (\u22ee) button. This opens a dropdown menu with available actions."
    },
    {
      "stepNumber": 3,
      "title": "Select Archive",
      "description": "Choose the Archive option",
      "content": "Click ''Archive'' from the dropdown menu. A confirmation will appear, and the event will be archived immediately."
    },
    {
      "stepNumber": 4,
      "title": "Archived Events",
      "description": "Understand what happens to archived events",
      "content": "When archived:\n- Event status changes to ''Archived''\n- Event is hidden from normal event listings\n- Event is removed from your website\n- Event data is preserved for future reference\n- You can still access archived events by viewing ''All'' events"
    }
  ]
}'::jsonb
);

-- Menu CRUD Tutorials

-- Creating Menu Items
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Creating Menu Items',
  'Learn how to add new items to your restaurant menu, including dishes, drinks, and specials.',
  'Menu',
  'IconPlus',
  '6 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Navigate to Menu",
      "description": "Go to the Menu page from the sidebar",
      "content": "Click on ''Menu'' in the Site section of the sidebar navigation. This will take you to the Menu management page where you can see all your menu categories and items."
    },
    {
      "stepNumber": 2,
      "title": "Select a Category",
      "description": "Choose or create a menu category",
      "content": "Menu items are organized by categories (e.g., Appetizers, Main Courses, Desserts, Drinks). Either select an existing category or create a new one by clicking ''Add Category''."
    },
    {
      "stepNumber": 3,
      "title": "Click Add Item",
      "description": "Start creating a new menu item",
      "content": "Within a category, click the ''Add Item'' button. This opens a form where you can enter all the details for your new menu item."
    },
    {
      "stepNumber": 4,
      "title": "Enter Item Details",
      "description": "Fill in the menu item information",
      "content": "Enter the following information:\n- Name: The dish or item name\n- Description: Detailed description of the item\n- Price: Set the price (enter as dollars, e.g., 24.99)\n- Category: Ensure it''s in the correct category"
    },
    {
      "stepNumber": 5,
      "title": "Upload Item Image",
      "description": "Add a photo of the menu item",
      "content": "Upload an appetizing image of your menu item. This helps customers visualize what they''re ordering. Recommended size: 800x600 pixels. The image will be displayed on your website menu."
    },
    {
      "stepNumber": 6,
      "title": "Set Visibility Options",
      "description": "Control item visibility and features",
      "content": "Configure visibility:\n- Visible: Toggle to show/hide the item on your website\n- Featured: Mark as featured to highlight it\n- Position: Set the order within the category (lower numbers appear first)"
    },
    {
      "stepNumber": 7,
      "title": "Save the Menu Item",
      "description": "Save your new menu item",
      "content": "Click ''Save'' to add the item to your menu. The item will immediately appear in the category on your menu management page and will be visible on your website (if visibility is enabled)."
    }
  ]
}'::jsonb
);

-- Menu CRUD Tutorials

-- Editing Menu Items
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Editing Menu Items',
  'Learn how to update existing menu items, change prices, descriptions, and visibility.',
  'Menu',
  'IconEdit',
  '4 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Find the Menu Item",
      "description": "Locate the item you want to edit",
      "content": "Go to the Menu page and expand the category containing the item you want to edit. You can also use the search functionality if available to quickly find specific items."
    },
    {
      "stepNumber": 2,
      "title": "Open Item Editor",
      "description": "Click on the menu item to edit",
      "content": "Click on the menu item card or row. This will open the item editor where you can modify all the item details."
    },
    {
      "stepNumber": 3,
      "title": "Update Item Information",
      "description": "Modify any fields you want to change",
      "content": "You can edit:\n- Name and description\n- Price (update to reflect current pricing)\n- Image (upload a new image or keep existing)\n- Category (move to a different category if needed)"
    },
    {
      "stepNumber": 4,
      "title": "Adjust Visibility Settings",
      "description": "Change visibility and featured status",
      "content": "Update visibility options:\n- Toggle Visible: Show or hide the item on your website\n- Toggle Featured: Add or remove featured status\n- Adjust Position: Change the order within the category"
    },
    {
      "stepNumber": 5,
      "title": "Save Changes",
      "description": "Save your updated menu item",
      "content": "Click ''Save'' to update the menu item. Changes will be reflected immediately on both the management page and your website. If you changed the price, the new price will be visible to customers right away."
    }
  ]
}'::jsonb
);

-- Menu CRUD Tutorials

-- Managing Menu Categories
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Managing Menu Categories',
  'Learn how to organize your menu with categories, reorder them, and manage category settings.',
  'Menu',
  'IconMenu2',
  '5 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "View Menu Categories",
      "description": "See all your menu categories",
      "content": "On the Menu page, you''ll see all your menu categories listed. Categories help organize your menu items into logical sections like Appetizers, Main Courses, Desserts, etc."
    },
    {
      "stepNumber": 2,
      "title": "Create a New Category",
      "description": "Add a new category to organize items",
      "content": "Click ''Add Category'' or the ''+'' button. Enter:\n- Category Name: e.g., ''Seasonal Specials''\n- Menu Type: Select the menu type (Brunch, Dinner, Lunch, etc.)\n- Sort Order: Set the display order (lower numbers appear first)"
    },
    {
      "stepNumber": 3,
      "title": "Edit Category Details",
      "description": "Update category name and settings",
      "content": "Click on a category to edit it. You can:\n- Change the category name\n- Update the menu type\n- Adjust the sort order\n- Toggle category visibility"
    },
    {
      "stepNumber": 4,
      "title": "Reorder Categories",
      "description": "Change the display order of categories",
      "content": "Adjust the sort order numbers to control how categories appear on your website. Categories with lower sort order numbers appear first. For example, set Appetizers to 1, Main Courses to 2, Desserts to 3."
    },
    {
      "stepNumber": 5,
      "title": "Delete or Archive Categories",
      "description": "Remove categories you no longer need",
      "content": "If a category is no longer needed, you can delete it. Note: Make sure to move or delete all menu items in the category first, as deleting a category with items may cause issues."
    }
  ]
}'::jsonb
);

-- Menu CRUD Tutorials

-- Deleting Menu Items
INSERT INTO public.tutorials (title, description, category, icon, estimated_time, content) VALUES (
  'Deleting Menu Items',
  'Learn how to remove menu items from your menu when they are no longer available.',
  'Menu',
  'IconTrash',
  '2 min',
  '{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Find the Menu Item",
      "description": "Locate the item you want to delete",
      "content": "Navigate to the Menu page and find the menu item you want to remove. Expand the category if needed to see all items."
    },
    {
      "stepNumber": 2,
      "title": "Open Item Actions",
      "description": "Access the delete option",
      "content": "Click on the menu item to open the editor, or look for a delete/trash icon or menu option associated with the item."
    },
    {
      "stepNumber": 3,
      "title": "Confirm Deletion",
      "description": "Confirm that you want to delete the item",
      "content": "Click the delete button. A confirmation dialog will appear asking you to confirm the deletion. This prevents accidental deletions."
    },
    {
      "stepNumber": 4,
      "title": "Item Removed",
      "description": "Understand what happens after deletion",
      "content": "Once confirmed:\n- The menu item is permanently removed from your menu\n- It will no longer appear on your website\n- The item is removed from the category\n- This action cannot be undone, so make sure you want to delete it"
    },
    {
      "stepNumber": 5,
      "title": "Alternative: Hide Instead of Delete",
      "description": "Consider hiding items temporarily",
      "content": "Instead of deleting, you can toggle the ''Visible'' option to hide the item. This keeps the item in your system but hides it from customers. Useful for seasonal items you might bring back later."
    }
  ]
}'::jsonb
);
