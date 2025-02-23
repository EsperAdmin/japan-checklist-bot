# Japan Checklist Bot

Welcome to **Japan Checklist!**, a Discord bot made to help you plan your trip in Japan. This bot is very simple, add items to your check list and complete them! You can also add other users to your check list for collabrative planning!


## Features

- **Trip Management**: Create up to 10 trips per user, each with a unique UUID.
- **Checklist Items**: Add up to 25 items per trip, mark them as complete/incomplete, and remove them as needed.
- **Collaboration**: Invite others to join your trips via a request/accept system.
- **Pagination**: View trips, items, and more with easy-to-navigate pages.
- **Owner Tools**: Bot owner can manage all trips and blacklist users.
- **Fun Extra**: Get random Japan images with `/japan`.
- **Safety**: Filters out inappropriate language from trip and item names.
- **Stats**: Check bot usage stats like active trips and server count.

## How to Use

### Commands
Run these slash commands in your Discord server:

| Command           | Description                                          | Example Usage                  |
|-------------------|------------------------------------------------------|--------------------------------|
| `/active`         | Set a trip as your active trip using its ID.         | `/active trip_id:<uuid>`       |
| `/add`            | Add an item to your active trip (max 25).            | `/add item:Sunscreen`          |
| `/adduser`        | Send a request to add a user to your active trip.    | `/adduser user:@Friend`        |
| `/admin`          | Owner-only: View/manage all trips.                   | `/admin blacklist`             |
| `/complete`       | Mark an item as complete in your active trip.        | `/complete item_id:1`          |
| `/create`         | Create a new trip (max 10) and set it as active.     | `/create name:Beach Trip`      |
| `/delete`         | Delete a trip by ID (creator only).                  | `/delete trip_id:<uuid>`       |
| `/help`           | View all commands with details (paginated).          | `/help`                        |
| `/japan`          | Get a random image of Japan.                         | `/japan`                       |
| `/list`           | List all your trips with pagination.                 | `/list`                        |
| `/remove`         | Remove an item from your active trip.                | `/remove item_id:1`            |
| `/removeuser`     | Remove a user from your active trip.                 | `/removeuser user:@Friend`     |
| `/requests`       | View and accept/decline trip join requests.          | `/requests`                    |
| `/stats`          | View bot statistics.                                 | `/stats`                       |
| `/uncomplete`     | Mark an item as incomplete in your active trip.      | `/uncomplete item_id:1`        |
| `/view`           | View your active trip or a specific trip by name.    | `/view name:Beach Trip`        |

### Example Workflow
1. **Create a Trip**: `/create name:Road Trip`
2. **Add Items**: `/add item:Snacks`, `/add item:Map`
3. **Invite a Friend**: `/adduser user:@Friend`
4. **Friend Accepts**: Friend runs `/requests` and clicks "Accept"
5. **Manage Checklist**: `/complete item_id:1`, `/view`

## Setup Instructions

### Prerequisites
- **Node.js**: v16 or higher
- **npm**: For package installation
- **MongoDB**: A running instance (local or cloud, e.g., MongoDB Atlas)
- **Discord Bot Token**: Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
- **Unsplash API Key**: For the `/japan` command (get from [Unsplash Developers](https://unsplash.com/developers))

### Installation
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd checklist-bot